# 📋 Documentação Geral - Projeto TGS Launcher

> Visão completa do ecossistema TGS Launcher e suas aplicações

---

## Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura do Ecossistema](#-arquitetura-do-ecossistema)
- [Fluxos do Usuário](#-fluxos-do-usuário)
- [Sistema de Auto-Update (GitHub Releases)](#sistema-de-auto-update-github-releases)
- [Convenções e Estrutura](#-convenções-e-estrutura)
- [Roadmap e Expansão](#-roadmap-e-expansão)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Guia de Testes e Execução](#-guia-de-testes-e-execução)
- [Métricas e Monitoramento](#-métricas-e-monitoramento)
- [Segurança e Boas Práticas](#-segurança-e-boas-práticas)
- [Suporte e Comunidade](#-suporte-e-comunidade)
- [Licença](#-licença)

## 🌐 Visão Geral

O **TGS Launcher** é um launcher desktop desenvolvido em Node.js com Electron que funciona como o hub central de um ecossistema de aplicativos. O Launcher é responsável por instalar, organizar e executar os apps disponíveis.

Atualmente, existem dois aplicativos no ecossistema:
- **Pack Menager** — Sistema profissional de automação para criação e gerenciamento de packs de veículos para FiveM
- **Mod Menager** — Sistema completo de gerenciamento de mods para FiveM com autenticação segura

Ambos são **instalados pelo Launcher**: o hub descarrega os executáveis **portáteis** (`TGS-Pack-Manager-Portable.exe`, `TGS-Mod-Manager-Portable.exe`) das releases públicas no GitHub e coloca-os em `<installPath>\data\apps\...`. O fluxo recomendado é **abrir sempre pelo Launcher** (botão Executar), para usar a pasta configurada e o token de sessão; tecnicamente os `.exe` portáteis podem ser iniciados manualmente a partir do disco, mas deixam de estar alinhados com a pasta que o Launcher mostra na interface.

O Launcher centraliza instalação, pasta de dados e atualização do próprio hub (instalador NSIS + `electron-updater`).

---

## 🏗️ Arquitetura do Ecossistema

### Componentes Principais

```
┌─────────────────────────────────────────────────────────┐
│                    TGS Launcher                         │
│                    (Hub Central)                        │
│                                                         │
│  ┌─────────────────┐    ┌─────────────────┐             │
│  │   Pack Menager  │    │   Mod Menager   │             │
│  │   (App 1)       │    │   (App 2)       │             │
│  └─────────────────┘    └─────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Responsabilidades

| Componente | Função Principal |
|-------------|------------------|
| **Launcher** | Instalação, atualização, execução e gerenciamento centralizado |
| **Pack Menager** | Criação e gerenciamento de packs de veículos para FiveM |
| **Mod Menager** | Gerenciamento de mods com catálogo e autenticação |

### Comunicação

- **Launcher → Apps**: Controle de inicialização, configurações e atualizações
- **Apps → Launcher**: Status, logs e métricas de uso
- **Apps ↔ Launcher**: Troca de dados via APIs internas e eventos

---

## 🔄 Fluxos do Usuário

### Instalação de App

1. **Abrir Launcher** → Interface principal com apps disponíveis
2. **Selecionar App** → Pack Menager ou Mod Menager
3. **Verificação de Requisitos** → Sistema, espaço, dependências
4. **Download e Instalação** → Progresso com feedback visual
5. **Configuração Inicial** → Parâmetros básicos do app
6. **Conclusão** → App disponível para uso

### Execução de App

1. **Abrir Launcher** → Dashboard com apps instalados
2. **Selecionar App** → Pack Menager ou Mod Menager
3. **Verificação de Estado** → Updates disponíveis, integridade
4. **Inicialização** → App abre via interface do Launcher
5. **Monitoramento** → Logs e status em tempo real

### Atualização e Manutenção

1. **Verificação Automática** → Launcher busca updates periodicamente
2. **Notificação** → Usuário é informado sobre novas versões
3. **Download** → Processo em background com progresso
4. **Instalação** → Backup automático antes da atualização
5. **Validação** → Teste de integridade pós-atualização

---

## Sistema de Auto-Update (GitHub Releases)

O TGS Launcher implementa um sistema robusto de atualização automática utilizando `electron-updater` com publicação via **GitHub Releases**.

### Arquitetura do Auto-Update

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  TGS Launcher   │────▶│  GitHub Releases │◀────│  Repo Privado   │
│  (Cliente)      │     │  (Público)       │     │  (Código fonte) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

**Estratégia de repositórios separados:**
- **Repositório de código**: Privado — contém o código fonte do Launcher
- **Repositório de releases**: Público — hospeda apenas os instaladores `.exe` e metadados de update

Isso elimina a necessidade de tokens de autenticação no cliente, mantendo o código protegido.

**Pack Menager e Mod Menager** são distribuídos como **executáveis portáteis** (nomes fixos nas releases públicas). O Launcher descarrega-os para `<installPath>\data\apps\...` e pode abri-los a partir daí; cada app pode ainda ter **auto-update próprio** (`electron-updater`) contra o mesmo repositório público de releases.

### Funcionalidades Implementadas

| Recurso | Descrição | Status |
|---------|-----------|--------|
| Verificação automática | Checa por updates 5s após startup | ✅ Implementado |
| Download automático | Baixa update em background | ✅ Implementado |
| Progresso visual | Barra de progresso durante download | ✅ Implementado |
| Confirmação de instalação | Botão "Reiniciar e Atualizar" (UX controlada) | ✅ Implementado |
| Tratamento de erros | Notificação amigável em caso de falha | ✅ Implementado |
| Canal stable | Releases normais (padrão) | ✅ Implementado |
| Canal beta | Suporte a pre-releases com sufixo `-beta.x` | ✅ Suportado |
| Hub bloqueado se Launcher antigo | `assertLauncherUpToDate` — sem instalar/abrir apps | ✅ v2.0.5 |
| Apps obrigatoriamente atualizados | `check-app-update` + UI; `launch-app` recusa versão antiga | ✅ v2.0.4+ |
| Pack: ads antes do export | Config `T1NG4/TGS-ads`, proxy `/api/ads/config` | ✅ Pack v2.0.4+ |
| Pack: links externos no rodapé | `open-external-url` no Electron | ✅ Pack v2.0.5 |

### Versões publicadas (referência — maio 2026)

| Componente | Versão | Repo código (privado) | Repo releases (público) |
|------------|--------|------------------------|-------------------------|
| TGS Launcher | **2.0.5** | `T1NG4/tgs-launcher` (monorepo local) | `T1NG4/TGS-launcher-releases` |
| Pack Menager | **2.0.5** | `T1NG4/TGS-pack-manager` | `T1NG4/TGS-pack-manager-releases` |
| Mod Menager | (conforme `package.json`) | `T1NG4/TGS-mod-manager` | `T1NG4/TGS-mod-manager-releases` |

### Configuração do Build (`package.json`)

```json
{
  "build": {
    "win": {
      "target": ["nsis"],
      "publish": ["github"]
    },
    "publish": {
      "provider": "github",
      "owner": "SEU-ORG-AQUI",
      "repo": "tgs-launcher-releases",
      "releaseType": "release"
    }
  }
}
```

> ⚠️ **Importante**: Substitua `SEU-ORG-AQUI` pelo nome da sua organização/usuário GitHub.

### Workflow de Release (CI/CD)

O arquivo `.github/workflows/release.yml` automatiza o processo:

1. **Trigger**: Push de tags `v*.*.*` ou manual
2. **Build**: Compila o instalador Windows com `electron-builder`
3. **Publish**: Publica no GitHub Releases com todos os artefatos necessários:
   - `TGS Launcher Setup X.Y.Z.exe` — Instalador
   - `latest.yml` — Feed de versionamento
   - `*.blockmap` — Mapas para download delta

### Eventos IPC (Main ↔ Renderer)

**Main → Renderer:**
- `update-available` — Nova versão detectada
- `download-progress` — Progresso do download (%)
- `update-downloaded` — Update pronto para instalar
- `update-error` — Erro no processo de update

**Renderer → Main:**
- `check-updates` — Iniciar verificação manual
- `install-update` — Confirmar instalação (`quitAndInstall`)

### UI de Update

A interface exibe notificações em diferentes estados:
- **🔄 Disponível**: Nova versão detectada, inicia download automático
- **⬇️ Baixando**: Progresso com barra visual
- **✅ Pronto**: Botão "Reiniciar e Atualizar" — usuário controla quando reiniciar
- **❌ Erro**: Mensagem amigável com opção de fechar

---

## 📁 Convenções e Estrutura

### Estrutura de Diretórios (repositório)

```
TGS Launcher/
├── DOCUMENTACAO_*.md              # Documentação (Geral, Launcher, Pack, Mod, Hospedagem, …)
├── COMO_ADICIONAR_NOVAS_VERSOES.md
├── GITHUB_SETUP_COMPLETE_GUIDE.md
├── MainCode/
│   ├── Launcher/                  # Hub (Electron + React + Vite)
│   ├── Pack Menager/             # App 1 (portable + auto-update próprio)
│   └── Mod Menager/              # App 2 (idem)
├── Dependence/                   # Dependências partilhadas (quando usado no fluxo do projeto)
├── plan/                         # Notas de migração / planeamento
└── usuario/                      # Dados de exemplo ou I/O local
```

### Onde ficam os apps no PC do utilizador

Além do código em `MainCode/`, após instalar pelo hub existe uma **raiz escolhida** (`installPath`), por exemplo `C:\TGS` ou `%AppData%\TGS Launcher Apps`:

```
<installPath>/
└── data/
    └── apps/
        ├── packManager/     → TGS-Pack-Manager-Portable.exe, version.json, …
        └── modManager/      → TGS-Mod-Manager-Portable.exe, version.json, …
```

Em Windows **empacotado**, o valor por defeito da raiz pode ser a pasta **`TGSApps`** ao lado do executável do Launcher; em desenvolvimento costuma ser `%AppData%\TGS Launcher Apps`. Detalhes: [DOCUMENTACAO_LAUNCHER.md](DOCUMENTACAO_LAUNCHER.md).

### Nomenclatura Padrão

- **Launcher** — Sempre capitalizado, referência ao hub central
- **Pack Menager** — Nome completo do App 1
- **Mod Menager** — Nome completo do App 2
- **App** — Termo genérico para qualquer aplicativo do ecossistema
- **Ecossistema** — Conjunto completo Launcher + Apps

### Convenções de Código

- **Node.js 20+** — Versão mínima para todos os componentes
- **Electron** — Framework desktop para Launcher
- **React + TypeScript** — Frontend moderno para interfaces
- **Express** — Backend para APIs internas

### Dependências Unificadas

📍 **`Dependence/`** é o **único e exclusivo local** para todas as dependências do ecossistema:

- **Centralização** — Todas as dependências compartilhadas ficam aqui
- **Otimização** — Elimina duplicação e reduz uso de memória
- **Organização** — Mantém estrutura limpa e consistente
- **Acesso** — Todos os apps buscam dependências deste diretório

**Integração com Apps:**
- Launcher → `Dependence/` (dependências do hub)
- Pack Menager → `Dependence/` (dependências compartilhadas)
- Mod Menager → `Dependence/` (dependências compartilhadas)

---

## 🚀 Roadmap e Expansão

### Adicionando um "App 3"

Para expandir o ecossistema com um novo aplicativo:

1. **Definir Arquitetura** — Tecnologias e dependências
2. **Criar Manifest** — Metadados e configurações do app
3. **Implementar Integração** — APIs e eventos com Launcher
4. **Desenvolver Interface** — UI/UX consistente com ecossistema
5. **Testar Integração** — Fluxos completos de instalação/execução
6. **Documentar** — Criar `DOCUMENTACAO_APP3.md`

### Próximos Passos

- [ ] **Modularização** — Separação clara de responsabilidades
- [x] **Auto-update** — Sistema robusto de atualizações via GitHub Releases (implementado)
- [ ] **Marketplace** — Repositório central de apps
- [ ] **Multi-idioma** — Suporte PT/EN/ES
- [ ] **Cloud Sync** — Sincronização de configurações

---

## 🛠 Tecnologias Utilizadas

### Stack Principal

| Componente | Tecnologia | Versão | Uso |
|-------------|------------|--------|-----|
| **Runtime** | Node.js | 20.x | Backend e APIs |
| **Desktop** | Electron | varia por app (ex.: Launcher ~28, Pack ~39, Mod cliente ~24) | Aplicação desktop |
| **Frontend** | React | 19.x | Interfaces modernas |
| **TypeScript** | TypeScript | 5.x | Tipagem estática |
| **Build** | Vite | 7.x | Build tool e dev server |
| **Styling** | TailwindCSS | 4.x | CSS moderno |

### Tecnologias por App

#### Pack Menager
- **File Processing** — fs-extra, multer
- **XML Parsing** — xml2js
- **Validation** — Zod schemas
- **Templates** — Sistema de geração de packs

#### Mod Menager
- **Authentication** — JWT, bcrypt
- **Database** — JSON local (futuro: PostgreSQL)
- **Security** — Helmet, CORS, rate limiting

---

## 🛠️ Guia de Testes e Execução

Para testar o ecossistema completo em ambiente de desenvolvimento, siga a ordem abaixo:

### 1. Preparação (Dependências)
Antes de tudo, garanta que o repositório central de dependências esteja atualizado:
```bash
cd Dependence
npm install
```

### 2. Executar o Launcher (Hub)
O Launcher deve ser iniciado para gerenciar os demais apps:
```bash
cd MainCode/Launcher
npm run dev
```
*Porta Vite: 5175 | Electron: Ativo*

### 3. Executar o Pack Menager (App 1)
Inicia o servidor de processamento e a interface do gerenciador de packs:
```bash
cd "MainCode/Pack Menager"
npm run dev
```
*Porta Server: 3001 | Porta Vite: 5173 | Electron: Ativo*

### 4. Executar o Mod Menager (App 2)
Inicia o servidor de autenticação/catálogo e a interface do gerenciador de mods:
```bash
cd "MainCode/Mod Menager"
npm run dev
```
*Porta Server: 3002 | Electron: Ativo*

---

## 📊 Métricas e Monitoramento

### Indicadores do Ecossistema

- **Apps Instalados** — Contador de instalações únicas
- **Taxa de Uso** — Frequência de abertura por app
- **Performance** — Tempo de inicialização e resposta
- **Erros** — Taxa de falhas e recuperações

### Logs Centralizados

- **Launcher** — Ficheiros em `%APPDATA%\TGS Launcher\logs\` (Windows; pasta `userData` do Electron)
- **Apps** — Logs específicos de cada aplicação (consola / ficheiros locais ao app)
- **Integração** — Eventos entre hub e portáveis (ver [DOCUMENTACAO_LAUNCHER.md](DOCUMENTACAO_LAUNCHER.md))

---

## 🔐 Segurança e Boas Práticas

### Medidas Implementadas

- **Autenticação** — JWT com expiração e refresh
- **Validação** — Entrada sanitizada e tipos verificados
- **Isolamento** — Processos separados por app
- **Updates** — Verificação de integridade e assinatura

### Recomendações

- **Manter Launcher atualizado** — Primeira linha de defesa
- **Backup regular** — Configurações e dados importantes
- **Monitorar logs** — Identificar problemas rapidamente

---

## 📞 Suporte e Comunidade

### Canais de Suporte

- **Documentação** — Ficheiros `DOCUMENTACAO_*.md`, `COMO_ADICIONAR_NOVAS_VERSOES.md`, `GITHUB_SETUP_COMPLETE_GUIDE.md` e [DOCUMENTACAO_LAUNCHER.md](DOCUMENTACAO_LAUNCHER.md)
- **Issues** — GitHub para bugs e features
- **Comunidade** — Discord TGS para suporte rápido
- **Email** — Contato direto com equipe TGS

### Contribuição

Contribuições são bem-vindas:

1. **Fork** o repositório
2. **Branch** — `git checkout -b feature/nova-funcionalidade`
3. **Commit** — `git commit -m 'Add nova funcionalidade'`
4. **Push** — `git push origin feature/nova-funcionalidade`
5. **PR** — Pull request com descrição detalhada

---

## 📄 Licença

MIT License — Consulte arquivo `LICENSE` para detalhes completos.

---

<p align="center">
  <strong>Ecossistema TGS Launcher — Desenvolvido com ❤️ pela TGS Team</strong>
</p>
