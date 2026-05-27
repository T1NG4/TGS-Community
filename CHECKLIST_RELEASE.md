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

## 5) GA4 — três fluxos + DebugView

- [ ] Admin GA4: 3 fluxos Web (Launcher / Pack / Mod) com IDs em secrets `GA_MEASUREMENT_ID_*`
- [ ] `node scripts/validate-ga-events.mjs` (local, opcional)
- [ ] DebugView no fluxo **correto** para cada app testado
- [ ] Launcher:
  - [ ] `tgs_launcher_session_start`
  - [ ] `tgs_screen_view` / `page_view`
  - [ ] `tgs_hub_app_install_start` / `complete` (instalar)
  - [ ] `tgs_hub_app_open` (Executar)
- [ ] Pack (F12 → console):
  - [ ] `tgsGaPing()` → `tgs_ga_ping`
  - [ ] `tgs_pack_open`, `tgs_pack_tab_view`
  - [ ] Export: `tgs_pack_export_start` / `complete`
  - [ ] Ads (se ativos): `tgs_pack_ad_impression` / `complete`
- [ ] Mod:
  - [ ] `tgs_mod_open`, `tgs_mod_screen_view`
  - [ ] `tgs_mod_login_success` / `tgs_mod_dashboard_open`
  - [ ] Toggle mod: `tgs_mod_mod_toggle`

