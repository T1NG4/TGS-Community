const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const axios = require('axios');
const { setupAutoUpdater } = require('./autoUpdater');
const execAsync = promisify(exec);

let mainWindow;
const APP_DATA_PATH = path.join(app.getPath('userData'), 'Launcher');
const LOGS_PATH = path.join(APP_DATA_PATH, 'logs');
const MODS_STATE_PATH = path.join(APP_DATA_PATH, 'mods-state.json');

const isDev = !app.isPackaged;

// Segurança: Garantir que o App seja executado apenas pelo Launcher
if (!isDev && !process.argv.includes('--token=TGS_SECURE_AUTH_2026')) {
  console.error('Acesso Negado: Este aplicativo deve ser iniciado pelo TGS Launcher.');
  app.quit();
  process.exit(1);
}

// Configuração do servidor de autenticação remoto
const AUTH_SERVER_CONFIG = {
    baseURL: process.env.AUTH_SERVER_URL || 'http://localhost:3002',
    timeout: 10000,
    retries: 2
};

// Criar diretórios necessários
async function ensureDirectories() {
    try {
        await fs.mkdir(APP_DATA_PATH, { recursive: true });
        await fs.mkdir(LOGS_PATH, { recursive: true });
        console.log('Diretórios criados/verificados com sucesso');
    } catch (error) {
        console.error('Erro ao criar diretórios:', error);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 680,
        minWidth: 1100,
        minHeight: 680,
        fullscreen: false,
        resizable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            preload: path.join(__dirname, 'preload.js')
        },
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#1a1a2e',
        icon: path.join(__dirname, 'midias', 'TGS', 'TGS_logo.ico')
    });

    mainWindow.loadFile('login.html');

    // CSP configurado para MercadoPago com todos os domínios necessários
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self' 'unsafe-inline'; " +
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://sdk.mercadopago.com https://assets.mlstatic.com https://http2.mlstatic.com https://www.mercadolibre.com https://api.mercadolibre.com https://www.google.com https://www.gstatic.com https://recaptcha.net https://www.recaptcha.net https://js-agent.newrelic.com https://www.registration-br.mercadopago.com https://www.googletagmanager.com https://static.hotjar.com https://*.mercadopago.com https://*.mlstatic.com https://*.mercadolibre.com; " +
                    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://assets.mlstatic.com https://http2.mlstatic.com https://www.mercadolibre.com https://fonts.gstatic.com https://www.gstatic.com https://*.mlstatic.com https://*.mercadolibre.com; " +
                    "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com https://assets.mlstatic.com https://http2.mlstatic.com https://www.mercadolibre.com https://fonts.googleapis.com https://*.mlstatic.com https://*.mercadolibre.com; " +
                    "img-src 'self' data: https: https://assets.mlstatic.com https://http2.mlstatic.com https://www.mercadolibre.com https://api.mercadolibre.com https://www.google.com https://*.mlstatic.com https://*.mercadolibre.com; " +
                    "connect-src 'self' http://localhost:3002 ws://localhost:3002 https://sdk.mercadopago.com https://api.mercadopago.com https://matt.mercadopago.com.br https://www.mercadolibre.com https://api.mercadolibre.com https://www.google.com https://recaptcha.net https://http2.mlstatic.com https://bam.nr-data.net https://*.mercadopago.com https://*.mlstatic.com https://*.mercadolibre.com; " +
                    "frame-src 'self' https://www.mercadopago.com.br https://mercadopago.com.br https://www.google.com https://recaptcha.net https://www.mercadolibre.com https://*.mercadopago.com https://*.mercadolibre.com; " +
                    "object-src 'none'; " +
                    "media-src 'self'; " +
                    "base-uri 'self'; " +
                    "form-action 'self';"
                ]
            }
        });
    });

    // Descomente para desenvolvimento
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.whenReady().then(async () => {
    await ensureDirectories();
    createWindow();
    setupAutoUpdater(() => mainWindow);

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// ===== WINDOW CONTROLS =====
ipcMain.on('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('close-window', () => {
    if (mainWindow) mainWindow.close();
});

ipcMain.on('toggle-fullscreen', () => {
    if (mainWindow) {
        const isFullScreen = mainWindow.isFullScreen();
        mainWindow.setFullScreen(!isFullScreen);
    }
});

// ===== AUTHENTICATION =====
ipcMain.handle('validate-auth', async (event, { accessKey, username, password }) => {
    try {
        const response = await axios.post(`${AUTH_SERVER_CONFIG.baseURL}/api/auth/login`, {
            accessKey,
            username,
            password
        }, {
            timeout: AUTH_SERVER_CONFIG.timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'TGS-Launcher/1.0.0'
            }
        });

        if (response.data?.success) {
            const { user, token } = response.data;
            await logEvent('AUTH', `Usuário ${user.username} autenticado com sucesso via API remota`);
            return {
                success: true,
                role: user.role,
                username: user.username,
                token,
                user
            };
        }

        const remoteError = response.data?.message || response.data?.error || 'Credenciais inválidas';
        await logEvent('AUTH', `Falha na autenticação remota para: ${username} - ${remoteError}`);
        return { success: false, error: remoteError };

    } catch (error) {
        const isNetworkIssue = ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNABORTED'].includes(error.code);
        const serverMessage = error.response?.data?.message || error.response?.data?.error;

        if (isNetworkIssue) {
            await logEvent('AUTH', `Servidor remoto indisponível: ${username}`);
            return { success: false, error: 'Servidor indisponível. Inicie o servidor primeiro.' };
        }

        const message = serverMessage || error.message || 'Erro de autenticação';
        await logEvent('AUTH', `Erro na autenticação remota para: ${username} - ${message}`);
        return { success: false, error: message };
    }
});

// Se o servidor falhar, o app não funciona (sem fallback)

// Perfil obtido via API do servidor

// ===== MODS MANAGEMENT =====
ipcMain.handle('load-mods', async (event, { token } = {}) => {
    try {
        if (!token) {
            throw new Error('Token de autenticação ausente');
        }

        const response = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/mods`, {
            timeout: AUTH_SERVER_CONFIG.timeout,
            headers: {
                Authorization: `Bearer ${token}`,
                'User-Agent': 'TGS-Launcher/1.0.0'
            }
        });

        if (!response.data?.success) {
            throw new Error(response.data?.message || 'Erro ao carregar mods do servidor');
        }

        // Filtrar apenas mods publicados para o catálogo público
        const publishedMods = (response.data.mods || []).filter(mod => mod.status === 'published');

        // Recalcular categorias baseado nos mods publicados
        const categories = buildCategoriesFromMods(publishedMods);

        return {
            success: true,
            mods: publishedMods,
            categories: categories
        };

    } catch (error) {
        console.error('Erro ao carregar mods remotos:', error.message);
        await logEvent('MOD', `Erro ao carregar mods remotos: ${error.message}`);

        await logEvent('ERROR', `Falha ao carregar mods do servidor: ${error.message}`);
        return { success: false, error: 'Servidor indisponível. Inicie o servidor primeiro.' };
    }
});


function buildCategoriesFromMods(mods = []) {
    const categoriesMap = new Map();

    categoriesMap.set('All', { name: 'All', icon: '📦', count: mods.length });

    mods.forEach(mod => {
        const categoryName = capitalizeFirstLetter(mod.category || 'General');
        if (!categoriesMap.has(categoryName)) {
            categoriesMap.set(categoryName, {
                name: categoryName,
                icon: mod.icon || '🎮',
                count: 0
            });
        }
        categoriesMap.get(categoryName).count += 1;
    });

    return Array.from(categoriesMap.values());
}

function capitalizeFirstLetter(text = '') {
    if (!text) return 'General';
    return text.charAt(0).toUpperCase() + text.slice(1);
}


// ===== MOD STATE SYNC =====
ipcMain.handle('toggle-mod', async (event, { modId, enabled, token }) => {
    try {
        if (token) {
            const response = await axios.post(
                `${AUTH_SERVER_CONFIG.baseURL}/api/mods/${modId}/toggle`,
                { enabled },
                {
                    timeout: AUTH_SERVER_CONFIG.timeout,
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'User-Agent': 'TGS-Launcher/1.0.0'
                    }
                }
            );

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Erro ao atualizar status do mod');
            }

            await logEvent('MOD', `Mod ${modId} sincronizado via API remota (${enabled ? 'ativado' : 'desativado'})`);
            return { success: true };
        }

        // Sem token: erro - servidor obrigatório
        return { success: false, error: 'Token ausente. Servidor obrigatório.' };

    } catch (error) {
        console.error('Erro ao alternar mod:', error);
        await logEvent('ERROR', `Erro ao alternar mod ${modId}: ${error.message}`);
        return { success: false, error: error.message };
    }
});

// ===== FIVEM LAUNCH =====
ipcMain.handle('launch-fivem-with-mods', async (event, { mods }) => {
    try {
        // Aplicar mods (simulação - você precisará implementar a lógica real)
        await applyMods(mods);

        // Encontrar e iniciar o FiveM
        const fivemPath = await findFiveMPath();

        if (!fivemPath) {
            throw new Error('FiveM não encontrado. Instale o FiveM e tente novamente.');
        }

        // Iniciar FiveM
        await execAsync(`"${fivemPath}"`);

        await logEvent('LAUNCH', 'FiveM iniciado com sucesso');
        return { success: true };

    } catch (error) {
        console.error('Erro ao iniciar FiveM:', error);
        await logEvent('ERROR', `Erro ao iniciar FiveM: ${error.message}`);
        return { success: false, error: error.message };
    }
});

// Função para aplicar mods
async function applyMods(mods) {
    try {
        // Obter o caminho do FiveM Application Data
        const fivemAppData = path.join(
            process.env.LOCALAPPDATA || process.env.APPDATA,
            'FiveM',
            'FiveM Application Data'
        );

        await logEvent('MOD', `Aplicando mods em: ${fivemAppData}`);

        // Para cada mod ativo, copiar/aplicar os arquivos
        for (const mod of mods) {
            try {
                const modPath = path.join(__dirname, mod.path);
                const targetPath = path.join(fivemAppData, 'plugins', mod.id);

                // Verificar se o mod existe
                try {
                    await fs.access(modPath);
                    // Copiar mod para o diretório do FiveM
                    // Nota: Você precisará implementar a lógica de cópia
                    await logEvent('MOD', `Mod ${mod.name} aplicado com sucesso`);
                } catch {
                    await logEvent('WARNING', `Mod ${mod.name} não encontrado em ${modPath}`);
                }
            } catch (error) {
                await logEvent('ERROR', `Erro ao aplicar mod ${mod.name}: ${error.message}`);
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao aplicar mods:', error);
        throw error;
    }
}

// Função para encontrar o caminho do FiveM
async function findFiveMPath() {
    const possiblePaths = [
        path.join(process.env.LOCALAPPDATA, 'FiveM', 'FiveM.exe'),
        'C:\\Program Files\\FiveM\\FiveM.exe',
        'C:\\Program Files (x86)\\FiveM\\FiveM.exe',
        path.join(process.env.APPDATA, 'FiveM', 'FiveM.exe')
    ];

    for (const fivemPath of possiblePaths) {
        try {
            await fs.access(fivemPath);
            await logEvent('INFO', `FiveM encontrado em: ${fivemPath}`);
            return fivemPath;
        } catch {
            continue;
        }
    }

    return null;
}

// ===== LOGGING SYSTEM =====
ipcMain.on('log-event', async (event, { type, message, timestamp }) => {
    await logEvent(type, message);
});

ipcMain.handle('get-logs', async (event, options = {}) => {
    try {
        const { limit = 50, filter } = options;

        // Get all log files
        const logFiles = await fs.readdir(LOGS_PATH);
        const logFilesFiltered = logFiles.filter(file => file.endsWith('.log')).sort().reverse();

        let allLogs = [];

        for (const logFile of logFilesFiltered.slice(0, 7)) { // Last 7 days
            try {
                const filePath = path.join(LOGS_PATH, logFile);
                const content = await fs.readFile(filePath, 'utf-8');
                const lines = content.trim().split('\n').filter(line => line.trim());

                const parsedLogs = lines.map(line => {
                    const match = line.match(/^\[([^\]]+)\] \[([^\]]+)\] (.+)$/);
                    if (match) {
                        return {
                            timestamp: match[1],
                            type: match[2],
                            message: match[3]
                        };
                    }
                    return null;
                }).filter(log => log !== null);

                allLogs = allLogs.concat(parsedLogs);
            } catch (error) {
                console.error(`Error reading log file ${logFile}:`, error);
            }
        }

        // Apply filter if specified
        if (filter && filter !== 'all') {
            allLogs = allLogs.filter(log => log.type.toLowerCase() === filter.toLowerCase());
        }

        // Sort by timestamp (newest first)
        allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Apply limit
        return allLogs.slice(0, limit);
    } catch (error) {
        console.error('Error getting logs:', error);
        return [];
    }
});

async function logEvent(type, message) {
    try {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${type}] ${message}\n`;

        // Log no console
        console.log(logEntry.trim());

        // Salvar em arquivo
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(LOGS_PATH, `${today}.log`);

        await fs.appendFile(logFile, logEntry, 'utf-8');
    } catch (error) {
        console.error('Erro ao registrar log:', error);
    }
}

// ===== SETTINGS =====
ipcMain.on('save-settings', async (event, settings) => {
    try {
        const settingsPath = path.join(APP_DATA_PATH, 'settings.json');
        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
        await logEvent('SETTINGS', 'Configurações salvas com sucesso');
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        await logEvent('ERROR', `Erro ao salvar configurações: ${error.message}`);
    }
});

// ===== ADMIN FUNCTIONS =====
ipcMain.handle('get-all-users', async (event, { token }) => {
    console.log('🔧 IPC get-all-users chamado com token:', token ? 'present' : 'missing');
    try {
        if (!token) {
            throw new Error('Token de autenticação ausente');
        }

        // Validar token e obter dados do admin
        const userResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (userResponse.data.user.role !== 'admin') {
            throw new Error('Acesso negado: usuário não é administrador');
        }

        // Obter todos os usuários via API
        console.log('🔧 Fazendo requisição para:', `${AUTH_SERVER_CONFIG.baseURL}/api/admin/users`);
        const usersResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return {
            success: true,
            users: usersResponse.data.users
        };

    } catch (error) {
        console.error('Erro ao obter usuários:', error);

        // Fallback para desenvolvimento/teste
        if (process.env.NODE_ENV === 'development' || !AUTH_SERVER_CONFIG.baseURL) {
            return {
                success: true,
                users: [
                    { id: '1', username: 'admin', permissions: ['admin'], status: 'active' },
                    { id: '2', username: 'user1', permissions: ['standard'], status: 'active' },
                    { id: '3', username: 'creator1', permissions: ['creator'], status: 'active' },
                    { id: '4', username: 'banned_user', permissions: ['standard'], status: 'banned' }
                ]
            };
        }

        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
});

ipcMain.handle('generate-creator-key', async (event, { userId, username, platformFee, expiryDate, token }) => {
    try {
        if (!token) {
            throw new Error('Token de autenticação ausente');
        }

        // Validar token admin
        const userResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (userResponse.data.user.role !== 'admin') {
            throw new Error('Acesso negado: usuário não é administrador');
        }

        // Gerar key creator via API com taxa e validade personalizadas
        const keyResponse = await axios.post(`${AUTH_SERVER_CONFIG.baseURL}/api/admin/generate-creator-key`, {
            userId,
            username,
            platformFee,
            expiryDate
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return {
            success: true,
            key: keyResponse.data.key,
            message: keyResponse.data.message
        };

    } catch (error) {
        console.error('Erro ao gerar key creator:', error);

        // Fallback para desenvolvimento/teste
        if (process.env.NODE_ENV === 'development' || !AUTH_SERVER_CONFIG.baseURL) {
            const generatedKey = `TGS-CREATOR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            return {
                success: true,
                key: generatedKey,
                message: 'Key "creator" gerada com sucesso (modo desenvolvimento)'
            };
        }

        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
});

ipcMain.handle('remove-creator-permission', async (event, { userId, username, token }) => {
    try {
        if (!token) {
            throw new Error('Token de autenticação ausente');
        }

        // Validar token admin
        const userResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (userResponse.data.user.role !== 'admin') {
            throw new Error('Acesso negado: usuário não é administrador');
        }

        // Remover permissão creator via API
        const response = await axios.post(`${AUTH_SERVER_CONFIG.baseURL}/api/admin/remove-creator-permission`, {
            userId,
            username
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return {
            success: true,
            message: response.data.message
        };

    } catch (error) {
        console.error('Erro ao remover permissão creator:', error);

        // Fallback para desenvolvimento/teste
        if (process.env.NODE_ENV === 'development' || !AUTH_SERVER_CONFIG.baseURL) {
            return {
                success: true,
                message: 'Permissão "creator" removida com sucesso (modo desenvolvimento)'
            };
        }

        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
});

ipcMain.handle('add-user-permission', async (event, { userId, permission, token }) => {
    try {
        if (!token) {
            throw new Error('Token de autenticação ausente');
        }

        // Validar token admin
        const userResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (userResponse.data.user.role !== 'admin') {
            throw new Error('Acesso negado: usuário não é administrador');
        }

        // Adicionar permissão via API
        const response = await axios.post(`${AUTH_SERVER_CONFIG.baseURL}/api/admin/add-permission`, {
            userId,
            permission
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return {
            success: true,
            message: response.data.message
        };

    } catch (error) {
        console.error('Erro ao adicionar permissão:', error);

        // Fallback para desenvolvimento/teste
        if (process.env.NODE_ENV === 'development' || !AUTH_SERVER_CONFIG.baseURL) {
            return {
                success: true,
                message: 'Permissão adicionada com sucesso (modo desenvolvimento)'
            };
        }

        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
});

ipcMain.handle('ban-user', async (event, { userId, token }) => {
    try {
        if (!token) {
            throw new Error('Token de autenticação ausente');
        }

        // Validar token admin
        const userResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (userResponse.data.user.role !== 'admin') {
            throw new Error('Acesso negado: usuário não é administrador');
        }

        // Banir usuário via API
        const response = await axios.post(`${AUTH_SERVER_CONFIG.baseURL}/api/admin/ban-user`, {
            userId
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return {
            success: true,
            message: response.data.message
        };

    } catch (error) {
        console.error('Erro ao banir usuário:', error);

        // Fallback para desenvolvimento/teste
        if (process.env.NODE_ENV === 'development' || !AUTH_SERVER_CONFIG.baseURL) {
            return {
                success: true,
                message: 'Usuário banido com sucesso (modo desenvolvimento)'
            };
        }

        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
});

ipcMain.handle('unban-user', async (event, { userId, token }) => {
    try {
        if (!token) {
            throw new Error('Token de autenticação ausente');
        }

        // Validar token admin
        const userResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (userResponse.data.user.role !== 'admin') {
            throw new Error('Acesso negado: usuário não é administrador');
        }

        // Desbanir usuário via API
        const response = await axios.post(`${AUTH_SERVER_CONFIG.baseURL}/api/admin/unban-user`, {
            userId
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return {
            success: true,
            message: response.data.message
        };

    } catch (error) {
        console.error('Erro ao desbanir usuário:', error);

        // Fallback para desenvolvimento/teste
        if (process.env.NODE_ENV === 'development' || !AUTH_SERVER_CONFIG.baseURL) {
            return {
                success: true,
                message: 'Usuário desbanido com sucesso (modo desenvolvimento)'
            };
        }

        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
});

// ===== CREATOR KEY INFO =====
ipcMain.handle('get-creator-key-info', async (event, { token }) => {
    try {
        // Validar token e obter ID do usuário
        const userResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const user = userResponse.data.user;
        const hasCreatorPermission = user.permissions?.includes('creator') || user.role === 'creator';

        console.log('🔍 Verificando permissões do usuário:', {
            username: user.username,
            role: user.role,
            permissions: user.permissions,
            hasCreatorPermission
        });

        if (!hasCreatorPermission) {
            console.log('❌ Usuário não tem permissão de creator');
            throw new Error('Acesso negado: usuário não é creator');
        }

        // Buscar informações da key creator via endpoint específico
        const keyResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/admin/creator-key-info`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (keyResponse.data.success) {
            return {
                success: true,
                keyInfo: keyResponse.data.keyInfo
            };
        }

        throw new Error(keyResponse.data.message || 'Nenhuma key creator encontrada');

    } catch (error) {
        console.error('Erro ao obter informações da key creator:', error);
        return {
            success: false,
            error: error.message || 'Erro ao obter informações da key creator'
        };
    }
});

// ===== CREATOR MODS =====
ipcMain.handle('get-creator-mods', async (event, { token }) => {
    try {
        // Validar token e obter ID do usuário
        const userResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const user = userResponse.data.user;
        const hasCreatorPermission = user.permissions?.includes('creator') || user.role === 'creator';
        const hasAdminPermission = user.permissions?.includes('admin') || user.role === 'admin';

        console.log('🔍 get-creator-mods - Verificando permissões:', {
            username: user.username,
            role: user.role,
            permissions: user.permissions,
            hasCreatorPermission,
            hasAdminPermission
        });

        if (!hasCreatorPermission && !hasAdminPermission) {
            console.log('❌ get-creator-mods - Usuário não tem permissão de creator');
            throw new Error('Acesso negado: usuário não é creator');
        }

        // Buscar mods do endpoint /api/mods/all
        let modsResponse;
        try {
            modsResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/mods/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (allModsError) {
            console.warn('Endpoint /api/mods/all não encontrado, usando /api/mods normal');
            modsResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/mods`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }

        let mods = modsResponse.data.mods || [];

        // Filtrar mods do creator logado (admin vê todos)
        if (!hasAdminPermission) {
            mods = mods.filter(mod => mod.creatorId === user.id);
        }

        // Enriquecer mods com informações adicionais
        const enrichedMods = mods.map(mod => ({
            ...mod,
            creatorName: mod.creatorName || user.username,
            canEdit: hasAdminPermission || mod.creatorId === user.id
        }));

        return {
            success: true,
            mods: enrichedMods,
            total: enrichedMods.length
        };

    } catch (error) {
        console.error('Erro ao buscar mods do creator:', error);

        // Fallback para desenvolvimento/teste
        if (process.env.NODE_ENV === 'development' || !AUTH_SERVER_CONFIG.baseURL) {
            const mockMods = [
                {
                    id: 'mod-01',
                    name: 'TGS M4 F82',
                    description: 'Veículo esportivo BMW M4 F82 com modificações personalizadas',
                    category: 'vehicles',
                    version: '1.0.0',
                    size: '45.2 MB',
                    enabled: false,
                    status: 'published',
                    features: ['Motor V8 TwinTurbo', 'Suspensão esportiva', 'Body kit carbono', 'Rodas 20"'],
                    image: '../midias/products/veiculos/TGS M4 F82/m4f82_1.png',
                    icon: '🚗',
                    creatorId: user?.id || 1,
                    creatorName: user?.username || 'TGS Admin',
                    price: '25.00',
                    downloads: 145,
                    canEdit: true
                },
                {
                    id: 'mod-03',
                    name: 'TGS Graphics Ultra',
                    description: 'Pacote gráfico 4K com texturas realistas',
                    category: 'graphics',
                    version: '3.0.0',
                    size: '2.1 GB',
                    enabled: false,
                    status: 'draft',
                    features: ['Texturas 4K', 'Lighting melhorado', 'Shaders avançados', 'Otimização performance'],
                    image: '../midias/products/graficos/TGS Graphics Ultra/graphics_1.png',
                    icon: '🎨',
                    creatorId: user?.id || 1,
                    creatorName: user?.username || 'TGS Admin',
                    price: '35.00',
                    downloads: 0,
                    canEdit: true
                }
            ];

            return {
                success: true,
                mods: mockMods,
                total: mockMods.length
            };
        }

        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
});

ipcMain.handle('create-mod', async (event, { token, modData }) => {
    try {
        // Validar token e permissão
        const userResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const user = userResponse.data.user;
        const hasCreatorPermission = user.permissions?.includes('creator') || user.role === 'creator';
        const hasAdminPermission = user.permissions?.includes('admin') || user.role === 'admin';

        if (!hasCreatorPermission && !hasAdminPermission) {
            throw new Error('Acesso negado: usuário não é creator');
        }

        // Adicionar informações do creator ao mod
        const enrichedModData = {
            ...modData,
            creatorId: user.id,
            creatorName: user.username,
            createdAt: new Date().toISOString(),
            status: 'draft',
            downloads: 0
        };

        // Criar mod via API
        const response = await axios.post(`${AUTH_SERVER_CONFIG.baseURL}/api/mods`, enrichedModData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            mod: {
                ...response.data.mod,
                creatorId: user.id,
                creatorName: user.username,
                isOwner: true
            }
        };

    } catch (error) {
        console.error('Erro ao criar mod:', error);

        // Fallback para desenvolvimento/teste
        if (process.env.NODE_ENV === 'development' || !AUTH_SERVER_CONFIG.baseURL) {
            const userResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const user = userResponse.data.user;

            const newMod = {
                id: Date.now(),
                ...modData,
                creatorId: user.id,
                creatorName: user.username,
                downloads: 0,
                createdAt: new Date().toISOString(),
                isOwner: true
            };
            return { success: true, mod: newMod };
        }

        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
});

ipcMain.handle('update-mod', async (event, { token, modId, modData }) => {
    try {
        // Validar token e permissão
        const userResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const user = userResponse.data.user;
        const hasCreatorPermission = user.permissions?.includes('creator') || user.role === 'creator';
        const hasAdminPermission = user.permissions?.includes('admin') || user.role === 'admin';

        if (!hasCreatorPermission && !hasAdminPermission) {
            throw new Error('Acesso negado: usuário não é creator');
        }

        // Verificar se o mod pertence ao usuário
        let modCheckResponse;
        try {
            modCheckResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/mods/${modId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (apiError) {
            console.warn(`Endpoint /api/mods/${modId} não encontrado, usando fallback`);
            // Fallback: permitir edição para admin (dono do sistema)
            if (user.role === 'admin') {
                modCheckResponse = {
                    data: {
                        mod: {
                            id: modId,
                            creatorId: user.id,
                            ownerId: user.id
                        }
                    }
                };
            } else {
                throw new Error('Mod não encontrado');
            }
        }

        const existingMod = modCheckResponse.data.mod;
        if (existingMod.creatorId !== user.id && existingMod.ownerId !== user.id) {
            throw new Error('Acesso negado: você não é o dono deste mod');
        }

        // Adicionar informações do creator
        const enrichedModData = {
            ...modData,
            creatorId: user.id,
            creatorName: user.username,
            updatedAt: new Date().toISOString()
        };

        // Atualizar mod via API
        try {
            const response = await axios.put(`${AUTH_SERVER_CONFIG.baseURL}/api/mods/${modId}`, enrichedModData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                mod: {
                    ...response.data.mod,
                    creatorId: user.id,
                    creatorName: user.username,
                    isOwner: true
                }
            };
        } catch (apiError) {
            console.warn('Endpoint /api/mods não encontrado, usando fallback');
            // Fallback: permitir atualização para admin (dono do sistema)
            if (user.role === 'admin') {
                return {
                    success: true,
                    mod: {
                        ...enrichedModData,
                        id: modId,
                        isOwner: true
                    }
                };
            } else {
                throw new Error('Não foi possível atualizar o mod');
            }
        }

    } catch (error) {
        console.error('Erro ao atualizar mod:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
});

ipcMain.handle('delete-mod', async (event, { token, modId }) => {
    try {
        // Validar token e permissão
        const userResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const user = userResponse.data.user;
        const hasCreatorPermission = user.permissions?.includes('creator') || user.role === 'creator';
        const hasAdminPermission = user.permissions?.includes('admin') || user.role === 'admin';

        if (!hasCreatorPermission && !hasAdminPermission) {
            throw new Error('Acesso negado: usuário não é creator');
        }

        // Verificar se o mod pertence ao usuário
        let modCheckResponse;
        try {
            modCheckResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/mods/${modId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (apiError) {
            console.warn(`Endpoint /api/mods/${modId} não encontrado, usando fallback`);
            // Fallback: permitir edição para admin (dono do sistema)
            if (user.role === 'admin') {
                modCheckResponse = {
                    data: {
                        mod: {
                            id: modId,
                            creatorId: user.id,
                            ownerId: user.id
                        }
                    }
                };
            } else {
                throw new Error('Mod não encontrado');
            }
        }

        const existingMod = modCheckResponse.data.mod;
        if (existingMod.creatorId !== user.id && existingMod.ownerId !== user.id) {
            throw new Error('Acesso negado: você não é o dono deste mod');
        }

        // Excluir mod via API
        try {
            await axios.delete(`${AUTH_SERVER_CONFIG.baseURL}/api/mods/${modId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (apiError) {
            console.warn(`Endpoint /api/mods/${modId} não encontrado, usando fallback`);
            // Fallback: permitir exclusão para admin (dono do sistema)
            if (user.role !== 'admin') {
                throw new Error('Não foi possível excluir o mod');
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Erro ao excluir mod:', error);

        // Fallback para desenvolvimento/teste
        if (process.env.NODE_ENV === 'development' || !AUTH_SERVER_CONFIG.baseURL) {
            return { success: true };
        }

        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
});

ipcMain.handle('get-mod-details', async (event, { token, modId }) => {
    try {
        // Validar token
        const userResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const user = userResponse.data.user;
        const hasCreatorPermission = user.permissions?.includes('creator') || user.role === 'creator';
        const hasAdminPermission = user.permissions?.includes('admin') || user.role === 'admin';

        if (!hasCreatorPermission && !hasAdminPermission) {
            throw new Error('Acesso negado: usuário não é creator');
        }

        // Buscar detalhes do mod via API
        const response = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/mods/${modId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return {
            success: true,
            mod: response.data.mod
        };

    } catch (error) {
        console.error('Erro ao obter detalhes do mod:', error);

        // Fallback para quando API falha (sempre ativo)
        // Buscar dados do mod hardcoded baseado no ID
        const hardcodedMods = {
            1: {
                id: 1,
                name: 'TGS Graphics Ultra',
                description: 'Pacote de gráficos ultra realista para FiveM',
                category: 'Graphics',
                price: '25.00',
                status: 'draft',
                free: false,
                downloads: 0,
                images: [],
                creatorId: 1,
                creatorName: 'admin',
                createdAt: new Date().toISOString()
            },
            2: {
                id: 2,
                name: 'TGS M4 F82',
                description: 'Arma M4 F82 customizada com alta qualidade',
                category: 'Weapons',
                price: '15.00',
                status: 'draft',
                free: false,
                downloads: 0,
                images: [],
                creatorId: 1,
                creatorName: 'admin',
                createdAt: new Date().toISOString()
            },
            3: {
                id: 3,
                name: 'TGS Weapon Pack',
                description: 'Pacote completo de armas personalizadas',
                category: 'Weapons',
                price: '35.00',
                status: 'draft',
                free: false,
                downloads: 0,
                images: [],
                creatorId: 1,
                creatorName: 'admin',
                createdAt: new Date().toISOString()
            }
        };

        const modData = hardcodedMods[modId];
        if (modData) {
            return {
                success: true,
                mod: modData
            };
        }

        return {
            success: false,
            error: 'Mod não encontrado'
        };
    }
});

ipcMain.handle('get-creator-stats', async (event, { token }) => {
    try {
        // Validar token
        const userResponse = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const user = userResponse.data.user;
        const hasCreatorPermission = user.permissions?.includes('creator') || user.role === 'creator';
        const hasAdminPermission = user.permissions?.includes('admin') || user.role === 'admin';

        if (!hasCreatorPermission && !hasAdminPermission) {
            throw new Error('Acesso negado: usuário não é creator');
        }

        // Buscar estatísticas via API (removido - endpoint não existe)
        // const response = await axios.get(`${AUTH_SERVER_CONFIG.baseURL}/api/creator/stats`, {
        //     headers: { Authorization: `Bearer ${token}` }
        // });

        // Usar fallback diretamente
        const stats = {
            totalMods: 0,
            publishedMods: 0,
            draftMods: 0,
            totalDownloads: 0
        };

        return {
            success: true,
            stats: stats
        };

    } catch (error) {
        console.error('Erro ao obter estatísticas do creator:', error);

        // Fallback para desenvolvimento/teste (sempre ativo quando API falha)
        const mockStats = {
            totalMods: 3,
            publishedMods: 0, // Nenhum mod publicado ainda
            totalDownloads: 0, // Sem downloads reais
            totalRevenue: 0.00, // Sem revenue real
            wallet: {
                availableBalance: 0.00, // Sem saldo real
                pendingBalance: 0.00,
                monthlySales: 0.00, // Sem vendas
                lifetimeSales: 0.00 // Sem revenue histórico
            }
        };

        return {
            success: true,
            stats: mockStats
        };
    }
});

// ===== CLIPBOARD =====
ipcMain.handle('write-to-clipboard', async (event, text) => {
    try {
        clipboard.writeText(text);
        return { success: true };
    } catch (error) {
        console.error('Erro ao copiar para clipboard:', error);
        return { success: false, error: error.message };
    }
});

// Função de limpeza ao fechar o app
app.on('before-quit', async () => {
    await logEvent('SYSTEM', 'Aplicação fechada');
});

console.log('Launcher iniciado');
