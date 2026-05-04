# 🚀 Documentação - TGS Launcher

> Hub central do ecossistema TGS — instalação, gerenciamento e execução de aplicativos

---

## Índice

- [Visão Geral](#-visão-geral)
- [Tecnologias e Arquitetura](#-tecnologias-e-arquitetura)
- [Instalação e Execução](#-instalação-e-execução)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Integração com Aplicativos](#-integração-com-aplicativos)
- [Estrutura Interna](#-estrutura-interna)
- [Logs e Troubleshooting](#-logs-e-troubleshooting)
- [Segurança](#-segurança)

---

## 🌐 Visão Geral

O **TGS Launcher** é a aplicação desktop principal que serve como ponto único de entrada para todo o ecossistema TGS. Desenvolvido como um hub central, ele é responsável por:

- **Instalar** aplicativos disponíveis no ecossistema
- **Organizar** apps instalados com interface unificada
- **Executar** aplicativos através de ambiente controlado
- **Atualizar** automaticamente os apps e o próprio Launcher
- **Monitorar** status e performance do ecossistema

O Launcher nunca executa aplicativos diretamente pelo sistema — sempre gerencia o ciclo de vida completo, garantindo consistência e controle.

---

## 🛠 Tecnologias e Arquitetura

### Stack Tecnológico

| Componente | Tecnologia | Versão | Responsabilidade |
|-------------|------------|--------|------------------|
| **Runtime** | Electron | 39.8.9 | Aplicação desktop nativa |
| **Frontend** | React + TypeScript | 19.x | Interface do usuário |
| **Build Tool** | Vite | 7.x | Desenvolvimento e build |
| **Styling** | TailwindCSS | 4.x | Design system moderno |
| **Backend** | Node.js | 20.x | APIs e lógica interna |
| **HTTP Client** | Axios | - | Comunicação com apps |

### Arquitetura de Processos

```
┌─────────────────────────────────────────┐
│           Main Process                  │
│         (Electron Main)                 │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Renderer  │  │   Backend      │   │
│  │  (React UI) │  │  (Node.js)     │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

- **Main Process** — Gerenciamento de janelas, sistema e ciclo de vida
- **Renderer** — Interface React com design moderno
- **Backend** — APIs internas para comunicação com apps

---

## 📦 Instalação e Execução

### Pré-requisitos

- **Node.js** 20.x ou superior
- **npm** ou **yarn** package menager
- **2GB** de espaço livre em disco
- **Windows 10+** (64 bits)

### Instalação

1. **Navegar para o diretório**:
```bash
cd MainCode/Launcher
```

2. **Instalar dependências**:
```bash
# As dependências são buscadas do diretório unificado Dependence/
npm install
```

3. **Executar em desenvolvimento**:
```bash
npm run dev
```

4. **Build para produção**:
```bash
npm run build
```

### Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build para produção |
| `npm run preview` | Preview do build estático |
| `npm run dist` | Cria executáveis para distribuição |

---

## ✨ Funcionalidades Principais

### 🎨 Interface Moderna

- **Design Glassmorphism** — Interface moderna com gradientes e efeitos visuais
- **Temas Dual** — Dark/Light mode com transições suaves
- **Layout Responsivo** — Adaptável para diferentes tamanhos de tela
- **Animações Fluidas** — Micro-interações e feedback visual

### 🚀 Sistema de Instalação

- **Verificação Automática** — Validação de requisitos do sistema
- **Download Inteligente** — Gestão de arquivos com progresso detalhado
- **Configuração Guiada** — Setup passo a passo para usuários
- **Recuperação** — Reparo automático de instalações corrompidas

### 📊 Dashboard de Gerenciamento

- **Status em Tempo Real** — Monitoramento de processos ativos
- **Logs Detalhados** — Registro completo de operações
- **Métricas de Uso** — Estatísticas e analytics
- **Controle Central** — Gerenciar múltiplos produtos TGS

---

## 🔗 Integração com Aplicativos

### Descoberta de Apps

O Launcher mantém um manifesto interno de aplicativos disponíveis:

```json
{
  "apps": [
    {
      "id": "pack-menager",
      "name": "Pack Menager",
      "version": "2.0.0",
      "description": "Sistema de automação para packs de veículos",
      "requirements": {
        "node": "20+",
        "disk": "1GB"
      }
    },
    {
      "id": "mod-menager",
      "name": "Mod Menager",
      "version": "1.0.0",
      "description": "Gerenciamento de mods com autenticação",
      "requirements": {
        "node": "18+",
        "disk": "500MB"
      }
    }
  ]
}
```

### Ciclo de Vida de App

1. **Descoberta** — Launcher busca apps disponíveis
2. **Verificação** — Valida requisitos do sistema
3. **Download** — Baixa arquivos necessários
4. **Instalação** — Configura ambiente e dependências
5. **Registro** — Adiciona ao catálogo de apps instalados
6. **Execução** — Inicia app através do Launcher
7. **Monitoramento** — Acompanha status e performance

### Comunicação Inter-Apps

- **Eventos** — Launcher emite eventos para apps
- **APIs** — Endpoints internos para troca de dados
- **Estado** — Compartilhamento de configurações
- **Logs** — Centralização de logs do ecossistema

---

## 🏗️ Estrutura Interna

### Diretórios Principais

```
MainCode/Launcher/
├── 📄 index.html                  # Entry point do Vite
├── 📄 vite.config.ts              # Configuração do Build/Dev server
├── 📁 src/                        # Código fonte
│   ├── 📄 main.tsx                # Entry point do React
│   ├── 📄 App.tsx                 # Componente principal do Hub
│   ├── 📁 main/                   # Processo principal Electron
│   │   ├── 📄 main.js             # Entry point Electron
│   │   ├── 📄 installer.js        # Lógica de instalação
│   │   └── 📄 logger.js           # Sistema de logs
│   ├── 📁 shared/                 # Código compartilhado
│   └── 📁 utils/                  # Utilitários e hooks
├── 📁 public/                     # Assets estáticos
└── 📁 Dependence/                 # 📍 Link para dependências unificadas
```

### Componentes UI Principais

- **Welcome** — Tela de boas-vindas e introdução
- **Dashboard** — Visão geral dos apps e status
- **AppCatalog** — Lista de apps disponíveis e instalados
- **Installation** — Interface de instalação com progresso
- **Settings** — Configurações do Launcher e apps
- **Logs** — Visualização de logs e troubleshooting

---

## 📋 Logs e Troubleshooting

### Sistema de Logs

Os logs são armazenados em:

- **Windows**: `%APPDATA%/tgs-launcher/logs/`
- **macOS**: `~/Library/Application Support/tgs-launcher/logs/`
- **Linux**: `~/.config/tgs-launcher/logs/`

### Arquivos de Log

| Arquivo | Conteúdo |
|---------|----------|
| `combined.log` | Todos os eventos do sistema |
| `error.log` | Apenas erros e exceções |
| `apps.log` | Eventos específicos dos apps |
| `installation.log` | Logs de processos de instalação |

### Níveis de Log

- `ERROR` — Erros críticos e exceções
- `WARN` — Avisos importantes e recuperações
- `INFO` — Informações gerais e eventos
- `DEBUG` — Detalhes de depuração

### Troubleshooting Comum

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| **Launcher não inicia** | Porta em uso | Verifique se a porta está livre |
| **App não instala** | Permissões negadas | Execute como administrador |
| **Download falha** | Conexão instável | Verifique conexão e firewall |
| **App não abre** | Instalação corrompida | Use função de reparo |

---

## 🔒 Segurança

### Medidas Implementadas

| Medida | Implementação |
|--------|---------------|
| **Validação de Entrada** | Sanitização rigorosa de dados |
| **CSP Headers** | Content Security Policy configurado |
| **HTTPS Only** | Comunicação segura apenas |
| **XSS Prevention** | Proteção contra cross-site scripting |
| **Hash Verification** | SHA-256 para downloads |
| **Secure Updates** | Verificação de assinatura digital |

### Boas Práticas

- **Sem dados sensíveis em logs** — Senhas e tokens mascarados
- **Tokens temporários** — Sessões com expiração curta
- **Validação rigorosa** — Todos os inputs verificados
- **Isolamento de processos** — Apps executados em ambiente controlado

### Recomendações de Segurança

- **Manter atualizado** — Instalar updates automaticamente
- **Backup regular** — Configurações e dados importantes
- **Monitorar logs** — Identificar atividades suspeitas
- **Rede segura** — Evitar redes públicas não confiáveis

---

## 📊 Performance e Otimização

### Métricas de Performance

- **Startup Time** — < 5 segundos
- **Memory Usage** — < 500MB pico
- **CPU Usage** — < 25% durante operações
- **Disk I/O** — Otimizado para SSDs

### Otimizações Implementadas

- **Lazy Loading** — Componentes carregados sob demanda
- **Code Splitting** — Módulos separados por funcionalidade
- **Caching Inteligente** — Cache de recursos e configurações
- **Background Processing** — Operações pesadas em background

---

## 🔄 Futuro do Launcher

### Roadmap

#### v1.1 (Próximo trimestre)
- [ ] Sistema de notificações push
- [ ] Integração com mobile app
- [ ] Temas customizáveis
- [ ] Multi-idioma completo

#### v1.2 (6 meses)
- [ ] AI assistant para instalação
- [ ] Marketplace integrado
- [ ] Advanced analytics
- [ ] User profiles

#### v2.0 (12 meses)
- [ ] PWA (Progressive Web App)
- [ ] Offline mode completo
- [ ] Real-time collaboration
- [ ] Enterprise features

---

## 📞 Suporte

### Canais de Ajuda

- **Documentação** — Este arquivo como referência principal
- **Issues** — GitHub para bugs e features
- **Comunidade** — Discord TGS para suporte rápido
- **Email** — launcher@tgs.dev

### Contribuição

Contribuições são bem-vindas:

1. **Fork** o repositório
2. **Branch** — `git checkout -b feature/nova-funcionalidade`
3. **Commit** — `git commit -m 'Add nova funcionalidade'`
4. **Push** — `git push origin feature/nova-funcionalidade`
5. **PR** — Pull request com descrição detalhada

---

<p align="center">
  <strong>TGS Launcher — Hub Central do Ecossistema TGS</strong>
</p>
