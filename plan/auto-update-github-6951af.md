# Auto-update robusto via GitHub Releases (TGS Launcher)

> **Estado (2026):** o Launcher usa `electron-updater` + releases públicas conforme descrito; guias actualizados: [MainCode/Launcher/AUTO_UPDATE_SETUP.md](../MainCode/Launcher/AUTO_UPDATE_SETUP.md) e [GITHUB_SETUP_COMPLETE_GUIDE.md](../GITHUB_SETUP_COMPLETE_GUIDE.md).

Este plano implementa um fluxo de auto-update confiável no Windows usando `electron-updater` + `electron-builder` (NSIS), publicando releases em um repositório GitHub **público separado**.

## Decisões/inputs confirmados

- **Plataforma**: Windows, instalador `.exe` (NSIS).
- **Tecnologia**: Electron (`MainCode/Launcher`) já usa `electron-updater` e já tem IPC (`check-updates`, `install-update`) + eventos (`update-available`, `download-progress`, etc.).
- **GitHub**: repositório de código pode permanecer privado; **releases** serão hospedados em um **repo público separado** para não exigir token no cliente.

## Plano (milestones)

1) **Padronizar a configuração de publicação do updater (repo público de releases)**

- Ajustar o `build` do `electron-builder` em `MainCode/Launcher/package.json` para incluir `publish` do provider `github` apontando para o repo público de releases (owner/repo).
- Definir a estratégia de canal:
  - `latest` (stable) como padrão.
  - Opcional: `beta`/`alpha` usando `prerelease` e/ou sufixo de versão (ex.: `1.2.0-beta.1`).
- Garantir que o artefato publicado inclua:
  - instalador `*.exe`
  - `latest.yml`
  - `*.blockmap` (necessário para delta/robustez no NSIS)

2) **Garantir a robustez do fluxo no app (main process + renderer)**

- No `src/main/main.js`:
  - Configurar comportamento de update para produção (ex.: desabilitar auto-update em dev).
  - Validar que `autoUpdater.checkForUpdates()` usa o feed correto do GitHub provider.
- No renderer (UI):
  - Criar/ajustar uma tela/estado de update (verificar, baixar, pronto para reiniciar).
  - Consumir os eventos já enviados via `webContents.send` (`update-available`, `download-progress`, `update-downloaded`, `update-error`).

3) **Pipeline de release (publicação automática e repetível)**

- Criar um workflow GitHub Actions (no repo do Launcher ou no repo de releases, conforme preferir) para:
  - buildar o app Windows
  - criar uma Release (tag `vX.Y.Z`)
  - anexar os assets gerados (`exe`, `latest.yml`, `blockmap`).
- Definir como a versão é incrementada (manual no `package.json` vs. semver automático).

4) **Hardening / detalhes de produção (opcional, mas recomendado)**

- Assinatura de código (Windows): documentar como integrar certificado para reduzir alertas do SmartScreen.
- Política de rollback/erro:
  - UX clara quando falhar (ex.: permitir abrir changelog/baixar manualmente).
  - Logs via `src/main/logger` para diagnóstico.

## Perguntas finais (pra eu fechar o plano em código)

- Qual será o **owner/repo** do repositório público de releases (ex.: `TGS-Org/tgs-launcher-releases`)?
- Você quer **stable apenas** ou também canal **beta**?
- Quando um update estiver pronto, você prefere:
  - instalar automaticamente ao fechar, ou
  - sempre pedir confirmação (botão “Reiniciar e atualizar”)?

## Arquivos já identificados como relevantes

- `MainCode/Launcher/package.json` (já usa `electron-builder` + target `nsis` e depende de `electron-updater`)
- `MainCode/Launcher/src/main/main.js` (eventos do updater + IPC `check-updates` / `install-update`)
