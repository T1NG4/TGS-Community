# TGS Launcher

Launcher desktop para o ecossistema de aplicações TGS (FiveM): instalação, pasta de dados configurável e execução dos **Pack Menager** e **Mod Menager** a partir de releases no GitHub.

## Visão geral

O **TGS Launcher** (Electron + React + Vite) é o hub que:

- descarrega os portables oficiais (`TGS-Pack-Manager-Portable.exe`, `TGS-Mod-Manager-Portable.exe`) para `<installPath>\data\apps\...`;
- grava a **pasta de instalação** (`installPath`) em `%APPDATA%\TGS Launcher\config.json` (ajustável na UI: **Alterar pasta**);
- verifica e instala **atualizações do próprio Launcher** via `electron-updater` e GitHub Releases.

Versão atual do hub: ver `MainCode/Launcher/package.json` (referência: **2.0.5**). Pack Menager: **2.0.5** (`MainCode/Pack Menager/package.json`).

## Funcionalidades

- Instalação guiada dos apps com progresso e log
- Auto-update do Launcher (build de produção)
- **Hub bloqueado** se o Launcher estiver desatualizado (instalar/abrir apps só após atualizar o hub)
- **Atualização obrigatória dos apps** antes de executar (comparação com GitHub Releases + botão Atualizar no hub)
- Temas claro / escuro
- Escolha da raiz de instalação (ex.: `C:\TGS` vs pasta por defeito)
- Integração com repositórios públicos de releases (URLs em `MainCode/Launcher/src/main/constants.js`)

## Arquitetura

```
TGS Launcher (hub)
├── Pack Menager (portable + updates)
└── Mod Menager (portable + updates)
```

## Estrutura do repositório

```
├── docs/                      # Documentação por componente
├── MainCode/
│   ├── Launcher/              # Hub Electron
│   ├── Pack Menager/
│   └── Mod Menager/
├── Dependence/                # Dependências partilhadas (fluxo do monorepo)
├── plan/
└── usuario/
```

## Tecnologias (hub)

- React, TypeScript, Tailwind CSS, Vite
- Electron, electron-builder, electron-updater
- GitHub Actions para releases

## Pré-requisitos

- Node.js 20+
- npm
- Windows 10/11 (principal)

## Desenvolvimento

```bash
cd MainCode/Launcher
npm install
npm run dev
```

## Build de produção (hub)

```bash
cd MainCode/Launcher
npm run build
```

Gera o instalador NSIS na pasta `release/` (conforme `electron-builder`).

## Auto-update e releases

1. Configurar `owner` / `repo` de publicação no `package.json` do Launcher.
2. Criar tag `vX.Y.Z` e fazer push (ou workflow manual).
3. O CI publica no repositório **público** de releases (`latest.yml`, `.exe`, etc.).

Guias:

- [MainCode/Launcher/AUTO_UPDATE_SETUP.md](MainCode/Launcher/AUTO_UPDATE_SETUP.md) — passos rápidos
- [docs/GITHUB_SETUP_COMPLETE_GUIDE.md](docs/GITHUB_SETUP_COMPLETE_GUIDE.md) — PAT `RELEASES_REPO_TOKEN`, seis repositórios, portables
- [docs/COMO_ADICIONAR_NOVAS_VERSOES.md](docs/COMO_ADICIONAR_NOVAS_VERSOES.md) — versionamento e tags

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [docs/DOCUMENTACAO_GERAL.md](docs/DOCUMENTACAO_GERAL.md) | Ecossistema, fluxos, auto-update, estrutura |
| [docs/DOCUMENTACAO_LAUNCHER.md](docs/DOCUMENTACAO_LAUNCHER.md) | Hub: pastas, IPC, instalação, troubleshooting |
| [docs/DOCUMENTACAO_PACK_MENAGER.md](docs/DOCUMENTACAO_PACK_MENAGER.md) | Pack Menager |
| [docs/DOCUMENTACAO_MOD_MENAGER.md](docs/DOCUMENTACAO_MOD_MENAGER.md) | Mod Menager |
| [docs/DOCUMENTACAO_HOSPEDAGEM.md](docs/DOCUMENTACAO_HOSPEDAGEM.md) | Deploy / custo zero |
| [docs/DOCUMENTACAO_ANALYTICS.md](docs/DOCUMENTACAO_ANALYTICS.md) | Google Analytics 4 (Launcher + apps) |
| [docs/CHECKLIST_RELEASE.md](docs/CHECKLIST_RELEASE.md) | Checklist pós-release |
| [docs/FLUXO_RELEASE_E_GA4.md](docs/FLUXO_RELEASE_E_GA4.md) | Release + GA4 |

## Contribuição

1. Fork ou branch a partir da política da equipa  
2. `git checkout -b feature/descricao-curta`  
3. Commits com mensagens claras  
4. Pull request com contexto e testes feitos  

## Licença

MIT — conforme `license` nos `package.json` dos projetos em `MainCode/`.

---

**TGS Studio** — Ferramentas para FiveM
