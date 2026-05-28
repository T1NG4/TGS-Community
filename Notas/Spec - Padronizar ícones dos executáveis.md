	# Spec — Padronizar ícones dos executáveis

**Status:** rascunho  
**Projeto:** Launcher | Pack | Mod  
**Data:** 2026-05-28

## Contexto

Hoje o ecossistema usa ícones de formas diferentes e existem referências para arquivos que **não estão no repo**, causando `.exe`/app abrir com ícone padrão ou gerar confusão no build.

Achados (estado atual):

- **Launcher (Hub)**:
  - Build (electron-builder) usa `.ico` em `resources/icons/icon.ico` (existe).
  - Runtime (BrowserWindow) referencia `resources/icons/icon.png` (não existe).
    - Arquivo: `TGS Launcher/MainCode/Launcher/src/main/main.js`
    - Path esperado: `TGS Launcher/MainCode/Launcher/resources/icons/icon.png`
- **Pack Menager**:
  - `package.json` define `build.directories.buildResources = "build"`, mas a pasta `build/` não existe no projeto.
    - Arquivo: `TGS Launcher/MainCode/Pack Menager/package.json`
- **Mod Menager**:
  - `package.json` aponta para `midias/TGS/TGS_logo.ico` e o arquivo existe.

## Objetivo

Padronizar e garantir que **todos os executáveis** (Launcher/Pack/Mod):

- tenham ícone correto no build (`.ico`)
- tenham ícone correto em runtime onde aplicável (`.png` opcional, mas consistente)
- não referenciem arquivos inexistentes
- tenham paths claros e repetíveis no monorepo

## Escopo

### Inclui

- Definir um **ícone oficial** (fonte) e gerar derivados:
  - `icon.ico` (Windows)
  - `icon.png` (runtime/UI)
- Corrigir referências de paths no Launcher.
- Corrigir/introduzir `buildResources` do Pack Menager (criar pasta ou ajustar config).
- Checar Mod Menager para garantir padrão (mesmo que já funcione).

### Não inclui

- Redesign completo de branding/identidade visual.
- Assinatura de executáveis.

## Decisões / padrões propostos

- **Fonte única**: usar um ícone “master” versionado (ex.: `TGS_logo.svg` ou PNG grande).
- **Derivados versionados** (evita depender de geração manual):
  - Launcher: manter `resources/icons/icon.ico` e adicionar `resources/icons/icon.png`
  - Pack: criar `build/icon.ico` (ou equivalente) e apontar `win.icon` (se necessário)
  - Mod: manter `midias/TGS/TGS_logo.ico` (ou mover para padrão equivalente, se fizer sentido)

## Critérios de aceite

- [ ] `TGS Launcher/MainCode/Launcher/resources/icons/icon.png` existe e o Launcher usa esse arquivo sem erro.
- [ ] Pack Menager tem `buildResources` válido (pasta existente) **ou** config ajustada para um path existente.
- [ ] Em builds Windows (portable/NSIS), o `.exe` mostra o ícone correto no Explorer.
- [ ] Nenhum `package.json`/código referencia `.ico/.png` inexistente.

## Plano de implementação (rascunho)

1) Escolher/confirmar “ícone master” (arquivo fonte) a ser usado como base.  
2) Gerar/exportar:
   - `icon.ico` (multi-size: 16/32/48/256)
   - `icon.png` (256x256 ou 512x512)
3) Aplicar no Launcher:
   - adicionar `resources/icons/icon.png`
   - manter `.ico` no build
4) Aplicar no Pack:
   - criar pasta `build/` com ícone e recursos necessários
   - atualizar `package.json` do Pack se precisar de `win.icon`/`mac.icon`
5) Validar localmente (build rápido) e validar no CI (tag/release quando fizer sentido).

## Arquivos envolvidos (referência)

- `TGS Launcher/MainCode/Launcher/src/main/main.js`
- `TGS Launcher/MainCode/Launcher/resources/icons/icon.ico`
- `TGS Launcher/MainCode/Pack Menager/package.json`
- `TGS Launcher/MainCode/Mod Menager/client/package.json`

