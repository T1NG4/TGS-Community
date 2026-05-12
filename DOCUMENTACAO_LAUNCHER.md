# Documentação — TGS Launcher

Hub desktop (Electron) para instalar, atualizar e executar **Pack Menager** e **Mod Menager** a partir de releases públicas no GitHub.

**Versão de referência** (hub): ver `MainCode/Launcher/package.json` (ex.: `2.0.3`).

---

## Índice

- [Funções do hub](#funções-do-hub)
- [Pastas e ficheiros importantes](#pastas-e-ficheiros-importantes)
- [Estrutura após instalar um app](#estrutura-após-instalar-um-app)
- [Stack e estrutura do código](#stack-e-estrutura-do-código)
- [IPC (Renderer ↔ Main)](#ipc-renderer--main)
- [Auto-update do próprio Launcher](#auto-update-do-próprio-launcher)
- [Instalação dos apps (download)](#instalação-dos-apps-download)
- [Execução dos portables](#execução-dos-portables)
- [Interface (renderer)](#interface-renderer)
- [Logs e resolução de problemas](#logs-e-resolução-de-problemas)

---

## Funções do hub

- **Instalar** Pack Menager e Mod Menager: download do `.exe` portable a partir do URL configurado em `src/main/constants.js` (`DOWNLOAD_URLS`), escrita em `data/apps/<tipo>/`.
- **Gravar `installPath`**: pasta raiz onde existe `data\apps\...`. Persistido em `config.json` no *userData* do Electron e alterável na UI (**Alterar pasta**).
- **Executar** o portable correto com o caminho resolvido a partir dessa raiz (evita abrir um `.exe` noutro disco quando instalaste noutro sítio).
- **Verificar atualizações** do Launcher (`electron-updater`) e, em fluxos dedicados, consultar estado/updates dos apps instalados.
- **Janela**: redimensionar, minimizar, maximizar, fechar (handlers IPC).

---

## Pastas e ficheiros importantes

| O quê | Onde |
|--------|------|
| Configuração do hub (`installPath`, opções) | `%APPDATA%\TGS Launcher\config.json` (Windows; em geral `app.getPath('userData')` do produto **TGS Launcher**) |
| Logs do hub | `%APPDATA%\TGS Launcher\logs\` (`combined.log`, `error.log`) |
| **Raiz por defeito dos apps** (sem config ou primeira execução) | **Windows empacotado:** pasta `TGSApps` ao lado do `.exe` do Launcher (`path.dirname(exe)\TGSApps`). **Desenvolvimento / não empacotado:** `%APPDATA%\TGS Launcher Apps` |

O valor mostrado em **«Instalação: …»** no rodapé corresponde ao `installPath` guardado (ou ao default acima). Deve ser a pasta que **contém** `data\apps\...`, por exemplo `C:\TGS` ou `D:\Jogos\TGSApps`.

---

## Estrutura após instalar um app

```
<installPath>/
└── data/
    └── apps/
        ├── packManager/
        │   ├── TGS-Pack-Manager-Portable.exe
        │   ├── version.json
        │   └── (outros ficheiros do app, se existirem)
        └── modManager/
            ├── TGS-Mod-Manager-Portable.exe
            ├── version.json
            └── ...
```

Os URLs e nomes dos ficheiros vêm de `MainCode/Launcher/src/main/constants.js` (`DOWNLOAD_URLS`, `RELEASES_REPOS`).

---

## Stack e estrutura do código

| Peça | Tecnologia |
|------|------------|
| UI | React 19 + TypeScript + Tailwind 4 |
| Build da UI | Vite 7 + `vite-plugin-singlefile` (HTML único em `dist-renderer/`) |
| Processo principal | Node (Electron); ficheiros em `src/main/` |
| Updates do Launcher | `electron-updater` |
| HTTP | `axios` (downloads no installer) |

```
MainCode/Launcher/
├── package.json
├── vite.config.ts
├── src/
│   ├── App.tsx              # UI principal (modos, instalação, log, pasta, updates)
│   ├── main.tsx
│   └── main/
│       ├── main.js          # Janela, IPC, autoUpdater, launch-app
│       ├── installer.js     # checkSystem, download (pipeline), startInstallation
│       ├── config.js        # load/save config.json, defaultAppsInstallRoot()
│       ├── constants.js     # URLs GitHub, repos, limites
│       ├── logger.js        # Winston → userData/logs
│       └── (outros auxiliares conforme o repo)
├── dist-renderer/           # Saída do Vite (empacotada no build)
└── release/                 # Saída do electron-builder (local)
```

**Nota:** as versões de **Electron** diferem entre Launcher (~28), Pack Menager (~39) e Mod Menager (cliente ~24); não assumas um único número para todo o monorepo.

---

## IPC (Renderer ↔ Main)

| Canal | Direção | Descrição |
|--------|---------|-----------|
| `get-app-info` | invoke | `{ version, name, platform, arch }` |
| `get-default-install-path` | invoke | `installPath` normalizado a partir da config |
| `load-config` / `save-config` | invoke | Lê/grava objeto de configuração |
| `pick-install-folder` | invoke | Diálogo nativo; devolve pasta ou `null` |
| `check-system` | invoke | Pré-checagens antes de instalar |
| `start-installation` | invoke | `{ installPath, appType, ... }` + progresso via `installation-progress` |
| `cancel-installation` | invoke | Cancela fluxo de instalação |
| `launch-app` | invoke | `(appType, baseInstallPath opcional)` — resolve raiz e arranca o portable |
| `check-app-update` | invoke | Verificação de update por app (usa mesma raiz) |
| `get-installed-apps` | invoke | Lista apps presentes sob `data/apps` |
| `check-updates` / `install-update` | invoke | Auto-update do **Launcher** |
| `get-logs` / `clear-cache` | invoke | Diagnóstico / cache |
| `window-resize`, `window-minimize`, `window-close`, `window-maximize` | invoke | Controlo da janela |

**Main → Renderer (eventos):** `update-available`, `update-not-available`, `download-progress`, `update-downloaded`, `update-error`, `installation-progress`.

---

## Auto-update do próprio Launcher

- Configuração de publicação: `package.json` → `build.publish` (GitHub, repo de releases).
- Guia passo a passo: [MainCode/Launcher/AUTO_UPDATE_SETUP.md](MainCode/Launcher/AUTO_UPDATE_SETUP.md).
- Ecossistema completo (PAT, repos, portables): [GITHUB_SETUP_COMPLETE_GUIDE.md](GITHUB_SETUP_COMPLETE_GUIDE.md).

---

## Instalação dos apps (download)

1. O renderer chama `start-installation` com `installPath` e o tipo de app.
2. `installer.js` valida sistema, cria diretórios, faz download por `axios` + **`stream.promises.pipeline`** para o destino final (fecha o ficheiro antes de continuar).
3. É escrito `version.json` na pasta do app.
4. Após sucesso, a UI pode gravar de novo o `installPath` em `save-config` para manter consistência.

---

## Execução dos portables

- O caminho do `.exe` é construído a partir de `installPath` (ou o que vier na config se o renderer não passar base).
- No **Windows**, o arranque pode usar `cmd /c start` para reduzir erros do tipo **EBUSY** (ficheiro bloqueado) ao abrir logo após operações de ficheiro.
- Se o utilizador instalou em `C:\TGS` mas a config ainda apontava para `%APPDATA%\...`, o Launcher tentava o `.exe` no sítio errado — daí a importância de **Alterar pasta** / gravar config após instalar.

---

## Interface (renderer)

- Dois modos visuais (dark/light), passos de instalação com progresso, log opcional.
- Rodapé: caminho de instalação truncado + **Alterar pasta** (desativado durante instalação).
- Fluxo de update do Launcher: mensagens no log e ação para reiniciar após download.

---

## Logs e resolução de problemas

| Problema | O que verificar |
|----------|------------------|
| **EBUSY** ao executar | Instância do app já aberta; aguardar fecho do download; confirmar **pasta de instalação** = raiz onde está `data\apps\...`. |
| App “não encontrado” após instalar noutro disco | **Alterar pasta** para essa raiz e voltar a **Executar**. |
| Auto-update do Launcher não corre | Build de produção instalado; `owner`/`repo` corretos; release pública com `latest.yml`. |
| Dev | `npm run dev` — `concurrently` arranca Electron + Vite (porta do Vite conforme `vite.config.ts`). |

---

## Documentação relacionada

- [Documentação geral](DOCUMENTACAO_GERAL.md)
- [Pack Menager](DOCUMENTACAO_PACK_MENAGER.md)
- [Mod Menager](DOCUMENTACAO_MOD_MENAGER.md)
- [Como publicar versões](COMO_ADICIONAR_NOVAS_VERSOES.md)
- [Setup GitHub e PAT](GITHUB_SETUP_COMPLETE_GUIDE.md)
