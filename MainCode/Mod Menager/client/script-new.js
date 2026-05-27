// Global state
let modsData = [];
let categoriesData = [];
let currentFilter = 'All';
let currentUser = null;

const CATEGORY_ICONS = {
    Graphics: '🎨',
    Weapons: '🔫',
    Vehicles: '🚗',
    Audio: '🔊',
    Performance: '⚡',
    Maps: '🗺️',
    Scripts: '💻',
    General: '🎮'
};

// Require fs/path only when available (Electron/node). In browser we fallback to fetch() and localStorage.
let fs = null;
let path = null;
try {
    if (typeof require === 'function') {
        fs = require('fs');
        path = require('path');
    }

// Atualizar estado (habilitado/desabilitado) do botão de compra
function updatePurchaseButtonState(mod, selectedModel, purchaseBtn) {
    if (!purchaseBtn || !mod) return;

    const variations = mod.variations || mod.models || [];
    const hasVariations = Array.isArray(variations) && variations.length > 0;

    if (hasVariations) {
        const isStandalone = !selectedModel || selectedModel === 'standalone';
        purchaseBtn.disabled = isStandalone;
        purchaseBtn.classList.toggle('disabled', isStandalone);
    } else {
        const basePrice = Number(mod.price) || 0;
        const disable = basePrice <= 0;
        purchaseBtn.disabled = disable;
        purchaseBtn.classList.toggle('disabled', disable);
    }
}
} catch (e) {
    fs = null;
    path = null;
};

// Função para controlar dropdowns
function toggleDropdown(button, event) {
    const dropdown = button.parentElement;
    const menu = dropdown.querySelector('.dropdown-menu');
    const isOpen = menu.classList.contains('show');
    
    // Fechar todos os outros dropdowns
    document.querySelectorAll('.dropdown-menu.show').forEach(otherMenu => {
        if (otherMenu !== menu) {
            otherMenu.classList.remove('show');
        }
    });
    
    // Toggle dropdown atual
    menu.classList.toggle('show');
    
    // Calcular posição fixed se estiver abrindo
    if (!isOpen) {
        const buttonRect = button.getBoundingClientRect();
        
        // Posicionar o menu próximo ao botão
        menu.style.left = `${buttonRect.right - 170}px`; // 170px = largura do menu
        menu.style.top = `${buttonRect.bottom + 4}px`;
        
        // Ajustar se sair da tela à direita
        if (buttonRect.right < 170) {
            menu.style.left = `${buttonRect.left}px`;
        }
        
        // Ajustar se sair da tela embaixo
        const viewportHeight = window.innerHeight;
        if (buttonRect.bottom + 200 > viewportHeight) {
            menu.style.top = `${buttonRect.top - 200}px`;
        }
    }
    
    // Fechar dropdown ao clicar fora
    if (!isOpen) {
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target)) {
                    menu.classList.remove('show');
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 100);
    }
}

// Currency helpers
// Taxa fixa de conversão USD -> BRL (pode ser ajustada conforme cotação atual)
const USD_TO_BRL_RATE = 5.0;

function isBRLCurrencyEnabled() {
    try {
        return localStorage.getItem('useBRL') === 'true';
    } catch (e) {
        return false;
    }
}

function formatCurrency(value) {
    const numUSD = Number(value) || 0;
    if (isBRLCurrencyEnabled()) {
        // Converter de USD para BRL e formatar em Real
        const numBRL = numUSD * USD_TO_BRL_RATE;
        return numBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    // Padrão em dólar
    return `$ ${numUSD.toFixed(2)}`;
}

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeMods(mods = []) {
    return mods.map(mod => ({
        id: mod.id || generateUUID(),
        name: mod.name || 'Mod sem nome',
        description: mod.description || 'Sem descrição',
        category: capitalizeFirstLetter(mod.category || 'General'),
        icon: mod.icon || CATEGORY_ICONS[capitalizeFirstLetter(mod.category || 'General')] || CATEGORY_ICONS.General,
        version: mod.version || '1.0.0',
        size: mod.size || '—',
        features: mod.features && mod.features.length ? mod.features : (mod.tags || []).map(tag => tag.toUpperCase()),
        path: mod.path || '',
        enabled: Boolean(mod.enabled),
        image: mod.image ? buildModImagePath(mod) : null,
        // Adicionar galeria de imagens para demonstração
        images: mod.images || (mod.image ? [mod.image] : [
            `https://picsum.photos/seed/${mod.name || 'mod'}1/800/450.jpg`,
            `https://picsum.photos/seed/${mod.name || 'mod'}2/800/450.jpg`,
            `https://picsum.photos/seed/${mod.name || 'mod'}3/800/450.jpg`
        ]),
        // Preço base e variações para teste no mod "TGS Graphics Ultra"
        // Standalone começa com 0 e apenas variações têm preço
        price: mod.name === 'TGS Graphics Ultra' ? 0 : (mod.price || 0),
        variations: mod.name === 'TGS Graphics Ultra'
            ? [
                { value: 'mensal', name: 'Mensal', price: 29.9 },
                { value: 'anual', name: 'Anual', price: 199.9 }
            ]
            : (mod.variations || mod.models || [])
    }));
}

function buildCategoriesFromMods(mods = []) {
    const counts = {};
    mods.forEach(mod => {
        const category = mod.category || 'General';
        counts[category] = (counts[category] || 0) + 1;
    });

    return [
        { name: 'All', icon: CATEGORY_ICONS.General, count: mods.length },
        ...Object.entries(counts).map(([name, count]) => ({
            name,
            icon: CATEGORY_ICONS[name] || CATEGORY_ICONS.General,
            count
        }))
    ];
}

function buildModImagePath(mod) {
    if (mod.image?.startsWith('http')) return mod.image;
    if (mod.image?.includes('midias/')) return mod.image;
    const categoryDir = mod.category ? mod.category.toLowerCase().replace(/\s+/g, '-') : 'general';
    return `midias/${categoryDir}/${mod.image}`;
}

function capitalizeFirstLetter(text = '') {
    if (!text) return 'General';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    setupWindowControls();
    
    if (document.querySelector('.login-form')) {
        setupLoginPage();
    }
    
    if (document.querySelector('.dashboard-page')) {
        setupDashboardPage();
        setupMobileMenu();
        checkPaymentStatusFromURL();
        initializeAdminMenu();
        initializeCreatorMenu();
        if (window.tgsModEvents) {
            window.tgsModEvents.trackDashboardOpen('dashboard');
        }
    }
    
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// Verificar status de pagamento da URL (retorno do Mercado Pago)
function checkPaymentStatusFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const preferenceId = urlParams.get('preference_id');
    const paymentId = urlParams.get('payment_id');
    const status = urlParams.get('status');
    
    if (paymentStatus || paymentId) {
        let message = '';
        let type = 'info';
        
        if (paymentStatus === 'success' || status === 'approved') {
            message = 'Pagamento aprovado com sucesso! Sua chave foi gerada.';
            type = 'success';
            
            // Atualizar interface após pagamento
            setTimeout(() => {
                loadUserAccessKeys();
                loadMods();
            }, 2000);
            
        } else if (paymentStatus === 'failure' || status === 'rejected') {
            message = 'Pagamento recusado. Tente novamente com outro método.';
            type = 'error';
            
        } else if (paymentStatus === 'pending' || status === 'in_process') {
            message = 'Pagamento em processamento. Você receberá um email quando for aprovado.';
            type = 'info';
        }
        
        if (message) {
            showNotification(message, type);
            
            // Limpar URL para não mostrar mensagem novamente
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

// Mobile menu functionality
function setupMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');
    
    if (!menuToggle || !sidebar || !overlay) return;
    
    const toggleSidebar = () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    };
    
    menuToggle.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 992) {
                toggleSidebar();
            }
        });
    });
    
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 992) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        }, 250);
    });
}

// Setup window controls
function setupWindowControls() {
    if (!window.ipcRenderer) return;
    
    const minimizeBtn = document.getElementById('minimize-btn');
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
            window.ipcRenderer.send('minimize-window');
        });
    }

    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            window.ipcRenderer.send('toggle-fullscreen');
        });
    }
    
    // Currency toggle (USD/BRL)
    const currencyToggle = document.getElementById('currencyToggle');
    if (currencyToggle) {
        // Estado inicial a partir do localStorage
        const useBRL = isBRLCurrencyEnabled();
        if (useBRL) {
            currencyToggle.classList.add('active');
        }

        currencyToggle.addEventListener('click', () => {
            currencyToggle.classList.toggle('active');
            const isActive = currencyToggle.classList.contains('active');
            localStorage.setItem('useBRL', isActive);

            // Atualizar preço no modal de detalhes, se estiver aberto
            const modal = document.getElementById('modDetailsModal');
            if (modal && modal.style.display === 'flex' && window.currentModDetails) {
                // Recalcular preço com base no modelo selecionado atual
                const modelSelect = document.getElementById('modelSelect');
                const selectedModel = modelSelect ? modelSelect.value : 'standalone';
                updateModPrice(window.currentModDetails, selectedModel);
                
                // Atualizar também o texto das opções do seletor
                populateModelSelector(window.currentModDetails);
                
                // Restaurar seleção anterior
                if (modelSelect) {
                    modelSelect.value = selectedModel;
                }
            }

            showNotification(`Moeda em ${isActive ? 'Real (R$)' : 'Dólar ($)'}`, 'success');
        });
    }
    
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.ipcRenderer.send('close-window');
        });
    }
}

// Login Page Functionality
function setupLoginPage() {
    const loginForm = document.getElementById('loginForm');
    
    // Event listener para "Crie sua conta"
    const createAccountHint = document.querySelector('.login-hint');
    if (createAccountHint) {
        createAccountHint.style.cursor = 'pointer';
        createAccountHint.addEventListener('click', (e) => {
            e.preventDefault();
            showSignupModal();
        });
    }
    
    // Event listener para "Esqueceu seu acesso"
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRecoveryModal();
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');
            const errorText = document.getElementById('errorText');
            
            // Hide error message
            errorMessage.style.display = 'none';
            
            try {
                // Validate credentials
                const authResult = await validateCredentials(username, password);
                
                if (authResult.success) {
                    // Store login state
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('username', username);
                    localStorage.setItem('userRole', authResult.role);
                    localStorage.setItem('loginTime', Date.now().toString());

                    if (authResult.token) {
                        localStorage.setItem('authToken', authResult.token);
                        localStorage.setItem('remoteMode', 'true');
                    } else {
                        localStorage.removeItem('remoteMode');
                    }

                    if (authResult.user) {
                        localStorage.setItem('userData', JSON.stringify(authResult.user));
                    }
                    
                    // Log authentication
                    if (window.ipcRenderer) {
                        window.ipcRenderer.send('log-event', {
                            type: 'AUTH',
                            message: `Usuário ${username} autenticado com sucesso`,
                            timestamp: new Date().toISOString()
                        });
                    }

                    if (window.tgsModEvents) {
                        window.tgsModEvents.trackLoginSuccess('password');
                    }
                    
                    window.location.href = 'dashboard.html';
                } else {
                    // Show error message
                    errorMessage.style.display = 'flex';

                    if (window.tgsModEvents) {
                        window.tgsModEvents.trackLoginFailed(
                            authResult.error || 'invalid_credentials'
                        );
                    }
                    
                    // Mensagens específicas para diferentes tipos de erro
                    if (authResult.error) {
                        if (authResult.error.includes('conexão') || authResult.error.includes('servidor')) {
                            errorText.textContent = 'Servidor de autenticação indisponível. Tentando modo offline...';
                        } else if (authResult.error.includes('inválida')) {
                            errorText.textContent = 'Credenciais inválidas. Verifique seus dados.';
                        } else {
                            errorText.textContent = authResult.error;
                        }
                    } else {
                        errorText.textContent = 'Erro ao autenticar. Tente novamente.';
                    }
                    
                    // Shake animation
                    loginForm.style.animation = 'shake 0.5s';
                    setTimeout(() => {
                        loginForm.style.animation = '';
                    }, 500);
                }
            } catch (error) {
                errorText.textContent = 'Erro ao validar credenciais. Tente novamente.';
                errorMessage.style.display = 'flex';
                if (window.tgsModEvents) {
                    window.tgsModEvents.trackLoginFailed(error?.message || 'exception');
                }
                console.error('Login error:', error);
            }
        });
    }
    
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'dashboard.html';
    }
    
    // Event listeners para os modais
    const closeRecoveryModal = document.getElementById('closeRecoveryModal');
    const closeSignupModal = document.getElementById('closeSignupModal');
    const recoveryForm = document.getElementById('recoveryForm');
    const signupForm = document.getElementById('signupForm');
    const refreshCaptcha = document.getElementById('refreshCaptcha');
    const refreshSignupCaptcha = document.getElementById('refreshSignupCaptcha');
    
    // Fechar modal de recuperação
    if (closeRecoveryModal) {
        closeRecoveryModal.addEventListener('click', hideRecoveryModal);
    }
    
    // Fechar modal de criação de conta
    if (closeSignupModal) {
        closeSignupModal.addEventListener('click', hideSignupModal);
    }
    
    // Formulário de recuperação
    if (recoveryForm) {
        recoveryForm.addEventListener('submit', handleRecoverySubmit);
    }
    
    // Formulário de criação de conta
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupSubmit);
    }
    
    // Botões de refresh CAPTCHA
    if (refreshCaptcha) {
        refreshCaptcha.addEventListener('click', refreshCaptchaImage);
    }
    
    if (refreshSignupCaptcha) {
        refreshSignupCaptcha.addEventListener('click', refreshSignupCaptchaImage);
    }
    
    // Fechar modais ao clicar fora
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            if (e.target.id === 'recoveryModal') {
                hideRecoveryModal();
            } else if (e.target.id === 'signupModal') {
                hideSignupModal();
            }
        }
    });
    
    // Fechar modais com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const recoveryModal = document.getElementById('recoveryModal');
            const signupModal = document.getElementById('signupModal');
            
            if (recoveryModal && recoveryModal.style.display === 'flex') {
                hideRecoveryModal();
            } else if (signupModal && signupModal.style.display === 'flex') {
                hideSignupModal();
            }
        }
    });
}

// Validate credentials
async function validateCredentials(username, password) {
    try {
        if (window.ipcRenderer) {
            const result = await window.ipcRenderer.invoke('validate-auth', { username, password });
            return result;
        } else {
            // Fallback for testing
            if (username === 'admin' && password === 'TGS_pedro2004') {
                return { success: true, role: 'admin' };
            } else if (username === 'user' && password === 'user123') {
                return { success: true, role: 'user' };
            }
            return { success: false, error: 'Credenciais inválidas' };
        }
    } catch (error) {
        console.error('Validation error:', error);
        return { success: false, error: 'Erro ao validar credenciais' };
    }
}

// Dashboard Page Functionality
function setupDashboardPage() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }
    
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const username = userData.username || localStorage.getItem('username') || 'Usuário';
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = username;
    }
    
    // Setup navigation
    setupNavigation();
    
    // Setup user profile click
    const userInfoBtn = document.getElementById('userInfoBtn');
    if (userInfoBtn) {
        userInfoBtn.addEventListener('click', () => {
            switchPage('profile');
        });
    }
    
    // Setup logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // Load user profile and keys
    loadUserProfile();
    
    // Load mods
    loadMods();
    
    // Verify active mods access after loading
    setTimeout(() => {
        verifyActiveModsAccess();
    }, 1000);
    
    // Setup search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterMods(e.target.value);
        });
    }
    
    // Setup toggle view button
    const toggleViewBtn = document.getElementById('toggleView');
    if (toggleViewBtn) {
        toggleViewBtn.addEventListener('click', toggleView);
    }
    
    // Setup launch button
    const launchButton = document.getElementById('launchFiveM');
    if (launchButton) {
        launchButton.addEventListener('click', launchFiveM);
    }
    
    // Setup settings toggles
    setupSettings();
    
    // Setup logs
    setupLogs();
    
    // Setup enabled mods actions
    setupEnabledModsActions();
    
    // Initialize priority order for existing enabled mods
    initializePriorityOrder();
}

// Load mods from config
async function loadMods() {
    try {
        if (window.ipcRenderer) {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Sessão expirada. Faça login novamente.');
            }

            const data = await window.ipcRenderer.invoke('load-mods', { token });

            if (!data?.success) {
                throw new Error(data?.error || 'Erro ao carregar mods');
            }

            modsData = normalizeMods(data.mods || []);
            categoriesData = data.categories?.length ? data.categories : buildCategoriesFromMods(modsData);

            if (data.warning) {
                showNotification(data.warning, 'warning');
            }
        } else {
            // Fallback for testing - load from mods-config.json
            const response = await fetch('mods-config.json');
            const data = await response.json();
            modsData = data.mods;
            categoriesData = data.categories;
        }
        
        updateCategoryCounts();
        renderCategories();
        renderMods();
        updateEnabledCount();
    } catch (error) {
        console.error('Error loading mods:', error);
        showNotification(error.message || 'Erro ao carregar mods', 'error');
    }
}

// Render categories
function renderCategories() {
    const categoriesFilter = document.querySelector('.categories-filter');
    if (!categoriesFilter) return;
    
    categoriesFilter.innerHTML = '';
    
    categoriesData.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-btn' + (category.name === 'All' ? ' active' : '');
        button.setAttribute('data-category', category.name);
        button.innerHTML = `
            <span class="category-icon">${category.icon}</span>
            <span>${category.name === 'All' ? 'Todos' : category.name}</span>
            <span class="category-count" id="count-${category.name.toLowerCase()}">${category.count}</span>
        `;
        
        button.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = category.name;
            renderMods();
        });
        
        categoriesFilter.appendChild(button);
    });
}

// Update category counts
function updateCategoryCounts() {
    categoriesData.forEach(cat => {
        if (cat.name === 'All') {
            cat.count = modsData.length;
        } else {
            cat.count = modsData.filter(mod => mod.category === cat.name).length;
        }
    });
}

// Render mods
function renderMods() {
    const container = document.getElementById('modsContainer');
    if (!container) return;
    
    // Filter mods
    let filteredMods = modsData;
    if (currentFilter !== 'All') {
        filteredMods = modsData.filter(mod => mod.category === currentFilter);
    }
    
    // Clear container
    container.innerHTML = '';
    
    if (filteredMods.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Nenhum mod encontrado</p>
            </div>
        `;
        return;
    }
    
    // Create mod cards
    filteredMods.forEach(mod => {
        const card = createModCard(mod);
        container.appendChild(card);
    });
}

// Create mod card
function createModCard(mod) {
    const card = document.createElement('div');
    card.className = `mod-card ${mod.enabled ? 'enabled' : ''}`;
    card.dataset.modId = mod.id;
    
    // Usar primeira imagem da galeria como imagem de capa no header
    const coverImage = mod.images && mod.images.length > 0 ? mod.images[0] : mod.image;
    const headerBackground = coverImage
        ? `background-image: url('${coverImage}'); background-size: cover; background-position: center;`
        : `background: linear-gradient(135deg, var(--primary-light), var(--primary-color));`;

    // Informações do creator
    const creatorInfo = mod.creatorId ? `
        <div class="mod-creator">
            <i class="fas fa-user"></i>
            <span class="creator-name">${mod.creatorName || 'Unknown'}</span>
            ${mod.verified ? '<i class="fas fa-check-circle verified-badge" title="Creator Verificado"></i>' : ''}
        </div>
    ` : '';

    card.innerHTML = `
        <div class="mod-content-wrapper">
            <div class="mod-header" style="${headerBackground}">
            </div>
            <div class="mod-body">
                <h3 class="mod-name clickable" data-mod-id="${mod.id}">${mod.name}</h3>
                ${creatorInfo}
                <p class="mod-description">${mod.description}</p>
                <div class="mod-features">
                    ${mod.features.map(feature => `
                        <span class="feature-tag">
                            <i class="fas fa-check-circle"></i> ${feature}
                        </span>
                    `).join('')}
                </div>
            </div>
        </div>
        <div class="mod-footer">
            <div class="mod-info">
                <span class="mod-version">
                    <i class="fas fa-code-branch"></i> v${mod.version}
                </span>
                <span class="mod-size">
                    <i class="fas fa-hdd"></i> ${mod.size}
                </span>
                ${mod.downloads ? `
                    <span class="mod-downloads">
                        <i class="fas fa-download"></i> ${mod.downloads}
                    </span>
                ` : ''}
            </div>
            <button class="toggle-mod-btn ${mod.enabled ? 'enabled' : ''}" data-mod-id="${mod.id}">
                <i class="fas ${mod.enabled ? 'fa-times' : 'fa-download'}"></i>
                ${mod.enabled ? 'Desativar' : 'Ativar'}
            </button>
        </div>
    `;
    
    // Add toggle event
    const toggleBtn = card.querySelector('.toggle-mod-btn');
    toggleBtn.addEventListener('click', () => toggleMod(mod.id));
    
    // Add click events for mod details
    const modName = card.querySelector('.mod-name.clickable');
    const modImage = card.querySelector('.mod-content-wrapper');
    
    modName.addEventListener('click', (e) => {
        e.stopPropagation();
        showModDetailsModal(mod);
    });
    
    modImage.addEventListener('click', () => {
        showModDetailsModal(mod);
    });
    
    return card;
}

// Toggle mod
async function toggleMod(modId) {
    const mod = modsData.find(m => m.id === modId);
    if (!mod) return;

    const isEnabling = !mod.enabled;

    // Se estiver ativando, verificar acesso da conta ao mod antes de baixar/instalar
    if (isEnabling) {
        try {
            if (window.ipcRenderer) {
                const token = getAuthToken();
                const userRole = localStorage.getItem('userRole');

                // Verificação de acesso via backend: confere se a conta possui
                // alguma key que permita o uso deste mod
                try {
                    // Primeiro verificar se servidor está online
                    const healthCheck = await fetch('http://localhost:3002/api/health', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 2000
                    });
                    
                    if (healthCheck.ok) {
                        // Servidor online, tentar verificar acesso
                        const accessResult = await window.ipcRenderer.invoke('check-mod-access', {
                            modId,
                            token
                        });

                        if (!accessResult || !accessResult.success) {
                            const message = accessResult?.message || accessResult?.error ||
                                'Você não possui uma chave com acesso a este mod.';
                            showAccessDeniedModal(mod, message);
                            return; // Não continua com o download/instalação
                        }
                    } else {
                        throw new Error('Servidor offline');
                    }
                } catch (ipcError) {
                    // Se o handler não existe ou servidor offline, fazer verificação simples baseada no tipo de usuário
                    console.warn('Handler check-mod-access não implementado ou servidor offline - usando verificação simples');
                    
                    // Verificação simples: admin tem acesso, user normal não
                    if (userRole !== 'admin') {
                        showAccessDeniedModal(mod, 'Você não possui uma chave com acesso a este mod.');
                        return; // Não continua com o download/instalação
                    }
                    // Admin pode continuar (não mostra modal)
                }
            } else {
                // Fallback em ambiente sem Electron: permitir tudo ou simular regras simples
                // Aqui poderíamos simular bloqueios específicos se necessário.
            }
        } catch (error) {
            console.error('Erro ao verificar acesso ao mod:', error);
            
            // Se for erro de conexão, usar verificação simples
            if (error.message && error.message.includes('ECONNREFUSED')) {
                console.warn('Servidor não disponível - usando verificação simples de usuário');
                const userRole = localStorage.getItem('userRole');
                
                if (userRole !== 'admin') {
                    showAccessDeniedModal(mod, 'Você não possui uma chave com acesso a este mod.');
                    return;
                }
                // Admin pode continuar
            } else {
                showNotification('Erro ao verificar acesso ao mod. Tente novamente.', 'error');
                return;
            }
        }
    }

    const card = document.querySelector(`[data-mod-id="${modId}"]`);
    const toggleBtn = card?.querySelector('.toggle-mod-btn');

    if (!toggleBtn) return;

    // Se estiver ativando, mostrar loading
    if (isEnabling) {
        toggleBtn.disabled = true;
        const originalContent = toggleBtn.innerHTML;
        toggleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Baixando...';

        // Simular tempo de download (2-4 segundos)
        const downloadTime = Math.random() * 2000 + 2000; // 2-4 segundos
        await new Promise(resolve => setTimeout(resolve, downloadTime));

        toggleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Instalando...';
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo para instalar
    }

    mod.enabled = !mod.enabled;

    // Save state / sync com servidor
    if (window.ipcRenderer) {
        try {
            const token = getAuthToken();
            const result = await window.ipcRenderer.invoke('toggle-mod', { modId, enabled: mod.enabled, token });

            if (result?.warning) {
                showNotification(result.warning, 'warning');
            }

            if (!result?.success) {
                throw new Error(result?.error || 'Erro ao atualizar mod');
            }

            window.ipcRenderer.send('log-event', {
                type: 'MOD',
                message: `Mod ${mod.name} ${mod.enabled ? 'ativado' : 'desativado'}`,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Erro ao sincronizar mod:', error);
            showNotification(error.message || 'Erro ao sincronizar mod', 'error');
            // revert UI state
            mod.enabled = !mod.enabled;
            toggleBtn.classList.toggle('enabled');
            toggleBtn.innerHTML = mod.enabled
                ? '<i class="fas fa-times"></i> Desativar'
                : '<i class="fas fa-download"></i> Ativar';
            return;
        }
    }

    // Update UI
    renderMods();
    updateEnabledCount();

    // If mod was disabled, remove from priority order
    if (!mod.enabled) {
        const priorityOrder = JSON.parse(localStorage.getItem('modPriorityOrder') || '[]');
        const updatedOrder = priorityOrder.filter(id => id !== modId);
        localStorage.setItem('modPriorityOrder', JSON.stringify(updatedOrder));

        // Remove priority from mod data
        delete mod.priority;
    } else {
        // If mod was enabled, add to priority order if not already there
        const priorityOrder = JSON.parse(localStorage.getItem('modPriorityOrder') || '[]');
        if (!priorityOrder.includes(modId)) {
            priorityOrder.push(modId);
            localStorage.setItem('modPriorityOrder', JSON.stringify(priorityOrder));
            mod.priority = priorityOrder.length;
        }
    }

    // Update enabled mods page if active
    const enabledPage = document.getElementById('enabledPage');
    if (enabledPage && enabledPage.classList.contains('active')) {
        renderEnabledMods();
    }

    showNotification(
        `${mod.name} ${mod.enabled ? 'ativado' : 'desativado'} com sucesso`,
        'success'
    );

    if (window.tgsModEvents) {
        window.tgsModEvents.trackModToggle(modId, mod.enabled);
    }
}

// Update enabled count
function updateEnabledCount() {
    const enabledCount = modsData.filter(mod => mod.enabled).length;
    
    const badge = document.getElementById('enabledCount');
    if (badge) {
        badge.textContent = enabledCount;
    }
    
    const launchModsCount = document.getElementById('launchModsCount');
    if (launchModsCount) {
        launchModsCount.textContent = `${enabledCount} mod${enabledCount !== 1 ? 's' : ''}`;
    }
}

// Filter mods by search
function filterMods(searchTerm) {
    const container = document.getElementById('modsContainer');
    if (!container) return;
    
    const cards = container.querySelectorAll('.mod-card');
    
    cards.forEach(card => {
        const modName = card.querySelector('.mod-name').textContent.toLowerCase();
        const modDescription = card.querySelector('.mod-description').textContent.toLowerCase();
        const search = searchTerm.toLowerCase();
        
        if (modName.includes(search) || modDescription.includes(search)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });

    if (window.tgsModEvents) {
        var visible = 0;
        cards.forEach(function (card) {
            if (card.style.display !== 'none') visible++;
        });
        window.tgsModEvents.trackSearch(searchTerm, visible);
    }
}

// Launch FiveM with enabled mods
async function launchFiveM() {
    const launchBtn = document.getElementById('launchFiveM');
    const originalContent = launchBtn.innerHTML;
    let enabledMods = modsData.filter(mod => mod.enabled);

    if (enabledMods.length === 0) {
        showNotification('Nenhum mod selecionado. Selecione ao menos um mod antes de iniciar.', 'warning');
        return;
    }

    if (window.tgsModEvents) {
        window.tgsModEvents.trackFivemLaunch();
    }

    try {
        launchBtn.disabled = true;
        launchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aplicando mods...';

        // Sort mods by priority before launching
        enabledMods = sortModsByPriority(enabledMods);

        if (window.ipcRenderer) {
            // Apply mods and launch FiveM
            const result = await window.ipcRenderer.invoke('launch-fivem-with-mods', {
                mods: enabledMods
            });

            if (result.success) {
                showNotification(
                    `FiveM iniciado com ${enabledMods.length} mod(s) em ordem de prioridade!`,
                    'success'
                );
            } else {
                throw new Error(result.error || 'Falha ao iniciar FiveM');
            }
        } else {
            // Fallback for testing
            await new Promise(resolve => setTimeout(resolve, 2000));
            showNotification(
                `FiveM iniciado com ${enabledMods.length} mod(s) em ordem de prioridade (modo teste)`,
                'success'
            );
        }
    } catch (error) {
        console.error('Launch error:', error);
        showNotification(`Erro ao iniciar FiveM: ${error.message}`, 'error');
    } finally {
        launchBtn.disabled = false;
        launchBtn.innerHTML = originalContent;
    }
}

// Logout function
async function logout() {
    const username = localStorage.getItem('username');
    const accessKey = localStorage.getItem('accessKey');

    // Check if user has mods enabled and verify access
    if (username && accessKey) {
        await cleanupUnauthorizedMods(username, accessKey);
    }

    if (window.ipcRenderer) {
        window.ipcRenderer.send('log-event', {
            type: 'AUTH',
            message: `Usuário ${username} desconectado`,
            timestamp: new Date().toISOString()
        });
    }

    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('accessKey');
    localStorage.removeItem('userRole');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('remoteMode');

    if (window.tgsModEvents) {
        window.tgsModEvents.trackLogout();
    }

    window.location.href = 'login.html';
}

// Cleanup unauthorized mods on logout
async function cleanupUnauthorizedMods(username, accessKey) {
    try {
        // Get currently enabled mods
        const enabledMods = modsData.filter(mod => mod.enabled);

        if (enabledMods.length === 0) {
            return; // No mods to check
        }

        let disabledCount = 0;
        const disabledMods = [];

        // Check each enabled mod for access
        for (const mod of enabledMods) {
            try {
                let accessResult;
                if (window.ipcRenderer) {
                    accessResult = await window.ipcRenderer.invoke('check-mod-access', {
                        username,
                        accessKey,
                        modId: mod.id
                    });
                } else {
                    // Fallback for testing - simulate access check
                    const currentKey = accessKey || '';
                    let hasAccess = true;

                    // Simulate access restrictions based on key type
                    if (currentKey.includes('BASIC')) {
                        // Basic keys have limited access
                        if (mod.id === 'mod-03' || mod.id === 'mod-04') {
                            hasAccess = false;
                        }
                    }

                    accessResult = { hasAccess };
                }

                if (!accessResult.hasAccess) {
                    // Disable mod that user no longer has access to
                    mod.enabled = false;
                    disabledMods.push(mod.name);
                    disabledCount++;

                    // Remove from priority order
                    const priorityOrder = JSON.parse(localStorage.getItem('modPriorityOrder') || '[]');
                    const updatedOrder = priorityOrder.filter(id => id !== mod.id);
                    localStorage.setItem('modPriorityOrder', JSON.stringify(updatedOrder));
                    delete mod.priority;

                    // Save state
                    if (window.ipcRenderer) {
                        await window.ipcRenderer.invoke('toggle-mod', { modId: mod.id, enabled: false });
                    }
                }
            } catch (error) {
                console.error(`Error checking access for mod ${mod.name}:`, error);
            }
        }

        // Update UI if mods were disabled
        if (disabledCount > 0) {
            renderMods();
            updateEnabledCount();

            // Update enabled mods page if active
            const enabledPage = document.getElementById('enabledPage');
            if (enabledPage && enabledPage.classList.contains('active')) {
                renderEnabledMods();
            }

            // Show notification about disabled mods
            showNotification(
                `${disabledCount} mod(s) foram desativados por falta de acesso: ${disabledMods.join(', ')}`,
                'warning'
            );

            // Log the cleanup
            if (window.ipcRenderer) {
                window.ipcRenderer.send('log-event', {
                    type: 'MOD',
                    message: `Logout: ${disabledCount} mod(s) desativados por falta de acesso`,
                    timestamp: new Date().toISOString()
                });
            }
        }

    } catch (error) {
        console.error('Error during mod cleanup on logout:', error);
        if (window.ipcRenderer) {
            window.ipcRenderer.send('log-event', {
                type: 'ERROR',
                message: `Erro durante limpeza de mods no logout: ${error.message}`,
                timestamp: new Date().toISOString()
            });
        }
    }
}

// Show notification
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    }[type] || 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Setup navigation between pages
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            switchPage(page);
        });
    });
}

// Switch between pages
function switchPage(pageName) {
    // Remove all page classes from body
    document.body.className = document.body.className.replace(/\b\w*Page\b/g, '');

    // Hide all pages
    document.querySelectorAll('.page-section').forEach(page => {
        page.classList.remove('active');
    });

    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected page
    const pageMap = {
        'mods': 'modsPage',
        'enabled': 'enabledPage',
        'profile': 'profilePage',
        'settings': 'settingsPage',
        'logs': 'logsPage',
        'admin': 'adminPage',
        'creator': 'creatorPage'
    };

    const pageId = pageMap[pageName];
    if (pageId) {
        const pageElement = document.getElementById(pageId);
        if (pageElement) {
            pageElement.classList.add('active');
        }

        // Add active class to nav item
        const navItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }

        // Add page class to body for CSS styling
        document.body.classList.add(pageName + 'Page');

        // Load page-specific content
        if (pageName === 'enabled') {
            renderEnabledMods();
        } else if (pageName === 'logs') {
            loadLogs();
        } else if (pageName === 'profile') {
            loadUserProfile();
        } else if (pageName === 'admin') {
            loadAllUsers();
        } else if (pageName === 'creator') {
            loadCreatorMods();
        }
    }
}

// Toggle view between grid and list
let currentView = 'grid';
function toggleView() {
    const container = document.getElementById('modsContainer');
    const toggleBtn = document.getElementById('toggleView');
    const icon = toggleBtn.querySelector('i');
    
    if (currentView === 'grid') {
        container.classList.add('list-view');
        icon.className = 'fas fa-th-large';
        currentView = 'list';
    } else {
        container.classList.remove('list-view');
        icon.className = 'fas fa-th';
        currentView = 'grid';
    }
}

// Render enabled mods on Enabled Mods page
function renderEnabledMods() {
    const container = document.getElementById('enabledModsContainer');
    const countElement = document.getElementById('enabledPageCount');
    const enabledMods = modsData.filter(mod => mod.enabled);

    if (countElement) {
        countElement.textContent = enabledMods.length;
    }

    if (!container) return;

    container.innerHTML = '';

    if (enabledMods.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Nenhum mod ativo no momento</p>
            </div>
        `;
        return;
    }

    // Sort mods by priority (if saved)
    const sortedMods = sortModsByPriority();

    sortedMods.forEach((mod, index) => {
        const hierarchyItem = createHierarchyItem(mod, index + 1);
        container.appendChild(hierarchyItem);
    });

    // Setup drag and drop
    setupDragAndDrop();
}

// Setup enabled mods actions
function setupEnabledModsActions() {
    const applyAllBtn = document.getElementById('applyAllMods');
    const disableAllBtn = document.getElementById('disableAllMods');
    
    if (applyAllBtn) {
        applyAllBtn.addEventListener('click', () => {
            if (window.tgsModEvents) {
                var enabledCount = modsData.filter(function (m) { return m.enabled; }).length;
                window.tgsModEvents.trackModApplyAll(enabledCount);
            }
            launchFiveM();
        });
    }
    
    if (disableAllBtn) {
        disableAllBtn.addEventListener('click', async () => {
            const enabledMods = modsData.filter(mod => mod.enabled);
            
            if (enabledMods.length === 0) {
                showNotification('Nenhum mod ativo para desativar', 'info');
                return;
            }
            
            for (const mod of enabledMods) {
                mod.enabled = false;
                if (window.ipcRenderer) {
                    await window.ipcRenderer.invoke('toggle-mod', { modId: mod.id, enabled: false });
                }
            }
            
            renderEnabledMods();
            renderMods();
            updateEnabledCount();
            showNotification(`${enabledMods.length} mod(s) desativado(s)`, 'success');
        });
    }

    // Setup sort by priority button
    const sortByPriorityBtn = document.getElementById('sortByPriority');
    if (sortByPriorityBtn) {
        sortByPriorityBtn.addEventListener('click', () => {
            const enabledMods = modsData.filter(mod => mod.enabled);
            const sortedMods = sortModsByPriority();
            renderEnabledMods();
            showNotification('Mods ordenados por prioridade', 'success');
        });
    }
}

// ===== HIERARCHY SYSTEM FUNCTIONS =====

// Create hierarchy item
function createHierarchyItem(mod, priority) {
    const item = document.createElement('div');
    item.className = 'hierarchy-item';
    item.setAttribute('data-mod-id', mod.id);
    item.setAttribute('data-priority', priority);
    item.draggable = true;

    const priorityClass = `priority-${Math.min(priority, 5)}`;

    item.innerHTML = `
        <div class="priority-indicator ${priorityClass}">
            ${priority}
        </div>
        <div class="hierarchy-content">
            <div class="hierarchy-icon">${mod.icon}</div>
            <div class="hierarchy-details">
                <h3 class="hierarchy-name">${mod.name}</h3>
                <p class="hierarchy-description">${mod.description}</p>
                <div class="hierarchy-meta">
                    <span class="hierarchy-version">
                        <i class="fas fa-code-branch"></i> v${mod.version}
                    </span>
                    <span class="hierarchy-size">
                        <i class="fas fa-hdd"></i> ${mod.size}
                    </span>
                </div>
            </div>
        </div>
        <div class="hierarchy-controls">
            <button class="move-btn move-up" data-mod-id="${mod.id}" title="Mover para cima">
                <i class="fas fa-chevron-up"></i>
            </button>
            <button class="move-btn move-down" data-mod-id="${mod.id}" title="Mover para baixo">
                <i class="fas fa-chevron-down"></i>
            </button>
            <button class="remove-btn" data-mod-id="${mod.id}" title="Desativar mod">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Add event listeners
    const moveUpBtn = item.querySelector('.move-up');
    const moveDownBtn = item.querySelector('.move-down');
    const removeBtn = item.querySelector('.remove-btn');

    moveUpBtn.addEventListener('click', () => moveModUp(mod.id));
    moveDownBtn.addEventListener('click', () => moveModDown(mod.id));
    removeBtn.addEventListener('click', () => toggleMod(mod.id));

    return item;
}

// Sort mods by priority
function sortModsByPriority(mods) {
    const enabledMods = modsData.filter(mod => mod.enabled);

    // Load saved priority order from localStorage
    const priorityOrder = JSON.parse(localStorage.getItem('modPriorityOrder') || '[]');

    if (priorityOrder.length === 0) {
        // Default order: sort by name
        return enabledMods.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Sort by saved priority order
    return enabledMods.sort((a, b) => {
        const indexA = priorityOrder.indexOf(a.id);
        const indexB = priorityOrder.indexOf(b.id);

        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return indexA - indexB;
    });
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const items = document.querySelectorAll('.hierarchy-item');
    let draggedElement = null;
    let dragOverElement = null;

    items.forEach(item => {
        // Drag start
        item.addEventListener('dragstart', (e) => {
            draggedElement = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', item.outerHTML);
        });

        // Drag end
        item.addEventListener('dragend', () => {
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
                draggedElement = null;
            }
            document.querySelectorAll('.hierarchy-item').forEach(el => {
                el.classList.remove('drag-over');
            });
        });

        // Drag over
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            if (item !== draggedElement) {
                item.classList.add('drag-over');
                dragOverElement = item;
            }
        });

        // Drag leave
        item.addEventListener('dragleave', () => {
            item.classList.remove('drag-over');
        });

        // Drop
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.classList.remove('drag-over');

            if (draggedElement && item !== draggedElement) {
                const container = document.getElementById('enabledModsContainer');
                const allItems = Array.from(container.querySelectorAll('.hierarchy-item'));

                const draggedIndex = allItems.indexOf(draggedElement);
                const targetIndex = allItems.indexOf(item);

                // Move the element
                if (targetIndex > draggedIndex) {
                    container.insertBefore(draggedElement, item.nextSibling);
                } else {
                    container.insertBefore(draggedElement, item);
                }

                // Update priority order
                updatePriorityOrder();
                renderEnabledMods();

                showNotification('Ordem dos mods atualizada', 'success');
            }
        });
    });
}

// Update priority order in localStorage and mod data
function updatePriorityOrder() {
    const container = document.getElementById('enabledModsContainer');
    const items = container.querySelectorAll('.hierarchy-item');
    const order = Array.from(items).map(item => item.getAttribute('data-mod-id'));

    // Save to localStorage
    localStorage.setItem('modPriorityOrder', JSON.stringify(order));

    // Update mod priorities in data
    order.forEach((modId, index) => {
        const mod = modsData.find(m => m.id === modId);
        if (mod) {
            mod.priority = index + 1;
        }
    });

    // Save to backend if available
    if (window.ipcRenderer) {
        window.ipcRenderer.send('log-event', {
            type: 'MOD',
            message: 'Ordem de prioridade dos mods atualizada',
            timestamp: new Date().toISOString()
        });
    }
}

// Move mod up in hierarchy
function moveModUp(modId) {
    const container = document.getElementById('enabledModsContainer');
    const items = Array.from(container.querySelectorAll('.hierarchy-item'));
    const currentIndex = items.findIndex(item => item.getAttribute('data-mod-id') === modId);

    if (currentIndex > 0) {
        const currentItem = items[currentIndex];
        const targetItem = items[currentIndex - 1];

        container.insertBefore(currentItem, targetItem);
        updatePriorityOrder();
        renderEnabledMods();
        showNotification('Mod movido para cima', 'success');
    }
}

// Move mod down in hierarchy
function moveModDown(modId) {
    const container = document.getElementById('enabledModsContainer');
    const items = Array.from(container.querySelectorAll('.hierarchy-item'));
    const currentIndex = items.findIndex(item => item.getAttribute('data-mod-id') === modId);

    if (currentIndex < items.length - 1) {
        const currentItem = items[currentIndex];
        const targetItem = items[currentIndex + 1];

        container.insertBefore(currentItem, targetItem.nextSibling);
        updatePriorityOrder();
        renderEnabledMods();
        showNotification('Mod movido para baixo', 'success');
    }
}

// Initialize priority order for existing enabled mods
function initializePriorityOrder() {
    const priorityOrder = JSON.parse(localStorage.getItem('modPriorityOrder') || '[]');
    const enabledMods = modsData.filter(mod => mod.enabled);

    // If no saved order but there are enabled mods, create initial order
    if (priorityOrder.length === 0 && enabledMods.length > 0) {
        const initialOrder = enabledMods.map(mod => mod.id);
        localStorage.setItem('modPriorityOrder', JSON.stringify(initialOrder));

        // Set initial priorities
        initialOrder.forEach((modId, index) => {
            const mod = modsData.find(m => m.id === modId);
            if (mod) {
                mod.priority = index + 1;
            }
        });
    }
}

// Verify active mods access after login
async function verifyActiveModsAccess() {
    const username = localStorage.getItem('username');
    const accessKey = localStorage.getItem('accessKey');

    if (!username || !accessKey) {
        return; // No user logged in
    }

    try {
        // Get currently enabled mods
        const enabledMods = modsData.filter(mod => mod.enabled);

        if (enabledMods.length === 0) {
            return; // No mods to check
        }

        let disabledCount = 0;
        const disabledMods = [];

        // Check each enabled mod for access
        for (const mod of enabledMods) {
            try {
                let accessResult;
                if (window.ipcRenderer) {
                    accessResult = await window.ipcRenderer.invoke('check-mod-access', {
                        username,
                        accessKey,
                        modId: mod.id
                    });
                } else {
                    // Fallback for testing - simulate access check
                    const currentKey = accessKey || '';
                    let hasAccess = true;

                    // Simulate access restrictions based on key type
                    if (currentKey.includes('BASIC')) {
                        // Basic keys have limited access
                        if (mod.id === 'mod-03' || mod.id === 'mod-04') {
                            hasAccess = false;
                        }
                    }

                    accessResult = { hasAccess };
                }

                if (!accessResult.hasAccess) {
                    // Disable mod that user no longer has access to
                    mod.enabled = false;
                    disabledMods.push(mod.name);
                    disabledCount++;

                    // Remove from priority order
                    const priorityOrder = JSON.parse(localStorage.getItem('modPriorityOrder') || '[]');
                    const updatedOrder = priorityOrder.filter(id => id !== mod.id);
                    localStorage.setItem('modPriorityOrder', JSON.stringify(updatedOrder));
                    delete mod.priority;

                    // Save state
                    if (window.ipcRenderer) {
                        await window.ipcRenderer.invoke('toggle-mod', { modId: mod.id, enabled: false });
                    }
                }
            } catch (error) {
                console.error(`Error checking access for mod ${mod.name}:`, error);
            }
        }

        // Update UI if mods were disabled
        if (disabledCount > 0) {
            renderMods();
            updateEnabledCount();

            // Update enabled mods page if active
            const enabledPage = document.getElementById('enabledPage');
            if (enabledPage && enabledPage.classList.contains('active')) {
                renderEnabledMods();
            }

            // Show notification about disabled mods (only if more than 1 second has passed since login)
            const timeSinceLogin = Date.now() - (localStorage.getItem('loginTime') ? parseInt(localStorage.getItem('loginTime')) : 0);
            if (timeSinceLogin > 1000) {
                showNotification(
                    `${disabledCount} mod(s) foram desativados por falta de acesso na sua chave atual: ${disabledMods.join(', ')}`,
                    'warning'
                );
            }

            // Log the cleanup
            if (window.ipcRenderer) {
                window.ipcRenderer.send('log-event', {
                    type: 'MOD',
                    message: `Login: ${disabledCount} mod(s) desativados por falta de acesso na key atual`,
                    timestamp: new Date().toISOString()
                });
            }
        }

    } catch (error) {
        console.error('Error during mod verification on login:', error);
        if (window.ipcRenderer) {
            window.ipcRenderer.send('log-event', {
                type: 'ERROR',
                message: `Erro ao verificar acesso aos mods: ${error.message}`,
                timestamp: new Date().toISOString()
            });
        }
    }
}

// Setup settings
function setupSettings() {
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            darkModeToggle.classList.add('active');
            document.body.classList.add('dark-mode');
        }
        
        darkModeToggle.addEventListener('click', () => {
            darkModeToggle.classList.toggle('active');
            document.body.classList.toggle('dark-mode');
            const isActive = darkModeToggle.classList.contains('active');
            localStorage.setItem('darkMode', isActive);
            showNotification(`Modo escuro ${isActive ? 'ativado' : 'desativado'}`, 'success');
        });
    }
    
    // Animations toggle
    const animationsToggle = document.getElementById('animationsToggle');
    if (animationsToggle) {
        animationsToggle.addEventListener('click', () => {
            animationsToggle.classList.toggle('active');
            const isActive = animationsToggle.classList.contains('active');
            document.body.style.setProperty('--transition-speed', isActive ? '0.3s' : '0s');
            showNotification(`Animações ${isActive ? 'ativadas' : 'desativadas'}`, 'success');
        });
    }
    
    // Startup toggle
    const startupToggle = document.getElementById('startupToggle');
    if (startupToggle) {
        startupToggle.addEventListener('click', () => {
            startupToggle.classList.toggle('active');
            const isActive = startupToggle.classList.contains('active');
            showNotification(`Iniciar com Windows ${isActive ? 'ativado' : 'desativado'}`, 'info');
        });
    }
    
    // Tray toggle
    const trayToggle = document.getElementById('trayToggle');
    if (trayToggle) {
        trayToggle.addEventListener('click', () => {
            trayToggle.classList.toggle('active');
            const isActive = trayToggle.classList.contains('active');
            showNotification(`Minimizar para bandeja ${isActive ? 'ativado' : 'desativado'}`, 'info');
        });
    }
    
    // Path inputs
    const fivemPathInput = document.getElementById('fivemPath');
    const modsPathInput = document.getElementById('modsPath');
    
    if (fivemPathInput) {
        const savedPath = localStorage.getItem('fivemPath');
        if (savedPath) fivemPathInput.value = savedPath;
        
        fivemPathInput.addEventListener('change', () => {
            localStorage.setItem('fivemPath', fivemPathInput.value);
            showNotification('Caminho do FiveM salvo', 'success');
        });
    }
    
    if (modsPathInput) {
        const savedPath = localStorage.getItem('modsPath');
        if (savedPath) modsPathInput.value = savedPath;
        
        modsPathInput.addEventListener('change', () => {
            localStorage.setItem('modsPath', modsPathInput.value);
            showNotification('Pasta de mods salva', 'success');
        });
    }
}

// Setup logs functionality
let currentLogs = [];
function setupLogs() {
    // Filter buttons
    const filterBtns = document.querySelectorAll('.log-filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            filterLogs(filter);
        });
    });
    
    // Clear logs button
    const clearLogsBtn = document.getElementById('clearLogs');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', () => {
            currentLogs = [];
            renderLogs([]);
            showNotification('Logs limpos', 'success');
        });
    }
}

// Load logs
async function loadLogs() {
    try {
        if (window.ipcRenderer) {
            const logs = await window.ipcRenderer.invoke('get-logs');
            currentLogs = logs || [];
        } else {
            // Mock logs for testing
            currentLogs = [
                {
                    type: 'AUTH',
                    message: 'Usuário admin autenticado com sucesso',
                    timestamp: new Date().toISOString()
                },
                {
                    type: 'MOD',
                    message: 'Mod Enhanced Graphics ativado',
                    timestamp: new Date().toISOString()
                },
                {
                    type: 'LAUNCH',
                    message: 'FiveM iniciado com 3 mods aplicados',
                    timestamp: new Date().toISOString()
                }
            ];
        }
        
        renderLogs(currentLogs);
    } catch (error) {
        console.error('Error loading logs:', error);
        showNotification('Erro ao carregar logs', 'error');
    }
}

// Filter logs
function filterLogs(filter) {
    if (filter === 'all') {
        renderLogs(currentLogs);
    } else {
        const filtered = currentLogs.filter(log => 
            log.type.toLowerCase() === filter.toLowerCase()
        );
        renderLogs(filtered);
    }
}

// Render logs
function renderLogs(logs) {
    const container = document.getElementById('logsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (logs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Nenhum log disponível</p>
            </div>
        `;
        return;
    }
    
    logs.reverse().forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${log.type.toLowerCase()}`;
        
        const icon = {
            'AUTH': 'fa-user-check',
            'MOD': 'fa-puzzle-piece',
            'LAUNCH': 'fa-rocket',
            'ERROR': 'fa-exclamation-triangle',
            'INFO': 'fa-info-circle'
        }[log.type] || 'fa-file-alt';
        
        const time = new Date(log.timestamp).toLocaleString('pt-BR');
        
        logEntry.innerHTML = `
            <div class="log-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="log-content">
                <div class="log-time">${time}</div>
                <p class="log-message">${log.message}</p>
            </div>
        `;
        
        container.appendChild(logEntry);
    });
}

// Load user profile and keys
async function loadUserProfile() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Sessão expirada');
        }

        // Carregar informações do usuário
        const userResponse = await fetch('http://localhost:3002/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!userResponse.ok) {
            // Se for 401, usuário pode estar banido
            if (userResponse.status === 401) {
                showNotification('Sua conta foi banida. Você será desconectado.', 'error');
                setTimeout(() => {
                    logout();
                }, 2000);
                return;
            }
            throw new Error('Erro ao carregar perfil');
        }

        const userData = await userResponse.json();
        if (userData.success) {
            // Atualizar informações do perfil
            document.getElementById('profileUsername').textContent = userData.username;
            document.getElementById('profileRole').textContent = userData.role === 'admin' ? 'Administrador' : 'Membro';
            
            // Carregar chaves do usuário
            await loadUserKeysForProfile();
        } else {
            throw new Error(userData.message || 'Erro ao carregar perfil');
        }

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        showNotification('Erro ao carregar perfil: ' + error.message, 'error');
    }
}

// Carregar chaves para o perfil
async function loadUserKeysForProfile() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Sessão expirada');
        }

        const response = await fetch('http://localhost:3002/api/user/keys', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // Se for 401, usuário pode estar banido
            if (response.status === 401) {
                showNotification('Sua conta foi banida. Você será desconectado.', 'error');
                setTimeout(() => {
                    logout();
                }, 2000);
                return;
            }
            throw new Error('Erro ao carregar chaves');
        }

        const data = await response.json();
        if (data.success) {
            renderUserKeys(data.keys || []);
        } else {
            throw new Error(data.message || 'Erro ao carregar chaves');
        }

    } catch (error) {
        console.error('Erro ao carregar chaves do perfil:', error);
        renderUserKeys([]); // Mostrar vazio em caso de erro
    }
}

// Renderizar chaves no perfil
function renderUserKeys(keys) {
    const container = document.getElementById('keysContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!keys || keys.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-key"></i>
            <p>Nenhuma chave ativa encontrada</p>
            <button onclick="showAddKeyModal()" class="btn-primary">
                <i class="fas fa-plus"></i> Adicionar Nova Chave
            </button>
        `;
        container.appendChild(emptyState);
        return;
    }

    const keysTitle = document.createElement('div');
    keysTitle.className = 'keys-title';
    keysTitle.innerHTML = `<h4>Suas Chaves Ativas:</h4>`;
    container.appendChild(keysTitle);

    keys.forEach(key => {
        const keyCard = document.createElement('div');
        keyCard.className = `key-card-small ${getKeyTypeClass(key.type)}`;
        
        keyCard.innerHTML = `
            <div class="key-header-small">
                <div class="key-type-small">
                    <i class="fas ${getKeyTypeIcon(key.type)}"></i>
                    <span>${key.type.toUpperCase()}</span>
                </div>
                <div class="key-status-small ${key.status}">
                    <i class="fas fa-circle"></i>
                    ${key.status}
                </div>
            </div>
            
            <div class="key-code-small">
                <code>${key.code}</code>
                <button onclick="copyToClipboard('${key.code}')" class="copy-btn-small">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
            
            <div class="key-details-small">
                <div class="key-info-small">
                    <i class="fas fa-calendar"></i>
                    <span>Compra: ${formatDate(key.purchase_date)}</span>
                </div>
                ${getExpiryInfo(key)}
            </div>
        `;
        
        container.appendChild(keyCard);
    });

    // Always show the "Add Key" section at the bottom
    const addKeySection = document.createElement('div');
    addKeySection.className = 'empty-state';
    addKeySection.innerHTML = `
        <button onclick="showAddKeyModal()" class="btn-primary">
            <i class="fas fa-plus"></i> Adicionar Nova Chave
        </button>
    `;
    container.appendChild(addKeySection);
}

function showModDetailsModal(mod) {
    const modal = document.getElementById('modDetailsModal');
    const imageElement = document.getElementById('modDetailsImg');
    const nameElement = document.getElementById('modDetailsName');
    const descriptionElement = document.getElementById('modDetailsDescription');
    const metaElement = document.getElementById('modDetailsMeta');
    const featuresElement = document.getElementById('modDetailsFeatures');
    const thumbnailsContainer = document.getElementById('modDetailsThumbnails');
    const priceElement = document.getElementById('modDetailsPrice');
    const purchaseBtn = document.getElementById('modDetailsPurchaseBtn');
    const closeIcon = document.getElementById('closeModDetailsModal');

    if (!modal || !imageElement || !nameElement || !descriptionElement || !purchaseBtn) {
        showNotification('Erro ao abrir detalhes do mod', 'error');
        return;
    }

    // Salvar referência para o toggle de moeda poder atualizar
    window.currentModDetails = mod;

    // Conteúdo principal
    nameElement.textContent = mod.name || 'Mod sem nome';
    descriptionElement.textContent = mod.longDescription || mod.description || '';

    // Meta informações (versão e tamanho na descrição)
    if (metaElement) {
        const version = mod.version || '';
        const size = mod.size || '';
        const metaText = [version, size].filter(Boolean).join(' • ');
        
        // Adicionar ícones
        let metaHtml = '';
        if (version) {
            metaHtml += `<i class="fas fa-code-branch"></i> ${version}`;
        }
        if (size) {
            if (metaHtml) metaHtml += ' • ';
            metaHtml += `<i class="fas fa-hdd"></i> ${size}`;
        }
        
        metaElement.innerHTML = metaHtml;
    }

    // Preço inicial (Standalone ou preço base)
    if (priceElement) priceElement.textContent = formatCurrency(mod.price || 0);

    // Imagem principal
    const mainImage = mod.image || (Array.isArray(mod.images) && mod.images[0]) || '';
    if (mainImage) {
        imageElement.src = mainImage;
        imageElement.alt = mod.name || '';
        imageElement.style.display = 'block';
    } else {
        imageElement.removeAttribute('src');
        imageElement.style.display = 'none';
    }

    // Miniaturas (se houver galeria)
    if (thumbnailsContainer) {
        thumbnailsContainer.innerHTML = '';
        const gallery = Array.isArray(mod.images) ? mod.images : [];

        gallery.forEach((imgSrc, index) => {
            const thumb = document.createElement('div');
            thumb.className = 'mod-thumbnail-item' + (index === 0 ? ' active' : '');
            thumb.innerHTML = `<img src="${imgSrc}" alt="${mod.name || ''} thumb ${index + 1}">`;

            thumb.addEventListener('click', () => {
                imageElement.src = imgSrc;
                thumbnailsContainer.querySelectorAll('.mod-thumbnail-item').forEach(el => el.classList.remove('active'));
                thumb.classList.add('active');
            });

            thumbnailsContainer.appendChild(thumb);
        });
    }

    // Tags / features
    if (featuresElement) {
        const features = Array.isArray(mod.features) ? mod.features : [];
        featuresElement.innerHTML = features.map(feature => `
            <span class="feature-tag">
                <i class="fas fa-check-circle"></i> ${feature}
            </span>
        `).join('');
    }

    // Botão de compra (ação será bloqueada via disabled quando necessário)
    purchaseBtn.onclick = () => {
        if (purchaseBtn.disabled) return;
        handleModPurchase(mod);
        hideModDetailsModal();
    };

    // Ícone de fechar
    if (closeIcon) {
        closeIcon.onclick = hideModDetailsModal;
    }

    // Exibir modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // SEÇÃO COMENTADA - MercadoPago já fornece os métodos de pagamento
    // Adicionar event listeners para radios de pagamento
    // const paymentRadios = modal.querySelectorAll('input[name="paymentMethod"]');
    // paymentRadios.forEach(radio => {
    //     radio.addEventListener('change', (e) => {
    //         showPaymentFormFields(e.target.value);
    //     });
    // });

    // Mostrar campos do método selecionado inicialmente
    // const initialPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cartao';
    // showPaymentFormFields(initialPaymentMethod);
    //

    // Popular seletor de modelo com variações do mod
    populateModelSelector(mod);

    // Adicionar event listener para atualizar preço quando o modelo mudar
    const modelSelect = modal.querySelector('#modelSelect');
    const variations = (mod.variations || mod.models || []);
    const hasVariations = Array.isArray(variations) && variations.length > 0;

    if (modelSelect) {
        // Se houver variações, garantir que Standalone seja o estado inicial
        if (hasVariations) {
            modelSelect.value = 'standalone';
        }

        const initialModel = modelSelect.value || 'standalone';
        updatePurchaseButtonState(mod, initialModel, purchaseBtn);

        modelSelect.addEventListener('change', () => {
            const selectedModel = modelSelect.value || 'standalone';
            updateModPrice(mod, selectedModel);
            updatePurchaseButtonState(mod, selectedModel, purchaseBtn);
        });
    } else {
        // Sem seletor de modelo: segue regra padrão (sempre comprável)
        updatePurchaseButtonState(mod, null, purchaseBtn);
    }

    // Adicionar event listener para toggle de presentear amigo
    const giftToggle = modal.querySelector('#giftToggle');
    const giftEmailField = modal.querySelector('#giftEmailField');
    
    if (giftToggle && giftEmailField) {
        giftToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                giftEmailField.style.display = 'block';
            } else {
                giftEmailField.style.display = 'none';
            }
        });
    }

    // Fechar ao clicar fora do conteúdo
    modal.onclick = (e) => {
        if (e.target === modal) {
            hideModDetailsModal();
        }
    };

    // Fechar com ESC
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            hideModDetailsModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

// Hide mod details modal
function hideModDetailsModal() {
    const modal = document.getElementById('modDetailsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Add CSS for clickable mod name
const style = document.createElement('style');
style.textContent = `
    .mod-name.clickable {
        cursor: pointer;
        transition: color 0.3s ease;
    }
    
    .mod-name.clickable:hover {
        color: var(--primary-color);
    }
    
    .mod-content-wrapper {
        cursor: pointer;
    }
`;

document.head.appendChild(style);

// Funções do Modal de Recuperação de Conta
function showRecoveryModal() {
    const modal = document.getElementById('recoveryModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        refreshCaptchaImage();
        clearRecoveryForm();
    }
}

function hideRecoveryModal() {
    const modal = document.getElementById('recoveryModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        clearRecoveryForm();
    }
}

function clearRecoveryForm() {
    const form = document.getElementById('recoveryForm');
    const message = document.getElementById('recoveryMessage');
    
    if (form) form.reset();
    if (message) {
        message.style.display = 'none';
        message.className = 'recovery-message';
    }
}

function refreshCaptchaImage() {
    const captchaImg = document.getElementById('captchaImage');
    if (captchaImg) {
        updateCaptchaImage(captchaImg);
    }
}

function showRecoveryMessage(message, type = 'info') {
    const messageEl = document.getElementById('recoveryMessage');
    const textEl = document.getElementById('recoveryText');
    
    if (messageEl && textEl) {
        textEl.textContent = message;
        messageEl.className = `recovery-message ${type}`;
        messageEl.style.display = 'flex';
    }
}

// Handle account recovery
async function handleRecoverySubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('recoveryInput').value.trim();
    const recoveryType = document.querySelector('input[name="recoveryType"]:checked').value;
    const captcha = document.getElementById('captchaInput').value.trim();
    
    if (!email || !captcha) {
        showRecoveryMessage('Por favor, preencha todos os campos.', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showRecoveryMessage('Por favor, digite um email válido.', 'error');
        return;
    }

    // Validar CAPTCHA
    if (!validateCaptcha(captcha)) {
        showRecoveryMessage('Código CAPTCHA incorreto.', 'error');
        refreshCaptchaImage();
        return;
    }

    try {
        showRecoveryMessage('Enviando email de recuperação...', 'info');
        
        const response = await fetch('http://localhost:3002/api/recover', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                type: recoveryType
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showRecoveryMessage(data.message, 'success');
            
            // Limpar formulário
            document.getElementById('recoveryInput').value = '';
            document.getElementById('captchaInput').value = '';
            refreshCaptchaImage();
            
            // Fechar modal após 3 segundos
            setTimeout(() => {
                hideRecoveryModal();
                showNotification('Email enviado! Verifique sua caixa de entrada.', 'success');
            }, 3000);
        } else {
            showRecoveryMessage(data.message || 'Erro ao solicitar recuperação', 'error');
        }
        
    } catch (error) {
        console.error('Erro na recuperação:', error);
        showRecoveryMessage('Erro de conexão. Tente novamente.', 'error');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Funções do Modal de Criação de Conta
function showSignupModal() {
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        refreshSignupCaptchaImage();
        clearSignupForm();
    }
}

function hideSignupModal() {
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        clearSignupForm();
    }
}

function clearSignupForm() {
    const form = document.getElementById('signupForm');
    const message = document.getElementById('signupMessage');
    
    if (form) form.reset();
    if (message) {
        message.style.display = 'none';
        message.className = 'signup-message';
    }
}

function refreshSignupCaptchaImage() {
    const captchaImg = document.getElementById('signupCaptchaImage');
    if (captchaImg) {
        updateCaptchaImage(captchaImg);
    }
}

function showSignupMessage(message, type = 'info') {
    const messageEl = document.getElementById('signupMessage');
    const textEl = document.getElementById('signupText');
    
    if (messageEl && textEl) {
        textEl.textContent = message;
        messageEl.className = `signup-message ${type}`;
        messageEl.style.display = 'flex';
    }
}

async function handleSignupSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const confirmPassword = document.getElementById('signupConfirmPassword').value.trim();
    const accessKey = document.getElementById('signupKey').value.trim();
    const captcha = document.getElementById('signupCaptchaInput').value.trim();
    
    // Validações
    if (!username || !email || !password || !confirmPassword || !captcha) {
        showSignupMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showSignupMessage('Por favor, digite um email válido.', 'error');
        return;
    }

    if (password.length < 6) {
        showSignupMessage('A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showSignupMessage('As senhas não coincidem.', 'error');
        return;
    }

    // Validar CAPTCHA
    if (!validateCaptcha(captcha)) {
        showSignupMessage('Código CAPTCHA incorreto.', 'error');
        refreshSignupCaptchaImage();
        return;
    }

    try {
        showSignupMessage('Criando sua conta...', 'info');
        
        // Simular chamada à API de criação
        const response = await simulateSignupAPI(username, email, password, accessKey);
        
        if (response.success) {
            showSignupMessage('Conta criada com sucesso! Você já pode fazer login.', 'success');
            
            // Fechar modal após 3 segundos
            setTimeout(() => {
                hideSignupModal();
            }, 3000);
        } else {
            showSignupMessage(response.message || 'Não foi possível criar a conta. Tente novamente.', 'error');
        }
        
    } catch (error) {
        console.error('Erro na criação:', error);
        showSignupMessage('Erro ao processar solicitação. Tente novamente.', 'error');
    }
}

async function simulateSignupAPI(username, email, password, accessKey) {
    try {
        const response = await fetch('http://localhost:3002/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                accessKey: accessKey
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                message: errorData.message || 'Erro ao processar solicitação.'
            };
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Erro na chamada da API:', error);
        return {
            success: false,
            message: 'Erro de conexão com o servidor. Verifique se o servidor está rodando.'
        };
    }
}


// Sistema de Gerenciamento de Chaves
let userKeys = [];
let keyStats = {};

// Carregar chaves do usuário
async function loadUserKeys() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Sessão expirada');
        }

        const response = await fetch('http://localhost:3002/api/user/keys', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar chaves');
        }

        const data = await response.json();
        if (data.success) {
            userKeys = data.keys || [];
            keyStats = data.stats || {};
            updateUserKeysDisplay();
        } else {
            throw new Error(data.message || 'Erro ao carregar chaves');
        }

    } catch (error) {
        console.error('Erro ao carregar chaves:', error);
        showNotification('Erro ao carregar chaves: ' + error.message, 'error');
    }
}

// Atualizar display das chaves
function updateUserKeysDisplay() {
    const keysContainer = document.getElementById('userKeysContainer');
    if (!keysContainer) return;

    if (userKeys.length === 0) {
        keysContainer.innerHTML = `
            <div class="no-keys-message">
                <i class="fas fa-key"></i>
                <h3>Nenhuma chave encontrada</h3>
                <p>Adicione uma chave para acessar recursos do launcher</p>
            </div>
        `;
        return;
    }

    const keysHTML = userKeys.map(key => {
        const typeClass = getKeyTypeClass(key.type);
        const typeIcon = getKeyTypeIcon(key.type);
        const expiryInfo = getExpiryInfo(key);
        
        return `
            <div class="key-card ${typeClass}">
                <div class="key-header">
                    <div class="key-type">
                        <i class="fas ${typeIcon}"></i>
                        <span>${key.type.toUpperCase()}</span>
                    </div>
                    <div class="key-status ${key.status}">
                        <i class="fas fa-circle"></i>
                        ${key.status}
                    </div>
                </div>
                
                <div class="key-code">
                    <code>${key.code}</code>
                    <button onclick="copyToClipboard('${key.code}')" class="copy-btn">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                
                <div class="key-details">
                    <div class="key-info">
                        <i class="fas fa-calendar"></i>
                        <span>Compra: ${formatDate(key.purchase_date)}</span>
                    </div>
                    ${expiryInfo}
                </div>
                
                <div class="key-actions">
                    <button onclick="removeKey('${key.code}')" class="btn-remove-key">
                        <i class="fas fa-unlink"></i>
                        Remover
                    </button>
                </div>
            </div>
        `;
    }).join('');

    keysContainer.innerHTML = keysHTML;
}

// Obter classe CSS para tipo de chave
function getKeyTypeClass(type) {
    const classes = {
        'admin': 'key-admin',
        'creator': 'key-creator', 
        'standard': 'key-standard'
    };
    return classes[type] || 'key-default';
}

// Obter ícone para tipo de chave
function getKeyTypeIcon(type) {
    const icons = {
        'admin': 'fa-crown',
        'creator': 'fa-hammer',
        'standard': 'fa-star'
    };
    return icons[type] || 'fa-key';
}

// Obter informação de expiração
function getExpiryInfo(key) {
    if (key.is_lifetime) {
        return `
            <div class="key-info">
                <i class="fas fa-infinity"></i>
                <span>Vitalícia</span>
            </div>
        `;
    }
    
    if (key.expiry_date) {
        const expiryDate = new Date(key.expiry_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        let statusClass = 'expiry-normal';
        if (daysUntilExpiry <= 7) statusClass = 'expiry-warning';
        if (daysUntilExpiry <= 3) statusClass = 'expiry-danger';
        
        return `
            <div class="key-info ${statusClass}">
                <i class="fas fa-clock"></i>
                <span>Expira: ${formatDate(key.expiry_date)} (${daysUntilExpiry} dias)</span>
            </div>
        `;
    }
    
    return '';
}

// Adicionar nova chave
async function addKey() {
    const keyCode = document.getElementById('newKeyCode').value.trim();
    
    if (!keyCode) {
        showNotification('Digite o código da chave', 'error');
        return;
    }

    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Sessão expirada');
        }

        const response = await fetch('http://localhost:3002/api/user/keys', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ keyCode })
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            document.getElementById('newKeyCode').value = '';
            await loadUserKeys(); // Recarregar chaves
        } else {
            throw new Error(data.message || 'Erro ao adicionar chave');
        }

    } catch (error) {
        console.error('Erro ao adicionar chave:', error);
        showNotification('Erro ao adicionar chave: ' + error.message, 'error');
    }
}

// Remover chave
async function removeKey(keyCode) {
    if (!confirm(`Tem certeza que deseja remover a chave ${keyCode}?`)) {
        return;
    }

    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Sessão expirada');
        }

        const response = await fetch(`http://localhost:3002/api/user/keys/${keyCode}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            await loadUserKeys(); // Recarregar chaves
        } else {
            throw new Error(data.message || 'Erro ao remover chave');
        }

    } catch (error) {
        console.error('Erro ao remover chave:', error);
        showNotification('Erro ao remover chave: ' + error.message, 'error');
    }
}

// Copiar para clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Código copiado!', 'success');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        showNotification('Erro ao copiar código', 'error');
    });
}

// Formatar data
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// CAPTCHA functions
let currentCaptcha = '';

function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    currentCaptcha = captcha;
    return captcha;
}

function createCaptchaImage(captchaText) {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 120, 40);

    // Add noise lines
    for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
        ctx.beginPath();
        ctx.moveTo(Math.random() * 120, Math.random() * 40);
        ctx.lineTo(Math.random() * 120, Math.random() * 40);
        ctx.stroke();
    }

    // Add noise dots
    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
        ctx.beginPath();
        ctx.arc(Math.random() * 120, Math.random() * 40, 1, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Draw text
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw each character with slight rotation
    for (let i = 0; i < captchaText.length; i++) {
        ctx.save();
        const x = 15 + (i * 18);
        const y = 20;
        ctx.translate(x, y);
        ctx.rotate((Math.random() - 0.5) * 0.3);
        ctx.fillText(captchaText[i], 0, 0);
        ctx.restore();
    }

    return canvas.toDataURL();
}

function updateCaptchaImage(imgElement) {
    const captchaText = generateCaptcha();
    const captchaDataUrl = createCaptchaImage(captchaText);
    imgElement.src = captchaDataUrl;
}

function validateCaptcha(input) {
    return input.toLowerCase() === currentCaptcha.toLowerCase();
}

// Show Access Denied Modal
function showAccessDeniedModal(mod, message) {
    const modal = document.getElementById('accessDeniedModal');
    const messageElement = document.getElementById('accessDeniedMessage');
    const closeBtn = document.getElementById('closeModalBtn');
    const acquireBtn = document.getElementById('purchaseModBtn');
    
    if (!modal || !messageElement) {
        console.error('Modal de acesso negado não encontrado');
        return;
    }
    
    // Set message
    messageElement.textContent = message || 'Você não possui uma chave com acesso a este mod.';
    
    // Set up acquire button to show mod details
    if (acquireBtn) {
        acquireBtn.onclick = () => {
            hideAccessDeniedModal();
            showModDetailsModal(mod);
        };
    }
    
    // Set up close button
    if (closeBtn) {
        closeBtn.onclick = hideAccessDeniedModal;
    }
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            hideAccessDeniedModal();
        }
    };
    
    // Close on ESC
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            hideAccessDeniedModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

// Update mod price based on selected model
function updateModPrice(mod, selectedModel) {
    const priceElement = document.getElementById('modDetailsPrice');
    if (!priceElement) return;
    
    let price = mod.price || 0;
    
    // Se não for standalone, buscar preço da variação
    if (selectedModel !== 'standalone' && mod.variations) {
        const variation = mod.variations.find(v => v.value === selectedModel || v.id === selectedModel);
        if (variation && variation.price) {
            price = variation.price;
        }
    }
    
    // Atualizar preço no modal
    priceElement.textContent = formatCurrency(price);
}

// Populate model selector with mod variations
function populateModelSelector(mod) {
    const modelSelect = document.getElementById('modelSelect');
    if (!modelSelect) return;
    
    // Limpar opções existentes
    modelSelect.innerHTML = '';
    
    // Verificar se o mod tem variações
    const variations = mod.variations || mod.models || [];
    
    if (variations.length === 0) {
        // Sem variações - mostrar apenas "Standalone"
        const option = document.createElement('option');
        option.value = 'standalone';
        option.textContent = 'Standalone';
        modelSelect.appendChild(option);
    } else {
        // Adicionar opções de variação com preços
        variations.forEach((variation, index) => {
            const option = document.createElement('option');
            option.value = variation.value || variation.id || `variation-${index}`;
            
            // Formatar texto com preço se tiver
            let displayText = variation.name || variation.label || `Variação ${index + 1}`;
            if (variation.price && variation.value !== 'standalone') {
                displayText += ` - ${formatCurrency(variation.price)}`;
            }
            
            option.textContent = displayText;
            modelSelect.appendChild(option);
        });
        
        // Adicionar opção Standalone no final se não existir
        const hasStandalone = Array.from(modelSelect.options).some(opt => opt.value === 'standalone');
        if (!hasStandalone) {
            const standaloneOption = document.createElement('option');
            standaloneOption.value = 'standalone';
            standaloneOption.textContent = 'Standalone';
            modelSelect.appendChild(standaloneOption);
        }
    }
}

// SEÇÃO COMENTADA - MercadoPago já fornece os métodos de pagamento
// Show payment form fields based on selected method
// function showPaymentFormFields(paymentMethod) {
//     const formFieldsContainer = document.getElementById('paymentFormFields');
//     
//     if (!formFieldsContainer) return;
//     
//     let formHTML = '';
//     
//     if (paymentMethod === 'pix') {
//         formHTML = `
//             <div class="form-group">
//                 <label for="pixNome">Nome Completo</label>
//                 <input type="text" id="pixNome" placeholder="Digite seu nome completo" required>
//             </div>
//             <div class="form-group">
//                 <label for="pixCpf">CPF</label>
//                 <input type="text" id="pixCpf" placeholder="000.000.000-00" maxlength="14" required>
//             </div>
//         `;
//     } else if (paymentMethod === 'cartao') {
//         formHTML = `
//             <div class="form-group">
//                 <label for="cartaoNumero">Número do Cartão</label>
//                 <input type="text" id="cartaoNumero" placeholder="0000 0000 0000 0000" maxlength="19" required>
//             </div>
//             <div class="form-group">
//                 <label for="cartaoNome">Nome no Cartão</label>
//                 <input type="text" id="cartaoNome" placeholder="Nome como está no cartão" required>
//             </div>
//             <div class="form-group">
//                 <label for="cartaoValidade">Validade</label>
//                 <input type="text" id="cartaoValidade" placeholder="MM/AA" maxlength="5" required>
//             </div>
//             <div class="form-group">
//                 <label for="cartaoCvv">CVV</label>
//                 <input type="text" id="cartaoCvv" placeholder="000" maxlength="4" required>
//             </div>
//         `;
//     }
//     
//     formFieldsContainer.innerHTML = formHTML;
//     
//     // Adicionar event listeners para formatação
//     if (paymentMethod === 'pix') {
//         formatCPF('pixCpf');
//     } else if (paymentMethod === 'cartao') {
//         formatCardNumber('cartaoNumero');
//         formatExpiry('cartaoValidade');
//         formatCVV('cartaoCvv');
//     }
// }

// Format CPF
// function formatCPF(inputId) {
//     const input = document.getElementById(inputId);
//     if (!input) return;
//     
//     input.addEventListener('input', (e) => {
//         let value = e.target.value.replace(/\D/g, '');
//         value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
//         e.target.value = value;
//     });
// }

// Format card number
// function formatCardNumber(inputId) {
//     const input = document.getElementById(inputId);
//     if (!input) return;
//     
//     input.addEventListener('input', (e) => {
//         let value = e.target.value.replace(/\D/g, '');
//         value = value.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
//         e.target.value = value;
//     });
// }

// Format expiry date
// function formatExpiry(inputId) {
//     const input = document.getElementById(inputId);
//     if (!input) return;
//     
//     input.addEventListener('input', (e) => {
//         let value = e.target.value.replace(/\D/g, '');
//         if (value.length >= 2) {
//             value = value.substring(0, 2) + '/' + value.substring(2, 4);
//         }
//         e.target.value = value;
//     });
// }

// Format CVV
function formatCVV(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.slice(0, 4);
        e.target.value = value;
    });
}

// Handle mod purchase with payment method
function handleModPurchase(mod) {
    if (!mod) {
        showNotification('Erro: mod não encontrado', 'error');
        return;
    }

    // Obter modelo selecionado e preço
    const modelSelect = document.getElementById('modelSelect');
    const selectedModel = modelSelect ? modelSelect.value : 'standalone';
    const selectedModelText = modelSelect ? modelSelect.options[modelSelect.selectedIndex].text : 'Standalone';
    
    // Obter preço da variação selecionada
    let selectedPrice = mod.price || 0;
    if (selectedModel !== 'standalone' && mod.variations) {
        const variation = mod.variations.find(v => v.value === selectedModel || v.id === selectedModel);
        if (variation && variation.price) {
            selectedPrice = variation.price;
        }
    }

    // Verificar se é um presente
    const giftToggle = document.getElementById('giftToggle');
    const giftEmail = document.getElementById('giftEmail');
    const isGift = giftToggle && giftToggle.checked;
    const friendEmail = isGift && giftEmail ? giftEmail.value.trim() : '';

    // Validar email do amigo se for presente
    if (isGift && !friendEmail) {
        showNotification('Por favor, informe o email do amigo.', 'error');
        return;
    }

    if (isGift && !isValidEmail(friendEmail)) {
        showNotification('Por favor, digite um email válido para o amigo.', 'error');
        return;
    }

    // Obter ID do usuário logado
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userId = userData.id || localStorage.getItem('userId');
    
    if (!userId) {
        showNotification('Usuário não autenticado. Faça login novamente.', 'error');
        return;
    }

    // Verificar se preço é válido para pagamento
    if (selectedPrice <= 0) {
        showNotification('Preço inválido para pagamento.', 'error');
        return;
    }

    let message = `Iniciando pagamento via Mercado Pago`;
    if (selectedModel !== 'standalone') {
        message += ` - Modelo: ${selectedModelText}`;
    }
    message += '...';
    
    showNotification(message, 'info');
    
    // Criar preferência de pagamento no Mercado Pago
    createMercadoPagoPreference(mod, selectedModel, selectedPrice, userId, isGift, friendEmail);
}

// Criar preferência de pagamento no Mercado Pago
async function createMercadoPagoPreference(mod, modelName, price, userId, isGift = false, friendEmail = '') {
    try {
        const currency = isBRLCurrencyEnabled() ? 'BRL' : 'USD';
        
        const response = await fetch('http://localhost:3002/api/mercadopago/create-preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                modId: mod.id,
                modelName: modelName === 'standalone' ? 'Standalone' : modelName,
                price: price,
                userId: userId,
                currency: currency,
                isGift: isGift,
                giftEmail: friendEmail
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Redirecionar para página de pagamento do Mercado Pago
            const paymentUrl = data.sandboxInitPoint || data.initPoint;
            
            // Abrir em nova janela para não perder o estado atual
            const paymentWindow = window.open(paymentUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            
            if (!paymentWindow) {
                // Se popup for bloqueado, abrir na mesma janela
                window.location.href = paymentUrl;
            } else {
                // Monitorar status do pagamento
                monitorPaymentStatus(data.preferenceId);
            }
            
            showNotification('Redirecionando para pagamento...', 'success');
        } else {
            showNotification(data.message || 'Erro ao criar pagamento', 'error');
        }
    } catch (error) {
        console.error('[ERROR] Erro ao criar preferência Mercado Pago:', error);
        showNotification('Erro ao processar pagamento. Tente novamente.', 'error');
    }
}

// Monitorar status do pagamento (Mercado Pago)
function monitorPaymentStatus(preferenceId) {
    console.log('[INFO] Iniciando monitoramento de pagamento:', preferenceId);
    
    let checkCount = 0;
    const maxChecks = 120; // 10 minutos com intervalos de 5 segundos
    const checkInterval = setInterval(async () => {
        checkCount++;
        
        try {
            const response = await fetch(`http://localhost:3002/api/mercadopago/payment-status/${preferenceId}`, {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                console.error(`[ERROR] Erro HTTP ${response.status} ao verificar status`);
                if (response.status === 404) {
                    // Pagamento não encontrado ainda, aguardar
                    return;
                }
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                console.log(`[INFO] Status do pedido (${checkCount}/${maxChecks}): ${data.status}`);
                
                if (data.status === 'approved' || data.status === 'paid') {
                    clearInterval(checkInterval);
                    showNotification('Pagamento aprovado! Sua chave foi gerada.', 'success');
                    
                    // Atualizar interface
                    setTimeout(() => {
                        loadUserAccessKeys();
                        loadMods();
                    }, 2000);
                    
                } else if (data.status === 'declined' || data.status === 'rejected' || data.status === 'cancelled') {
                    clearInterval(checkInterval);
                    showNotification('Pagamento recusado ou cancelado.', 'error');
                    
                } else if (data.status === 'pending') {
                    // Aumentar intervalo para pending status
                    if (checkCount % 12 === 0) { // A cada 1 minuto
                        console.log('[INFO] Pagamento ainda pendente...');
                    }
                }
            } else {
                console.error('[ERROR] Resposta de status falhou:', data.message);
            }
            
            // Parar após máximo de verificações
            if (checkCount >= maxChecks) {
                clearInterval(checkInterval);
                showNotification('Tempo esgotado para verificação do pagamento. Verifique mais tarde.', 'warning');
                console.log('[INFO] Monitoramento de pagamento encerrado por tempo limite');
            }
            
        } catch (error) {
            console.error('[ERROR] Erro ao verificar status do pagamento:', error);
            checkCount++; // Contar erros também para evitar loop infinito
        }
    }, 5000); // Verificar a cada 5 segundos
}

// Hide Access Denied Modal
function hideAccessDeniedModal() {
    const modal = document.getElementById('accessDeniedModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Show Add Key Modal
function showAddKeyModal() {
    const modal = document.getElementById('addKeyModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Clear any previous messages
    const messageElement = document.getElementById('addKeyMessage');
    const textElement = document.getElementById('addKeyText');
    if (messageElement && textElement) {
        messageElement.style.display = 'none';
        textElement.textContent = '';
    }
    
    // Clear form
    const form = document.getElementById('addKeyForm');
    if (form) {
        form.reset();
    }
    
    // Setup event listeners
    setupAddKeyModalListeners();
}

// Hide Add Key Modal
function hideAddKeyModal() {
    const modal = document.getElementById('addKeyModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        clearAddKeyForm();
    }
}

// Setup Add Key Modal Listeners
function setupAddKeyModalListeners() {
    const closeBtn = document.getElementById('closeAddKeyModal');
    const form = document.getElementById('addKeyForm');
    
    // Close button
    if (closeBtn) {
        closeBtn.onclick = hideAddKeyModal;
    }
    
    // Form submission
    if (form) {
        form.onsubmit = handleAddKeySubmit;
    }
    
    // Close on overlay click
    const modal = document.getElementById('addKeyModal');
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                hideAddKeyModal();
            }
        };
    }
    
    // Close on Escape key
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            hideAddKeyModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

// Handle Add Key Form Submission
async function handleAddKeySubmit(e) {
    e.preventDefault();
    
    const keyInput = document.getElementById('newAccessKey');
    const messageElement = document.getElementById('addKeyMessage');
    const textElement = document.getElementById('addKeyText');
    
    if (!keyInput || !messageElement || !textElement) return;
    
    const accessKey = keyInput.value.trim();
    if (!accessKey) {
        showAddKeyMessage('Por favor, digite uma chave válida.', 'error');
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...';
        submitBtn.disabled = true;
        
        // Validate and add key
        const result = await validateAndAddKey(accessKey);
        
        if (result.success) {
            showAddKeyMessage('Chave adicionada com sucesso! Recursos disponíveis em instantes.', 'success');
            
            // Reload user keys after a short delay
            setTimeout(() => {
                loadUserProfile();
                hideAddKeyModal();
                
                // Show notification
                showNotification('Chave adicionada com sucesso!', 'success');
                
                // Refresh mods to apply new access
                loadMods();
            }, 2000);
        } else {
            showAddKeyMessage(result.error || 'Erro ao adicionar chave. Verifique os dados.', 'error');
        }
        
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
    } catch (error) {
        console.error('Add key error:', error);
        showAddKeyMessage('Erro ao processar chave. Tente novamente.', 'error');
        
        // Restore button state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Chave';
            submitBtn.disabled = false;
        }
    }
}

// Validate and Add Key
async function validateAndAddKey(accessKey) {
    try {
        if (window.ipcRenderer) {
            const result = await window.ipcRenderer.invoke('add-user-key', { accessKey });
            return result;
        } else {
            // Fallback for testing - simulate key validation
            if (accessKey === 'TGS-2024-PREMIUM-001' || accessKey === 'TGS-2024-STANDARD-001') {
                return { success: true };
            }
            return { success: false, error: 'Chave inválida ou já utilizada' };
        }
    } catch (error) {
        console.error('Key validation error:', error);
        return { success: false, error: 'Erro ao validar chave' };
    }
}

// Show Add Key Message
function showAddKeyMessage(message, type = 'info') {
    const messageElement = document.getElementById('addKeyMessage');
    const textElement = document.getElementById('addKeyText');
    
    if (!messageElement || !textElement) return;
    
    textElement.textContent = message;
    messageElement.className = `add-key-message ${type}`;
    messageElement.style.display = 'flex';
    
    // Auto hide success messages
    if (type === 'success') {
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    }
}

// Clear Add Key Form
function clearAddKeyForm() {
    const form = document.getElementById('addKeyForm');
    if (form) {
        form.reset();
    }
    
    const messageElement = document.getElementById('addKeyMessage');
    if (messageElement) {
        messageElement.style.display = 'none';
    }
}

// Admin Menu Functions
function checkAdminAccess() {
    const userRole = localStorage.getItem('userRole');
    const adminMenuBtn = document.getElementById('adminMenuBtn');
    
    if (userRole === 'admin' && adminMenuBtn) {
        adminMenuBtn.style.display = 'flex';
        return true;
    }
    
    return false;
}

// Creator Menu Functions
async function checkCreatorAccess() {
    const creatorMenuBtn = document.getElementById('creatorMenuBtn');
    
    try {
        const token = getAuthToken();
        if (!token) {
            return false;
        }

        // Verificar se usuário tem key creator
        const response = await fetch('http://localhost:3002/api/user/keys', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        if (data.success && data.keys) {
            const hasCreatorKey = data.keys.some(key => key.type === 'creator');
            
            if (hasCreatorKey && creatorMenuBtn) {
                creatorMenuBtn.style.display = 'flex';
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Erro ao verificar permissão creator:', error);
        return false;
    }
}

async function loadAllUsers() {
    console.log('🔧 loadAllUsers() chamada');
    const loadingElement = document.getElementById('adminLoading');
    const emptyElement = document.getElementById('adminEmpty');
    const tableBody = document.getElementById('usersTableBody');
    
    try {
        loadingElement.style.display = 'block';
        emptyElement.style.display = 'none';
        tableBody.innerHTML = '';
        
        const token = getAuthToken();
        if (!token) {
            throw new Error('Sessão expirada');
        }
        
        let users;
        if (window.ipcRenderer) {
            users = await window.ipcRenderer.invoke('get-all-users', { token });
        } else {
            // Fallback for testing
            users = {
                success: true,
                users: [
                    { id: '1', username: 'admin', permissions: ['admin'], status: 'active' },
                    { id: '2', username: 'user1', permissions: ['standard'], status: 'active' },
                    { id: '3', username: 'creator1', permissions: ['creator'], status: 'active' },
                    { id: '4', username: 'banned_user', permissions: ['standard'], status: 'banned' }
                ]
            };
        }
        
        if (users.success && users.users) {
            displayUsers(users.users);
        } else {
            throw new Error(users.error || 'Erro ao carregar usuários');
        }
        
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Erro ao carregar usuários: ' + error.message, 'error');
        emptyElement.style.display = 'block';
    } finally {
        loadingElement.style.display = 'none';
    }
}

function displayUsers(users) {
    const tableBody = document.getElementById('usersTableBody');
    const emptyElement = document.getElementById('adminEmpty');
    
    if (!users || users.length === 0) {
        tableBody.innerHTML = '';
        emptyElement.style.display = 'block';
        return;
    }
    
    emptyElement.style.display = 'none';
    
    tableBody.innerHTML = users.map(user => `
        <tr>
            <td><span class="user-id">#${user.id}</span></td>
            <td><span class="user-name">${user.username}</span></td>
            <td>
                <div class="user-permissions">
                    ${user.permissions.map(perm => {
                        if (perm === 'creator' && user.keyDetails) {
                            const creatorKey = user.keyDetails.find(k => k.type === 'creator');
                            if (creatorKey) {
                                return `
                                    <div class="permission-badge creator" style="margin-bottom: 5px;">
                                        <div><i class="fa-solid fa-key" style="color: black;"></i></div>
                                    </div>
                                `;
                            }
                        }
                        return `<span class="permission-badge ${perm}">${perm}</span>`;
                    }).join('')}
                </div>
            </td>
            <td>
                <span class="user-status ${user.status}">${user.status === 'active' ? 'Ativa' : 'Banida'}</span>
            </td>
            <td>
                <div class="user-actions">
                    <div class="dropdown">
                        <button class="dropdown-toggle" onclick="toggleDropdown(this, event)">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="dropdown-menu">
                            ${!user.permissions.includes('creator') ? `
                                <a href="#" class="dropdown-item" onclick="addCreatorPermission('${user.id}', '${user.username}')">
                                    <i class="fas fa-plus"></i> Adicionar Creator
                                </a>
                            ` : `
                                <a href="#" class="dropdown-item remove-creator" onclick="removeCreatorPermission('${user.id}', '${user.username}')">
                                    <i class="fas fa-minus"></i> Remover Creator
                                </a>
                            `}
                            ${user.status === 'active' ? `
                                <a href="#" class="dropdown-item ban" onclick="banUser('${user.id}', '${user.username}')">
                                    <i class="fas fa-ban"></i> Banir
                                </a>
                            ` : `
                                <a href="#" class="dropdown-item unban" onclick="unbanUser('${user.id}', '${user.username}')">
                                    <i class="fas fa-check"></i> Desbanir
                                </a>
                            `}
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    `).join('');
}

async function addCreatorPermission(userId, username) {
    // Mostrar modal para configurar taxa e validade
    showCreatorKeyModal(userId, username);
}

function showCreatorKeyModal(userId, username) {
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <h3>🔑 Gerar Key Creator</h3>
            <p><strong>Usuário:</strong> ${username}</p>
            
            <div style="margin: 20px 0;">
                <label for="platformFee"><strong>Taxa da Plataforma (%):</strong></label>
                <input type="number" id="platformFee" min="0" max="100" step="0.01" value="10.00" 
                       style="width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
                <small style="color: #666;">Percentual que a plataforma retém das vendas (0-100%)</small>
            </div>
            
            <div style="margin: 20px 0;">
                <label><strong>Validade da Key:</strong></label>
                <div style="margin: 10px 0;">
                    <label>
                        <input type="radio" name="keyType" value="lifetime" checked onchange="toggleExpiryDate(false)">
                        Vitalícia (sem expiração)
                    </label>
                </div>
                <div style="margin: 10px 0;">
                    <label>
                        <input type="radio" name="keyType" value="temporary" onchange="toggleExpiryDate(true)">
                        Expira em data específica
                    </label>
                    <input type="date" id="expiryDate" disabled 
                           style="width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
                </div>
            </div>
            
            <div style="text-align: right; margin-top: 20px;">
                <button onclick="closeCreatorKeyModal()" style="margin-right: 10px;">Cancelar</button>
                <button onclick="generateCreatorKey(${userId}, '${username}')" style="background: #28a745;">Gerar Key</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function toggleExpiryDate(enable) {
    const expiryDateInput = document.getElementById('expiryDate');
    expiryDateInput.disabled = !enable;
    if (enable) {
        // Definir data mínima como amanhã
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        expiryDateInput.min = tomorrow.toISOString().split('T')[0];
    }
}

async function generateCreatorKey(userId, username) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Sessão expirada');
        }
        
        // Obter valores do modal
        const platformFee = document.getElementById('platformFee').value;
        const isLifetime = document.querySelector('input[name="keyType"]:checked').value === 'lifetime';
        const expiryDate = isLifetime ? null : document.getElementById('expiryDate').value;
        
        // Validar
        if (!isLifetime && !expiryDate) {
            showNotification('Por favor, selecione uma data de expiração', 'error');
            return;
        }
        
        showNotification('Gerando key "creator"...', 'info');
        
        let result;
        if (window.ipcRenderer) {
            // Gerar key creator para o usuário com taxa e validade
            result = await window.ipcRenderer.invoke('generate-creator-key', { 
                userId, 
                username,
                platformFee,
                expiryDate,
                token 
            });
        } else {
            // Fallback for testing - simula geração de key
            result = { 
                success: true, 
                key: `TGS-CREATOR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                message: 'Key "creator" gerada com sucesso!'
            };
        }
        
        if (result.success) {
            const generatedKey = result.key;
            
            // Fechar modal de configuração
            closeCreatorKeyModal();
            
            // Mostrar key gerada em um modal
            showGeneratedKeyModal(username, generatedKey, platformFee, expiryDate);
            
            // Atualizar lista de usuários
            await loadAllUsers();
            
        } else {
            throw new Error(result.error || 'Erro ao gerar key "creator"');
        }
        
    } catch (error) {
        console.error('Error generating creator key:', error);
        showNotification('Erro ao gerar key: ' + error.message, 'error');
    }
}

function closeCreatorKeyModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

async function removeCreatorPermission(userId, username) {
    if (!confirm(`Tem certeza que deseja remover a permissão "creator" do usuário "${username}"?`)) {
        return;
    }
    
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Sessão expirada');
        }
        
        showNotification('Removendo permissão "creator"...', 'info');
        
        let result;
        if (window.ipcRenderer) {
            // Remover permissão creator do usuário
            result = await window.ipcRenderer.invoke('remove-creator-permission', { 
                userId, 
                username,
                token 
            });
        } else {
            // Fallback for testing - simula remoção
            result = { 
                success: true, 
                message: 'Permissão "creator" removida com sucesso!'
            };
        }
        
        if (result.success) {
            showNotification('Permissão "creator" removida com sucesso!', 'success');
            
            // Atualizar lista de usuários
            await loadAllUsers();
            
        } else {
            throw new Error(result.error || 'Erro ao remover permissão "creator"');
        }
        
    } catch (error) {
        console.error('Error removing creator permission:', error);
        showNotification('Erro ao remover permissão: ' + error.message, 'error');
    }
}

// Modal para exibir key gerada
function showGeneratedKeyModal(username, key, platformFee = '10.00', expiryDate = null) {
    // Criar modal se não existir
    let modal = document.getElementById('generatedKeyModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'generatedKeyModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <i class="fas fa-key"></i>
                    <h3>Key Creator Gerada</h3>
                    <button class="close-modal" id="closeGeneratedKeyModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="key-generation-info">
                        <p class="modal-subtitle">Uma nova key "creator" foi gerada para:</p>
                        <div class="user-info-display">
                            <i class="fas fa-user"></i>
                            <span id="modalUsername">${username}</span>
                        </div>
                        
                        <div class="generated-key-section">
                            <h4>Key Gerada:</h4>
                            <div class="key-display">
                                <input type="text" id="generatedKeyInput" value="${key}" readonly>
                                <button class="copy-key-btn" id="copyKeyBtn" title="Copiar key">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="key-details" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <h4>📋 Detalhes da Key:</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                                <div>
                                    <strong>💰 Taxa da Plataforma:</strong><br>
                                    <span style="color: #28a745; font-size: 16px;">${platformFee}%</span>
                                </div>
                                <div>
                                    <strong>⏰ Validade:</strong><br>
                                    <span style="color: #007bff; font-size: 14px;">
                                        ${expiryDate ? `Expira em ${new Date(expiryDate).toLocaleDateString('pt-BR')}` : 'Vitalícia'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="key-instructions">
                            <h4>Instruções:</h4>
                            <ul>
                                <li>Envie esta key para o usuário "${username}"</li>
                                <li>O usuário deve adicionar a key em "Meu Perfil" > "Adicionar Nova Chave"</li>
                                <li>Após adicionar, o usuário terá acesso creator</li>
                                <li>Guarde uma cópia desta key para registro</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn secondary" id="closeGeneratedKeyBtn">
                        <i class="fas fa-check"></i> Entendido
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Adicionar event listeners
        document.getElementById('closeGeneratedKeyModal').addEventListener('click', hideGeneratedKeyModal);
        document.getElementById('closeGeneratedKeyBtn').addEventListener('click', hideGeneratedKeyModal);
        document.getElementById('copyKeyBtn').addEventListener('click', copyGeneratedKey);
        
        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideGeneratedKeyModal();
            }
        });
        
        // Fechar com ESC
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                hideGeneratedKeyModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        });
    } else {
        // Atualizar dados se modal já existir
        document.getElementById('modalUsername').textContent = username;
        document.getElementById('generatedKeyInput').value = key;
    }
    
    // Mostrar modal
    modal.style.display = 'flex';
}

function hideGeneratedKeyModal() {
    const modal = document.getElementById('generatedKeyModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function copyGeneratedKey() {
    const keyInput = document.getElementById('generatedKeyInput');
    const copyBtn = document.getElementById('copyKeyBtn');
    
    if (keyInput) {
        keyInput.select();
        keyInput.setSelectionRange(0, 99999); // Para mobile
        
        try {
            document.execCommand('copy');
            
            // Feedback visual
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyBtn.style.background = '#4CAF50';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.style.background = '';
            }, 2000);
            
            showNotification('Key copiada para a área de transferência!', 'success');
        } catch (err) {
            console.error('Erro ao copiar key:', err);
            showNotification('Erro ao copiar key', 'error');
        }
    }
}

async function banUser(userId, username) {
    if (!confirm(`Tem certeza que deseja banir o usuário "${username}"?`)) {
        return;
    }
    
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Sessão expirada');
        }
        
        let result;
        if (window.ipcRenderer) {
            result = await window.ipcRenderer.invoke('ban-user', { userId, token });
        } else {
            // Fallback for testing
            result = { success: true };
        }
        
        if (result.success) {
            showNotification(`Usuário "${username}" banido com sucesso!`, 'success');
            await loadAllUsers(); // Refresh the list
        } else {
            throw new Error(result.error || 'Erro ao banir usuário');
        }
        
    } catch (error) {
        console.error('Error banning user:', error);
        showNotification('Erro ao banir usuário: ' + error.message, 'error');
    }
}

async function unbanUser(userId, username) {
    if (!confirm(`Tem certeza que deseja desbanir o usuário "${username}"?`)) {
        return;
    }
    
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Sessão expirada');
        }
        
        let result;
        if (window.ipcRenderer) {
            result = await window.ipcRenderer.invoke('unban-user', { userId, token });
        } else {
            // Fallback for testing
            result = { success: true };
        }
        
        if (result.success) {
            showNotification(`Usuário "${username}" desbanido com sucesso!`, 'success');
            await loadAllUsers(); // Refresh the list
        } else {
            throw new Error(result.error || 'Erro ao desbanir usuário');
        }
        
    } catch (error) {
        console.error('Error unbanning user:', error);
        showNotification('Erro ao desbanir usuário: ' + error.message, 'error');
    }
}

// Load creator's mods
async function loadCreatorMods() {
    console.log('🔧 loadCreatorMods() chamada');
    const loadingElement = document.getElementById('creatorLoading');
    const emptyElement = document.getElementById('creatorEmpty');
    const modsGrid = document.getElementById('creatorModsGrid');
    
    try {
        loadingElement.style.display = 'block';
        emptyElement.style.display = 'none';
        modsGrid.innerHTML = '';
        
        // Obter token do usuário
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Usuário não autenticado');
        }
        
        // Buscar mods do creator via API
        const response = await window.ipcRenderer.invoke('get-creator-mods', { token });
        
        if (!response.success) {
            throw new Error(response.message || 'Erro ao carregar mods');
        }
        
        const creatorMods = response.mods || [];
        
        if (creatorMods.length === 0) {
            emptyElement.style.display = 'block';
        } else {
            renderCreatorMods(creatorMods);
        }
        
        // Update stats
        updateCreatorStats(creatorMods);
        
    } catch (error) {
        console.error('Erro ao carregar mods do creator:', error);
        showNotification('Erro ao carregar mods: ' + error.message, 'error');
        emptyElement.style.display = 'block';
    } finally {
        loadingElement.style.display = 'none';
    }
}

// Render creator mods
function renderCreatorMods(mods) {
    const modsGrid = document.getElementById('creatorModsGrid');
    
    modsGrid.innerHTML = mods.map(mod => `
        <div class="creator-mod-card">
            <div class="mod-image">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI4MCIgZmlsbD0iIzZDNjNGRiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiPiR7ZW5jb2RlVVJJQ29tcG9uZW50KG1vZC5uYW1lKX08L3RleHQ+PC9zdmc+" alt="${mod.name}">
            </div>
            <h4>${mod.name}</h4>
            <p class="mod-description">${mod.description}</p>
            <div class="mod-stats">
                <span><i class="fas fa-download"></i> ${mod.downloads || 0}</span>
                <span><i class="fas fa-tag"></i> ${mod.category}</span>
                ${mod.price ? `<span><i class="fas fa-dollar-sign"></i> ${mod.price}</span>` : '<span><i class="fas fa-gift"></i> Gratuito</span>'}
            </div>
            <div class="mod-actions">
                <button class="btn-secondary" onclick="editMod('${mod.id.toString()}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-danger" onclick="deleteMod('${mod.id.toString()}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
                <span class="mod-status ${mod.status}">${mod.status === 'published' ? 'Publicado' : 'Rascunho'}</span>
            </div>
        </div>
    `).join('');
}

// Update creator statistics
async function updateCreatorStats(mods) {
    try {
        // Obter token do usuário
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('Token não encontrado para atualizar estatísticas');
            return;
        }
        
        // Buscar estatísticas reais via API
        const response = await window.ipcRenderer.invoke('get-creator-stats', { token });
        
        // Buscar informações da key creator
        const keyResponse = await window.ipcRenderer.invoke('get-creator-key-info', { token });
        
        if (response.success) {
            const stats = response.stats;
            
            // Verificar se o usuário é admin (ID 1)
            const isAdmin = window.currentUser?.id === 1 || window.currentUser?.username === 'admin';
            
            // Calcular receita com isenção para admin
            let revenue = stats.totalRevenue || 0;
            if (isAdmin) {
                // Admin recebe 100% da receita, sem taxas
                console.log('🔧 Admin (ID 1) - Receita sem taxa aplicada:', revenue);
            }
            
            // Atualizar cards de estatísticas
            const totalModsElement = document.getElementById('totalMods');
            const publishedModsElement = document.getElementById('publishedMods');
            const totalDownloadsElement = document.getElementById('totalDownloads');
            const totalRevenueElement = document.getElementById('totalRevenue');
            
            if (totalModsElement) totalModsElement.textContent = stats.totalMods || 0;
            if (publishedModsElement) publishedModsElement.textContent = stats.publishedMods || 0;
            if (totalDownloadsElement) totalDownloadsElement.textContent = stats.totalDownloads || 0;
            if (totalRevenueElement) totalRevenueElement.textContent = `$${revenue.toFixed(2)}`;
            
            // Atualizar estatísticas da carteira
            updateWalletStats(stats.wallet || {});
        }
        
        // Atualizar informações da key creator
        console.log('🔧 keyResponse completo:', keyResponse);
        if (keyResponse.success) {
            updateCreatorKeyInfo(keyResponse.keyInfo);
        } else {
            // Se não conseguiu obter informações da key, não atualizar a taxa
            console.log('🔧 Não foi possível obter informações da key creator - mantendo valor atual');
        }
        
    } catch (error) {
        console.error('Erro ao atualizar estatísticas do creator:', error);
    }
}

// Update creator key information display
function updateCreatorKeyInfo(keyInfo) {
    console.log('🔧 updateCreatorKeyInfo chamada com:', keyInfo);
    const platformFeeElement = document.getElementById('platformFeeRate');
    
    if (platformFeeElement) {
        // Verificar se o usuário é admin (ID 1)
        const isAdmin = window.currentUser?.id === 1 || window.currentUser?.username === 'admin';
        
        if (isAdmin) {
            // Admin não exibe taxa
            platformFeeElement.innerHTML = 'Isento';
            platformFeeElement.style.color = '#28a745'; // Verde
            console.log('🔧 Admin (ID 1) - Taxa oculta, exibindo "Isento"');
        } else {
            // Outros usuários veem a taxa normalmente
            const displayFee = keyInfo.platformFee == 0 ? '0%' : `-${keyInfo.platformFee}%`;
            platformFeeElement.innerHTML = displayFee;
            platformFeeElement.style.color = keyInfo.platformFee == 0 ? '#28a745' : '#dc3545';
            console.log('🔧 Taxa atualizada para:', displayFee);
        }
    } else {
        console.log('❌ Elemento platformFeeRate não encontrado');
    }
}

// Fallback para cálculo local de estatísticas
function updateStatsFromMods(mods) {
    const totalMods = mods.length;
    const publishedMods = mods.filter(mod => mod.status === 'published').length;
    const totalDownloads = mods.reduce((sum, mod) => sum + (mod.downloads || 0), 0);
    
    // Verificar se o usuário é admin (ID 1)
    const isAdmin = window.currentUser?.id === 1 || window.currentUser?.username === 'admin';
    
    // Calcular receita bruta
    const grossRevenue = mods
        .filter(mod => mod.status === 'published' && !mod.free)
        .reduce((sum, mod) => sum + ((mod.price || 0) * (mod.downloads || 0)), 0);
    
    // Admin não tem taxa, outros usuários têm taxa padrão de 10%
    const platformFeeRate = isAdmin ? 0 : 0.10;
    const netRevenue = grossRevenue * (1 - platformFeeRate);
    
    // Atualizar cards
    const totalModsElement = document.getElementById('totalMods');
    const publishedModsElement = document.getElementById('publishedMods');
    const totalDownloadsElement = document.getElementById('totalDownloads');
    const totalRevenueElement = document.getElementById('totalRevenue');
    
    if (totalModsElement) totalModsElement.textContent = totalMods;
    if (publishedModsElement) publishedModsElement.textContent = publishedMods;
    if (totalDownloadsElement) totalDownloadsElement.textContent = totalDownloads;
    if (totalRevenueElement) {
        totalRevenueElement.textContent = `$${netRevenue.toFixed(2)}`;
        if (isAdmin) {
            console.log('🔧 Admin (ID 1) - Receita calculada sem taxa:', netRevenue);
        }
    }
}

// Update wallet statistics
function updateWalletStats(walletData = {
    availableBalance: 245.67,
    pendingBalance: 89.50,
    monthlySales: 156.80,
    lifetimeSales: 1247.89,
    lastUpdated: new Date().toLocaleDateString('pt-BR')
}) {
    // Update balance cards
    document.getElementById('availableBalance').textContent = `$${(walletData.availableBalance || 0).toFixed(2)}`;
    document.getElementById('pendingBalance').textContent = `$${(walletData.pendingBalance || 0).toFixed(2)}`;
    document.getElementById('monthlySales').textContent = `$${(walletData.monthlySales || 0).toFixed(2)}`;
    document.getElementById('lifetimeSales').textContent = `$${(walletData.lifetimeSales || 0).toFixed(2)}`;
    document.getElementById('balanceUpdated').textContent = walletData.lastUpdated || 'N/A';
    
    // Update modal balance
    document.getElementById('modalAvailableBalance').textContent = `$${(walletData.availableBalance || 0).toFixed(2)}`;
}

// Show withdrawal modal
function showWithdrawalModal() {
    const modal = document.getElementById('withdrawalModal');
    const form = document.getElementById('withdrawalForm');
    
    form.reset();
    updateWithdrawalCalculation();
    
    modal.style.display = 'flex';
}

// Close withdrawal modal
function closeWithdrawalModal() {
    const modal = document.getElementById('withdrawalModal');
    modal.style.display = 'none';
}

// Update withdrawal calculation
function updateWithdrawalCalculation() {
    const amount = parseFloat(document.getElementById('withdrawalAmount').value) || 0;
    const availableBalance = parseFloat(document.getElementById('modalAvailableBalance').textContent.replace('$', ''));
    const fee = 2.50;
    const netAmount = Math.max(0, amount - fee);
    
    // Update net amount display
    document.getElementById('modalNetAmount').textContent = `$${netAmount.toFixed(2)}`;
    
    // Validate amount
    const submitBtn = document.querySelector('#withdrawalForm button[type="submit"]');
    if (amount < 10 || amount > availableBalance) {
        submitBtn.disabled = true;
        submitBtn.classList.add('disabled');
    } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove('disabled');
    }
}

// Handle payment method change
function handlePaymentMethodChange() {
    const method = document.getElementById('paymentMethod').value;
    
    // Hide all method-specific fields
    document.getElementById('paypalFields').style.display = 'none';
    document.getElementById('bankFields').style.display = 'none';
    document.getElementById('pixFields').style.display = 'none';
    
    // Show relevant fields
    if (method === 'paypal') {
        document.getElementById('paypalFields').style.display = 'block';
    } else if (method === 'bank') {
        document.getElementById('bankFields').style.display = 'block';
    } else if (method === 'pix') {
        document.getElementById('pixFields').style.display = 'block';
    }
}

// Process withdrawal request
async function processWithdrawal(formData) {
    try {
        showNotification('Processando solicitação de saque...', 'info');
        
        // Simulação - no futuro enviar para API
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showNotification('Saque solicitado com sucesso! Você receberá o dinheiro em até 5 dias úteis.', 'success');
        closeWithdrawalModal();
        
        // Update balance (simulate deduction)
        const currentBalance = parseFloat(document.getElementById('availableBalance').textContent.replace('$', ''));
        const amount = parseFloat(formData.get('amount'));
        const newBalance = currentBalance - amount;
        document.getElementById('availableBalance').textContent = `$${newBalance.toFixed(2)}`;
        
    } catch (error) {
        console.error('Erro ao processar saque:', error);
        showNotification('Erro ao processar solicitação de saque', 'error');
    }
}

// Show transactions history (placeholder)
function showTransactionsHistory() {
    showNotification('Histórico de transações em desenvolvimento', 'info');
}

// Show add mod modal
function showAddModModal() {
    const modal = document.getElementById('addEditModModal');
    const title = document.getElementById('modModalTitle');
    const form = document.getElementById('addEditModForm');
    
    title.textContent = 'Adicionar Novo Mod';
    form.reset();
    form.setAttribute('data-editing', 'false');
    
    // Limpar imagens
    clearImagesList();
    
    modal.style.display = 'flex';
}

// Show edit mod modal
async function showEditModModal(modId) {
    const modal = document.getElementById('addEditModModal');
    const title = document.getElementById('modModalTitle');
    const form = document.getElementById('addEditModForm');
    
    try {
        // Obter token do usuário
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Usuário não autenticado');
        }
        
        // Buscar dados do mod da lista já carregada no Creator Menu
        const creatorModsResponse = await window.ipcRenderer.invoke('get-creator-mods', { token });
        
        if (!creatorModsResponse.success) {
            throw new Error('Erro ao carregar mods do creator');
        }
        
        // Encontrar o mod específico pelo ID
        const modData = creatorModsResponse.mods.find(mod => mod.id.toString() === modId.toString());
        
        if (!modData) {
            throw new Error('Mod não encontrado');
        }
        
        title.textContent = 'Editar Mod';
        form.setAttribute('data-editing', 'true');
        form.setAttribute('data-mod-id', modId);
        
        // Preencher formulário com dados reais
        document.getElementById('modName').value = modData.name || '';
        document.getElementById('modDescription').value = modData.description || '';
        document.getElementById('modCategory').value = modData.category || '';
        document.getElementById('modPrice').value = modData.price || '';
        document.getElementById('modStatus').value = modData.status || 'draft';
        document.getElementById('modFree').checked = modData.free || false;
        
        // Adicionar campo hidden com status atual
        let currentStatusInput = document.getElementById('currentStatus');
        if (!currentStatusInput) {
            currentStatusInput = document.createElement('input');
            currentStatusInput.type = 'hidden';
            currentStatusInput.id = 'currentStatus';
            currentStatusInput.name = 'currentStatus';
            form.appendChild(currentStatusInput);
        }
        currentStatusInput.value = modData.status || 'draft';
        
        // Carregar imagens reais do mod
        if (modData.images && modData.images.length > 0) {
            const imagesList = document.getElementById('imagesList');
            imagesList.innerHTML = modData.images.map(img => createImageItem(img)).join('');
        } else {
            clearImagesList();
        }
        
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Erro ao carregar mod para edição:', error);
        showNotification('Erro ao carregar dados do mod: ' + error.message, 'error');
    }
}

// Clear images list
function clearImagesList() {
    const imagesList = document.getElementById('imagesList');
    imagesList.innerHTML = '<div class="empty-images">Nenhuma imagem adicionada ainda</div>';
}

// Load sample images for edit modal
function loadSampleImages() {
    const imagesList = document.getElementById('imagesList');
    const sampleImages = [
        { id: 1, url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjNkM2M0ZGIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCI+MTwvdGV4dD48L3N2Zz=', isCover: true },
        { id: 2, url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRkY2QjZEIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCI+MjwvdGV4dD48L3N2Zz=', isCover: false },
        { id: 3, url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjNEVDRENQIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCI+MzwvdGV4dD48L3N2Zz=', isCover: false }
    ];
    
    imagesList.innerHTML = sampleImages.map(img => createImageItem(img)).join('');
}

// Create image item HTML
function createImageItem(imageData) {
    return `
        <div class="image-item ${imageData.isCover ? 'cover' : ''}" data-image-id="${imageData.id}">
            <img src="${imageData.url}" alt="Imagem do mod">
            <div class="image-controls">
                <button class="btn-remove" onclick="removeImage(${imageData.id})" title="Remover imagem">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
}

// Handle image upload
function handleImageUpload(event) {
    const files = event.target.files;
    const imagesList = document.getElementById('imagesList');
    
    // Remove empty message if exists
    const emptyMessage = imagesList.querySelector('.empty-images');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    // Process each file
    Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = {
                    id: Date.now() + index,
                    url: e.target.result,
                    isCover: imagesList.children.length === 0 // Primeira imagem é a capa
                };
                
                const imageItem = document.createElement('div');
                imageItem.innerHTML = createImageItem(imageData);
                imagesList.appendChild(imageItem.firstElementChild);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Remove image
function removeImage(imageId) {
    if (confirm('Tem certeza que deseja remover esta imagem?')) {
        const imageItem = document.querySelector(`[data-image-id="${imageId}"]`);
        if (imageItem) {
            const wasCover = imageItem.classList.contains('cover');
            imageItem.remove();
            
            // Se a imagem removida era a capa, definir a primeira imagem restante como nova capa
            if (wasCover) {
                const firstImage = document.querySelector('.image-item');
                if (firstImage) {
                    firstImage.classList.add('cover');
                }
            }
            
            // Check if list is empty
            const imagesList = document.getElementById('imagesList');
            if (imagesList.children.length === 0) {
                clearImagesList();
            }
        }
    }
}

// Edit mod
function editMod(modId) {
    showEditModModal(modId);
}

// Save mod (add or edit)
async function saveMod(formData) {
    const isEditing = formData.get('editing') === 'true';
    const modId = formData.get('modId');
    
    try {
        // Obter token do usuário
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Usuário não autenticado');
        }
        
        // Coletar imagens do container
        const imagesList = document.getElementById('imagesList');
        const imageItems = imagesList.querySelectorAll('.image-item');
        const images = [];
        
        imageItems.forEach((item, index) => {
            const img = item.querySelector('img');
            const isCover = item.classList.contains('cover');
            
            images.push({
                id: item.getAttribute('data-image-id'),
                url: img.src,
                order: index + 1,
                isCover: isCover
            });
        });
        
        // Preparar dados do mod
        const modData = {
            name: formData.get('name'),
            description: formData.get('description'),
            category: formData.get('category'),
            price: formData.get('price') || 0,
            status: formData.get('status'),
            free: formData.get('free') === 'true',
            images: images
        };
        
        let response;
        if (isEditing) {
            // Editar mod existente
            response = await window.ipcRenderer.invoke('update-mod', { 
                token, 
                modId, 
                modData 
            });
        } else {
            // Criar novo mod
            response = await window.ipcRenderer.invoke('create-mod', { 
                token, 
                modData 
            });
        }
        
        if (!response.success) {
            throw new Error(response.message || `Erro ao ${isEditing ? 'atualizar' : 'criar'} mod`);
        }
        
        showNotification(`Mod ${isEditing ? 'atualizado' : 'criado'} com sucesso!`, 'success');
        closeAddEditModModal();
        
        // Recarregar mods
        await loadCreatorMods();
        
        // Atualizar catálogo público também
        if (typeof loadMods === 'function') {
            await loadMods();
        }
        
    } catch (error) {
        console.error('Erro ao salvar mod:', error);
        showNotification('Erro ao salvar mod: ' + error.message, 'error');
    }
}

// Close add/edit mod modal
function closeAddEditModModal() {
    const modal = document.getElementById('addEditModModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('🔒 Modal fechado');
    } else {
        console.warn('⚠️ Modal não encontrado');
    }
}

// Delete mod
async function deleteMod(modId) {
    if (confirm('Tem certeza que deseja excluir este mod? Esta ação não pode ser desfeita.')) {
        try {
            // Obter token do usuário
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Usuário não autenticado');
            }
            
            // Excluir mod via API
            const response = await window.ipcRenderer.invoke('delete-mod', { 
                token, 
                modId 
            });
            
            if (!response.success) {
                throw new Error(response.message || 'Erro ao excluir mod');
            }
            
            showNotification('Mod excluído com sucesso!', 'success');
            
            // Recarregar lista
            await loadCreatorMods();
            
            // Atualizar catálogo público também
            if (typeof loadMods === 'function') {
                await loadMods();
            }
            
        } catch (error) {
            console.error('Erro ao excluir mod:', error);
            showNotification('Erro ao excluir mod: ' + error.message, 'error');
        }
    }
}

// Close withdrawal modal
function closeWithdrawalModal() {
    const modal = document.getElementById('withdrawalModal');
    modal.style.display = 'none';
}

// Initialize creator functionality when page loads
async function initializeCreatorMenu() {
    const creatorMenuBtn = document.getElementById('creatorMenuBtn');
    const refreshCreatorModsBtn = document.getElementById('refreshCreatorModsBtn');
    const addNewModBtn = document.getElementById('addNewModBtn');
    const closeAddEditModBtn = document.getElementById('closeAddEditModModal');
    const cancelModBtn = document.getElementById('cancelModBtn');
    const addEditModForm = document.getElementById('addEditModForm');
    
    // Wallet buttons
    const requestWithdrawalBtn = document.getElementById('requestWithdrawalBtn');
    const viewTransactionsBtn = document.getElementById('viewTransactionsBtn');
    const closeWithdrawalModal = document.getElementById('closeWithdrawalModal');
    const cancelWithdrawalBtn = document.getElementById('cancelWithdrawalBtn');
    const withdrawalForm = document.getElementById('withdrawalForm');
    const paymentMethod = document.getElementById('paymentMethod');
    const withdrawalAmount = document.getElementById('withdrawalAmount');
    
    // Check creator access and show/hide menu
    const hasCreatorAccess = await checkCreatorAccess();
    
    if (hasCreatorAccess) {
        // Add event listeners
        if (creatorMenuBtn) {
            creatorMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                switchPage('creator');
            });
        }
        
        if (refreshCreatorModsBtn) {
            refreshCreatorModsBtn.addEventListener('click', loadCreatorMods);
        }
        
        if (addNewModBtn) {
            addNewModBtn.addEventListener('click', showAddModModal);
        }
        
        // Wallet event listeners
        if (requestWithdrawalBtn) {
            requestWithdrawalBtn.addEventListener('click', showWithdrawalModal);
        }
        
        if (viewTransactionsBtn) {
            viewTransactionsBtn.addEventListener('click', showTransactionsHistory);
        }
        
        // Withdrawal modal event listeners
        if (closeWithdrawalModal) {
            closeWithdrawalModal.addEventListener('click', closeWithdrawalModal);
        }
        
        if (cancelWithdrawalBtn) {
            cancelWithdrawalBtn.addEventListener('click', closeWithdrawalModal);
        }
        
        if (paymentMethod) {
            paymentMethod.addEventListener('change', handlePaymentMethodChange);
        }
        
        if (withdrawalAmount) {
            withdrawalAmount.addEventListener('input', updateWithdrawalCalculation);
        }
        
        if (withdrawalForm) {
            withdrawalForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData();
                formData.append('amount', document.getElementById('withdrawalAmount').value);
                formData.append('method', document.getElementById('paymentMethod').value);
                
                if (document.getElementById('paymentMethod').value === 'paypal') {
                    formData.append('paypalEmail', document.getElementById('paypalEmail').value);
                } else if (document.getElementById('paymentMethod').value === 'bank') {
                    formData.append('bankInfo', document.getElementById('bankInfo').value);
                } else if (document.getElementById('paymentMethod').value === 'pix') {
                    formData.append('pixKey', document.getElementById('pixKey').value);
                }
                
                await processWithdrawal(formData);
            });
        }
        
        // Modal event listeners
        if (closeAddEditModBtn) {
            closeAddEditModBtn.addEventListener('click', closeAddEditModModal);
        }
        
        if (cancelModBtn) {
            cancelModBtn.addEventListener('click', closeAddEditModModal);
        }
        
        if (addEditModForm) {
            addEditModForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData();
                formData.append('editing', addEditModForm.getAttribute('data-editing') || 'false');
                formData.append('modId', addEditModForm.getAttribute('data-mod-id') || '');
                formData.append('name', document.getElementById('modName').value);
                formData.append('description', document.getElementById('modDescription').value);
                formData.append('category', document.getElementById('modCategory').value);
                formData.append('price', document.getElementById('modPrice').value);
                formData.append('status', document.getElementById('modStatus').value);
                formData.append('free', document.getElementById('modFree').checked);
                
                await saveMod(formData);
            });
        }
        
        // Image upload event listener
        const modImageInput = document.getElementById('modImageInput');
        if (modImageInput) {
            modImageInput.addEventListener('change', handleImageUpload);
        }
        
        // Fechar modais ao clicar fora
        document.getElementById('addEditModModal').addEventListener('click', (e) => {
            if (e.target.id === 'addEditModModal') {
                closeAddEditModModal();
            }
        });
        
        document.getElementById('withdrawalModal').addEventListener('click', (e) => {
            if (e.target.id === 'withdrawalModal') {
                closeWithdrawalModal();
            }
        });
    }
}

// Initialize admin functionality when page loads
function initializeAdminMenu() {
    const adminMenuBtn = document.getElementById('adminMenuBtn');
    const refreshUsersBtn = document.getElementById('refreshUsersBtn');
    
    // Check admin access and show/hide menu
    if (checkAdminAccess()) {
        // Add event listeners
        if (adminMenuBtn) {
            adminMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                switchPage('admin');
            });
        }
        
        if (refreshUsersBtn) {
            refreshUsersBtn.addEventListener('click', loadAllUsers);
        }
    }
}
