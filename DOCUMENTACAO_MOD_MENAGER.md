# 🎮 Documentação - Mod Menager

> Sistema completo de gerenciamento de mods para FiveM com autenticação segura e interface intuitiva

---

## Índice

- [Visão Geral](#-visão-geral)
- [Integração com o TGS Launcher](#integração-com-o-tgs-launcher)
- [Tecnologias e Arquitetura](#-tecnologias-e-arquitetura)
- [Instalação e Execução](#-instalação-e-execução)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Como Usar](#-como-usar)
- [API Reference](#-api-reference)
- [Configuração e Personalização](#-configuração-e-personalização)
- [Logs e Troubleshooting](#-logs-e-troubleshooting)
- [Segurança](#-segurança)

---

## 🌐 Visão Geral

O **Mod Menager** é um launcher moderno e elegante para gerenciar mods do FiveM com autenticação segura e interface intuitiva. O sistema foi projetado com arquitetura client-server, proporcionando uma experiência profissional para organização e ativação de mods.

### Objetivo Principal

- **Autenticação Segura** — Sistema de login com chave exclusiva e validação robusta
- **Catálogo Visual** — Interface de catálogo com cards informativos e organização intuitiva
- **Gerenciamento Inteligente** — Ativação/desativação com um clique e estado persistente
- **Integração FiveM** — Aplicação automática dos mods ao iniciar o FiveM

### Mods Pré-configurados

O sistema inclui 8 mods pré-configurados:

- 🎨 **Enhanced Graphics** — Melhorias visuais e gráficas
- 🔫 **Realistic Weapons** — Armas realistas e balanceadas
- 🚗 **Vehicle Pack Pro** — Pacote de veículos premium
- 📱 **UI Overhaul** — Interface do usuário aprimorada
- 🔊 **Sound Enhancement** — Melhorias de áudio
- ⚡ **Performance Boost** — Otimizações de performance
- 🎭 **Roleplay Essentials** — Ferramentas essenciais para RP
- 🗺️ **Map Extensions** — Expansões de mapa

### Integração com o TGS Launcher

O **TGS Launcher** instala o `TGS-Mod-Manager-Portable.exe` a partir da release pública correspondente, em `<installPath>\data\apps\modManager\`. Use o hub para **Executar** e manter o mesmo `installPath` em disco; o cliente Mod pode usar **electron-updater** para updates em cima do portable. Referência: [DOCUMENTACAO_LAUNCHER.md](DOCUMENTACAO_LAUNCHER.md) e constantes do hub em `MainCode/Launcher/src/main/constants.js`.

---

## 🛠 Tecnologias e Arquitetura

### Stack Tecnológico

| Componente | Tecnologia | Versão | Uso |
|-------------|------------|--------|-----|
| **Runtime** | Electron | ^24 (cliente; conferir `client/package.json`) | Aplicação desktop |
| **Frontend** | HTML/CSS/JavaScript | — | Interface do utilizador |
| **Backend** | Node.js + Express | 20.x recomendado | API REST e autenticação |
| **Auth** | JWT + bcrypt | - | Sistema de autenticação |
| **HTTP Client** | Axios | - | Comunicação client-server |
| **Security** | Helmet + CORS | - | Headers de segurança |
| **Database** | JSON Local | - | Armazenamento de dados |

### Arquitetura Client-Server

```
┌─────────────────────────────────────────┐
│           Client (Electron)             │
│  ┌─────────────────────────────────┐    │
│  │      Interface do Usuário       │    │
│  │   • Login                       │    │
│  │   • Catálogo de Mods            │    │
│  │   • Dashboard                   │    │
│  └─────────────────────────────────┘    │
└─────────────────┬───────────────────────┘
                  │ API REST (HTTPS)
                  ▼
┌─────────────────────────────────────────┐
│           Server (Node.js)               │
│  ┌─────────────────────────────────┐    │
│  │      Backend Services           │    │
│  │   • Autenticação JWT            │    │
│  │   • Gerenciamento de Mods       │    │
│  │   • Banco de Dados JSON         │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Estrutura do Projeto

```
Mod Menager/
├── 📁 client/                     # Aplicação Electron
│   ├── 📁 src/
│   │   ├── 📄 main.js            # Processo principal
│   │   ├── 📄 login.html         # Tela de login
│   │   ├── 📄 dashboard.html     # Dashboard principal
│   │   ├── 📄 script.js          # Lógica frontend
│   │   └── 📄 styles.css         # Estilos
│   ├── 📁 assets/                # Imagens e mídias
│   └── 📄 package.json           # Dependências do cliente
├── 📁 server/                    # Servidor Node.js
│   ├── 📁 src/
│   │   ├── 📄 app.js             # Configuração Express
│   │   ├── 📄 server.js          # Ponto de entrada
│   │   └── 📄 database.js        # Gerenciamento DB
│   ├── 📁 config/
│   │   └── 📄 config.js          # Configurações
│   ├── 📁 routes/
│   │   ├── 📄 auth.js            # Rotas de autenticação
│   │   └── 📄 mods.js            # Rotas de mods
│   ├── 📁 middleware/
│   │   └── 📄 auth.js            # Middleware JWT
│   └── 📄 package.json           # Dependências do servidor
├── 📁 Dependence/                # 📍 Dependências unificadas (único local)
└── 📄 README.md                  # Documentação
```

---

## 📦 Instalação e Execução

### Pré-requisitos

- **Node.js** 16.0.0 ou superior
- **NPM** ou **Yarn** package menager
- **Windows 10+** / **macOS 12+** / **Ubuntu 20.04+**

### Instalação

1. **Instalar Dependências (Raiz)**:
```bash
cd "MainCode/Mod Menager"
# As dependências são buscadas do diretório unificado Dependence/
npm install
```

2. **Configurar o Servidor**:
```bash
cd server
cp .env.example .env
# Edite .env se necessário (PORT deve ser 3002)
```

3. **Executar em desenvolvimento**:
```bash
cd ..
npm run dev
# Inicia Servidor (3002) e Cliente Electron simultaneamente
```

### Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm start` | Inicia servidor/cliente |
| `npm run dev` | Modo desenvolvimento |
| `npm run build:win` | Build para Windows |
| `npm run build:mac` | Build para macOS |
| `npm run build:linux` | Build para Linux |

---

## ✨ Funcionalidades Principais

### 🔐 Autenticação Segura

- **Sistema de Login** — Chave de acesso + usuário + senha
- **Tokens JWT** — Sessão persistente com expiração
- **Rate Limiting** — Proteção contra ataques de força bruta
- **Logs de Autenticação** — Registro completo de tentativas

### 📚 Catálogo de Mods

- **Interface Visual** — Cards informativos com ícones e descrições
- **Filtros por Categoria** — Graphics, Weapons, Vehicles, etc.
- **Busca em Tempo Real** — Por nome ou descrição
- **Contador por Categoria** — Visualização rápida de quantidade

### 🎛️ Gerenciamento de Mods

- **Ativação com Um Clique** — Toggle rápido para habilitar/desabilitar
- **Estado Persistente** — Configurações salvas automaticamente
- **Informações Detalhadas** — Versão, tamanho, recursos de cada mod
- **Visualização de Ativos** — Destaque para mods habilitados

### 🚀 Aplicação Automática

- **Botão de Lançamento** — Inicia FiveM com mods ativos
- **Feedback Visual** — Contador de mods ativos no botão
- **Aplicação Automática** — Mods aplicados ao iniciar FiveM
- **Logs de Inicialização** — Registro do processo de启动

### 📊 Sistema de Logs

- **Logs Automáticos** — Todas as ações registradas
- **Organização por Data** — Arquivos de log por dia
- **Tipos de Eventos** — AUTH, MOD, LAUNCH, ERROR, INFO, SETTINGS
- **Interface de Logs** — Visualização integrada dos eventos

---

## 📖 Como Usar

### Credenciais Padrão

**Administrador:**
- Chave: `TGS-2024-PREMIUM-001`
- Usuário: `admin`
- Senha: `<SUA_SENHA_ADMIN>`

**Usuário Padrão:**
- Chave: `LAUNCHER-2024-STANDARD-002`
- Usuário: `user`
- Senha: `<SUA_SENHA_USER>`

### Fluxo de Uso

1. **Login**
   - Insira sua chave de acesso TGS
   - Digite seu nome de usuário
   - Digite sua senha
   - Clique em "Autenticar"

2. **Navegar pelo Catálogo**
   - Visualize todos os mods disponíveis
   - Use os filtros de categoria no topo
   - Use a barra de busca para encontrar mods específicos

3. **Ativar/Desativar Mods**
   - Clique no botão "Ativar" em qualquer card de mod
   - O mod ficará destacado quando ativo
   - O contador de mods ativos será atualizado

4. **Iniciar FiveM**
   - Clique no botão flutuante "Iniciar FiveM" no canto inferior direito
   - O botão mostra quantos mods estão ativos
   - Os mods selecionados serão aplicados automaticamente

---

## 📡 API Reference

### Endpoints de Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/auth/login` | Realiza login do usuário |
| `GET` | `/api/auth/validate` | Valida token JWT |
| `POST` | `/api/auth/refresh` | Renova token JWT |
| `POST` | `/api/auth/logout` | Realiza logout do usuário |

### POST /api/auth/login

**Body:**
```json
{
  "accessKey": "TGS-2024-PREMIUM-001",
  "username": "admin",
  "password": "<SUA_SENHA>"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "user": {
    "id": "user-001",
    "username": "admin",
    "role": "admin",
    "key": "TGS-2024-PREMIUM-001"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Endpoints de Mods

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/mods` | Lista todos os mods (requer autenticação) |
| `GET` | `/api/mods/:id` | Detalhes de um mod específico |
| `POST` | `/api/mods/:id/toggle` | Ativa/desativa um mod |
| `GET` | `/api/mods/enabled/list` | Lista apenas mods ativados |
| `GET` | `/api/mods/category/:category` | Lista mods por categoria |
| `GET` | `/api/mods/search/:query` | Busca mods por termo |
| `GET` | `/api/mods/categories/list` | Lista categorias disponíveis |

### Sistema

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/health` | Verifica saúde do servidor |

---

## ⚙️ Configuração e Personalização

### Setup de Banco de Dados MySQL (Avançado)

Caso opte por utilizar o MySQL em vez do JSON local:

1. **Pré-requisitos**: MySQL Server e Node.js rodando.
2. **Ambiente (`.env`)**:
   ```bash
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=sua_senha_mysql
   DB_NAME=tgs_launcher
   EMAIL_USER=seu_email@gmail.com
   EMAIL_PASS=senha_app_gmail
   ```
3. **Executar Database**: `mysql -u root -p < database/ALL-IN-ONE.sql`
O script cria todas as tabelas, usuário admin padrão (`admin`/`admin123`), sistema de mods, tokens e pagamentos.

### Adicionar Novos Usuários

Edite `auth-config.json`:

```json
{
  "id": "user-003",
  "username": "novouser",
  "key": "TGS-2024-CUSTOM-003",
  "password": "<SUA_SENHA_NOVA>",
  "role": "user",
  "active": true,
  "createdAt": "2024-03-01T10:00:00Z"
}
```

### Adicionar Novos Mods

Edite `mods-config.json`:

```json
{
  "id": "mod-09",
  "name": "Nome do Mod",
  "description": "Descrição detalhada",
  "category": "Graphics",
  "icon": "🎮",
  "version": "1.0.0",
  "size": "100 MB",
  "features": [
    "Recurso 1",
    "Recurso 2",
    "Recurso 3"
  ],
  "path": "mods/nome-do-mod",
  "enabled": false
}
```

### Configuração do Servidor

O arquivo `config/config.js` contém todas as configurações:

```javascript
module.exports = {
    server: {
        port: 3002,
        host: 'localhost'
    },
    jwt: {
        secret: 'your-secret-key',
        expiresIn: '24h'
    },
    auth: {
        requireKey: true,
        requirePassword: true,
        sessionTimeout: 3600000,
        maxAttempts: 3,
        lockoutDuration: 300000
    }
};
```

### Personalização Visual

Edite as variáveis CSS em `styles.css`:

```css
:root {
    --primary-color: #6C63FF;
    --secondary-color: #4A45B1;
    --accent-color: #FF6584;
    /* ... outras variáveis */
}
```

---

## 📋 Logs e Troubleshooting

### Sistema de Logs

Os logs são salvos em:
- **Windows**: `%APPDATA%\Launcher\logs\`
- **Formato**: `YYYY-MM-DD.log`

### Tipos de Eventos Registrados

- `[AUTH]` — Autenticações e tentativas de login
- `[MOD]` — Ativação/desativação de mods
- `[LAUNCH]` — Inicialização do FiveM
- `[ERROR]` — Erros do sistema
- `[INFO]` — Informações gerais
- `[SETTINGS]` — Mudanças de configurações

### Problemas Comuns

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| **FiveM não inicia** | FiveM não instalado | Verifique instalação em `%LOCALAPPDATA%\FiveM\FiveM.exe` |
| **Mods não aparecem** | Configuração incorreta | Verifique `mods-config.json` e reinicie |
| **Erro de autenticação** | Credenciais inválidas | Confirme usuário ativo e senha correta |
| **Servidor não inicia** | Porta em uso | Verifique se porta 3002 está livre |
| **Cliente não conecta** | Servidor offline | Inicie o servidor primeiro |

### Logs de Diagnóstico

**Localização dos Logs:**
- **Server**: `server/logs/combined.log`
- **Error**: `server/logs/error.log`
- **Client**: Console do desenvolvedor Electron

**Níveis de Log:**
- `ERROR`: Erros críticos
- `WARN`: Avisos importantes
- `INFO`: Informações gerais
- `DEBUG`: Detalhes de depuração

---

## 🔒 Segurança

### Medidas Implementadas

| Medida | Implementação |
|--------|---------------|
| **JWT Tokens** | Autenticação com expiração |
| **bcrypt** | Hash de senhas com salt |
| **Rate Limiting** | Proteção contra força bruta |
| **CORS** | Controle de acesso entre origens |
| **Helmet** | Headers de segurança HTTP |
| **Input Validation** | Validação de dados de entrada |

### Boas Práticas de Segurança

- **Senhas Fortes** — Use combinações de letras, números e símbolos
- **Tokens Temporários** — Sessões com expiração configurável
- **Logs de Acesso** — Monitoramento de tentativas de login
- **Validação Rigorosa** — Todos os inputs verificados
- **Atualizações** — Mantenha o sistema atualizado

### Recomendações de Produção

- Use variáveis de ambiente para configurações sensíveis
- Altere o `JWT_SECRET` para uma chave forte e única
- Configure HTTPS em produção
- Implemente logging mais robusto
- Considere banco de dados mais robusto (PostgreSQL, MongoDB)

---

## 🚀 Performance e Otimização

### Métricas de Performance

- **Startup Time**: < 3 segundos
- **Memory Usage**: < 200MB pico
- **CPU Usage**: < 15% durante operações
- **Response Time**: < 100ms para APIs

### Otimizações Implementadas

- **Lazy Loading** — Componentes carregados sob demanda
- **Caching** — Cache de configurações e estado
- **Efficient DOM** — Manipulação otimizada do DOM
- **Background Tasks** — Operações pesadas em background

---

## 📞 Suporte

### Canais de Ajuda

- **Documentação** — Este arquivo como referência principal
- **Issues** — GitHub para bugs e features
- **Comunidade** — Discord TGS para suporte rápido
- **Email** — modmenager@tgs.dev

### Contribuição

Contribuições são bem-vindas:

1. **Fork** o repositório
2. **Branch** — `git checkout -b feature/nova-funcionalidade`
3. **Commit** — `git commit -m 'Add nova funcionalidade'`
4. **Push** — `git push origin feature/nova-funcionalidade`
5. **PR** — Pull request com descrição detalhada

---

<p align="center">
  <strong>Mod Menager — Gerenciamento Profissional de Mods FiveM</strong>
</p>
