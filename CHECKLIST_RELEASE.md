# Checklist de validação pós-release (TGS)

Usar este checklist sempre que publicar uma tag `vX.Y.Z` no monorepo.

## 1) CI / GitHub Actions

- [ ] Confirmar 3 workflows verdes (ou “vermelho só por artifact quota”, se aplicável):
  - [ ] Launcher (`release.yml`)
  - [ ] Pack (`release-pack.yml`)
  - [ ] Mod (`release-mod.yml`)

## 2) Releases (páginas públicas)

- [ ] Launcher: [TGS-launcher-releases](https://github.com/T1NG4/TGS-launcher-releases/releases)
  - [ ] `Latest` mostra `vX.Y.Z`
  - [ ] Assets incluem instalador do Launcher
- [ ] Pack: [TGS-pack-manager-releases](https://github.com/T1NG4/TGS-pack-manager-releases/releases)
  - [ ] `Latest` mostra `vX.Y.Z`
  - [ ] Assets incluem `TGS-Pack-Manager-Portable.exe`
  - [ ] Assets incluem `latest.yml`
- [ ] Mod: [TGS-mod-manager-releases](https://github.com/T1NG4/TGS-mod-manager-releases/releases)
  - [ ] `Latest` mostra `vX.Y.Z`
  - [ ] Assets incluem `TGS-Mod-Manager-Portable.exe`

## 3) Fluxo de instalação (utilizador final)

- [ ] Instalar/atualizar o Launcher pela release `Latest`
- [ ] Abrir Launcher → verificar que a pasta padrão de apps é `%APPDATA%\\TGS Launcher\\Apps`
- [ ] Instalar Pack e Mod pelo Launcher
- [ ] Confirmar que foi criado `version.json` em:
  - [ ] `%APPDATA%\\TGS Launcher\\Apps\\data\\apps\\packManager\\version.json`
  - [ ] `%APPDATA%\\TGS Launcher\\Apps\\data\\apps\\modManager\\version.json`

## 4) Bloqueio de standalone (segurança)

- [ ] Tentar abrir Pack/Mod direto pelo `.exe` → deve bloquear sem token
- [ ] Abrir pelo Launcher → deve abrir normalmente

## 5) GA4 (DebugView)

- [ ] No GA4 → **Admin → DebugView**
- [ ] Launcher:
  - [ ] `tgs_screen_view` / `page_view`
  - [ ] `tgs_hub_app_install_start` / `complete` (ao instalar)
  - [ ] `tgs_hub_app_open` (ao clicar Executar)
- [ ] Pack:
  - [ ] Abrir DevTools: **F12** (ou Ctrl+Shift+I)
  - [ ] Console: `tgsGaPing()` → aparece em DebugView
  - [ ] Export: `tgs_pack_export_start` / `complete`
- [ ] Mod:
  - [ ] Login: `tgs_mod_login_success`
  - [ ] Dashboard: `tgs_mod_dashboard_open`

