# Spec — Padronizar ícones dos executáveis

**Status:** concluído (release v2.0.24)  
**Projeto:** Launcher | Pack | Mod  
**Data:** 2026-05-28  
**Última atualização:** 2026-05-28

## Contexto

O ecossistema TGS usa três apps Electron (Launcher, Pack Menager, Mod Menager). Cada um precisa de `.ico` no **build** (ícone do `.exe` no Explorer) e, opcionalmente, `.png` no **runtime** (barra de tarefas / `BrowserWindow`).

## Estado atual (por app)

### Launcher (Hub)

| Uso | Path | Status |
|-----|------|--------|
| Build (NSIS / `.exe`) | `resources/icons/icon.ico` | OK |
| Runtime (`BrowserWindow`) | `resources/icons/icon.png` | OK |
| Config | `package.json` → `win.icon`, `nsis.*Icon` | OK |
| Código | `src/main/main.js` linha `icon:` | OK |

### Pack Menager

| Uso | Path | Status |
|-----|------|--------|
| Build (portable `.exe`) | `build/TGS_logo.ico` | OK |
| buildResources | `directories.buildResources = "build"` | OK |
| Config | `package.json` → `win.icon: build/TGS_logo.ico` | OK |
| Runtime | `src/electron/icons/icon.ico` + `icon` no `BrowserWindow` | OK |
| Git | pasta `build/` versionada (exceção no `.gitignore` raiz) | OK |

### Mod Menager

| Uso | Path | Status |
|-----|------|--------|
| Build (portable `.exe`, só Windows) | `midias/TGS/TGS_logo.ico` | OK |
| Config | `package.json` → `win.icon`; sem `mac`/`linux` | OK |
| Runtime | não configurado | Opcional |

## Objetivo

- Ícone TGS correto em todos os `.exe` Windows.
- Nenhuma referência a ficheiros inexistentes.
- Paths documentados e repetíveis no monorepo.

## Escopo

### Inclui

- Assets `.ico` (e `.png` onde já usado) versionados no Git.
- `electron-builder` apontando para paths reais.
- Mod Menager: **apenas Windows** (removidos targets macOS/Linux).

### Não inclui

- Redesign de branding.
- Assinatura de código.
- Ícone na taskbar do Pack/Mod (runtime) — só se pedido depois.

## Padrão por app

```
Launcher:  resources/icons/icon.{ico,png}
Pack:      build/TGS_logo.{ico,png}     + win.icon explícito
Mod:       midias/TGS/TGS_logo.ico      + package só --win
```

**Runtime** = ícone enquanto a app corre (`icon` no `BrowserWindow`). Só o Launcher usa hoje.

## Critérios de aceite

- [x] Launcher: `icon.ico` + `icon.png` existem e estão referenciados.
- [x] Pack: `build/TGS_logo.ico` existe e `win.icon` configurado.
- [x] Mod: `TGS_logo.ico` existe; build só Windows.
- [x] Nenhum `package.json` referencia `assets/icon.icns` ou `assets/icon.png` (Mod).
- [x] Build local: Pack e Mod validados; Launcher no CI v2.0.24.
- [ ] (Opcional) Pack/Mod com `icon` no `BrowserWindow` para taskbar.

## Plano — feito vs pendente

### Feito

1. Launcher: `icon.png` + `icon.ico` em `resources/icons/`.
2. Pack: pasta `build/` com `TGS_logo.ico` / `TGS_logo.png`; `win.icon` no `package.json`.
3. Pack: `.gitignore` local e raiz do monorepo permitem versionar `Pack Menager/build/`.
4. Mod: removidos `package:mac`, `package:linux` e blocos `mac`/`linux` do `build`.

### Pendente

1. Nova release (ex. v2.0.25) após fix do ícone runtime do Pack.
2. Checklist pós-release: `TGS Launcher/docs/CHECKLIST_RELEASE.md`.

## Arquivos envolvidos

- `TGS Launcher/MainCode/Launcher/package.json`
- `TGS Launcher/MainCode/Launcher/src/main/main.js`
- `TGS Launcher/MainCode/Launcher/resources/icons/`
- `TGS Launcher/MainCode/Pack Menager/package.json`
- `TGS Launcher/MainCode/Pack Menager/build/`
- `TGS Launcher/MainCode/Pack Menager/.gitignore`
- `TGS Launcher/MainCode/Mod Menager/client/package.json`
- `.gitignore` (raiz — exceção `Pack Menager/build/`)
