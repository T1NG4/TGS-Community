# Google Analytics 4 — Ecossistema TGS

Integração **GA4** (gtag.js) no **TGS Launcher**, **Pack Menager** e **Mod Menager**. Eventos com prefixo **`tgs_`**, fila de envio até o `gtag.js` carregar, e código partilhado em [`MainCode/shared/analytics/`](../MainCode/shared/analytics/).

---

## 1. Propriedade e três fluxos de dados (recomendado)

1. [Google Analytics](https://analytics.google.com/) → Admin → **Fluxos de dados** → criar **3 fluxos Web** na mesma propriedade:
   - `TGS Launcher Desktop`
   - `TGS Pack Manager Desktop`
   - `TGS Mod Manager Desktop`
2. Copiar cada **Measurement ID** (`G-XXXXXXXXXX`).

### Secrets no GitHub (monorepo)

| Secret | App |
|--------|-----|
| `GA_MEASUREMENT_ID_LAUNCHER` | Launcher (`release.yml`) |
| `GA_MEASUREMENT_ID_PACK` | Pack (`release-pack.yml`) |
| `GA_MEASUREMENT_ID_MOD` | Mod (`release-mod.yml`) |

Se o secret estiver vazio, o CI usa o fallback `G-DF8MNV3V66`.

### Configuração local

| App | Ficheiro |
|-----|----------|
| Launcher | `MainCode/Launcher/.env` → `VITE_GA_MEASUREMENT_ID` |
| Pack | `MainCode/Pack Menager/src/client/.env` → `VITE_GA_MEASUREMENT_ID` |
| Mod | `MainCode/Mod Menager/client/analytics-config.js` |

---

## 2. Arquitetura no código

| Camada | Caminho |
|--------|---------|
| Schema (nomes + tipos) | [`MainCode/shared/analytics/tgsSchema.ts`](../MainCode/shared/analytics/tgsSchema.ts) |
| Core (fila, init, gtag) | [`MainCode/shared/analytics/ga4Core.ts`](../MainCode/shared/analytics/ga4Core.ts) |
| Launcher | `src/analytics/ga4.ts` + `tgsEvents.ts` |
| Pack | `src/client/src/analytics/ga4.ts` + `tgsEvents.ts` |
| Mod | `client/analytics.js` + `tgsEvents.js` (espelho do core) |

Validar catálogo: `node scripts/validate-ga-events.mjs`

---

## 3. Parâmetros padrão

| Parâmetro | Uso |
|-----------|-----|
| `tgs_product` | `tgs_launcher`, `tgs_pack_manager`, `tgs_mod_manager` |
| `tgs_category` | `lifecycle`, `navigation`, `export`, `auth`, `ads`, `engagement`, `error` |
| `tgs_action` | Ação semântica (`install_start`, `export_complete`, …) |
| `tgs_target_app` | Hub: `pack`, `mod`, `code` (normalizado) |
| `app_version` | Versão do `.exe` |
| `error_message` | Falhas (máx. 120 caracteres) |
| `duration_ms` | Instalação / export |

Também: `page_view` (GA4) e `login` (Mod, após `tgs_mod_login_success`).

---

## 4. Catálogo de eventos

### Infraestrutura

| Evento | Quando |
|--------|--------|
| `tgs_screen_view` | Navegação (`trackScreen`) |
| `page_view` | Enviado com cada `trackScreen` |
| `tgs_ga_ping` | Debug manual (`tgsGaPing()` no Pack) |

### Launcher

| Evento | Quando |
|--------|--------|
| `tgs_launcher_session_start` | GA4 inicializado |
| `tgs_screen_view` | Troca Pack / Mod / Code / home |
| `tgs_hub_app_install_start` / `complete` / `failed` | Instalação pelo hub |
| `tgs_hub_install_cancelled` | Cancelar instalação |
| `tgs_hub_app_update_start` / `complete` / `failed` | Atualização de app |
| `tgs_hub_app_open` | Executar Pack/Mod |
| `tgs_hub_app_launch_failed` | Erro ao executar |
| `tgs_launcher_self_update_start` / `complete` / `failed` | Auto-update do Launcher |

### Pack Manager

| Evento | Quando |
|--------|--------|
| `tgs_pack_open` | Sessão iniciada |
| `tgs_pack_tab_view` | Menu lateral (`tab_name`) |
| `tgs_pack_export_start` / `complete` / `failed` | Export |
| `tgs_pack_export_cancelled` | Cancelar no gate de anúncio |
| `tgs_pack_ad_impression` / `complete` / `error` / `skipped` | Gate de anúncio (+ POST legado em `analyticsUrl`) |

### Mod Manager

| Evento | Quando |
|--------|--------|
| `tgs_mod_open` | App carregado |
| `tgs_mod_screen_view` | Página HTML (`login`, `dashboard`, …) |
| `tgs_mod_login_success` / `failed` | Login |
| `tgs_mod_logout` | Logout |
| `tgs_mod_dashboard_open` | Dashboard |
| `tgs_mod_mod_toggle` | Ativar/desativar mod |
| `tgs_mod_mod_apply_all` | Aplicar todos |
| `tgs_mod_fivem_launch` | Iniciar FiveM |
| `tgs_mod_search` | Pesquisa (debounce 2s) |

---

## 5. Admin GA4 — dimensões e conversões

**Admin → Definições personalizadas → Dimensões** (escopo: Evento):

`tgs_product`, `tgs_category`, `tgs_action`, `tgs_target_app`, `screen_name`, `pack_id`, `pack_name`, `ad_id`, `error_message`, `tab_name`

**Conversões sugeridas:** `tgs_pack_export_complete`, `tgs_hub_app_install_complete`, `tgs_mod_login_success`

---

## 6. DebugView e desktop

- `page_location` virtual: `https://tgs.gamer.gd/...` (GA ignora `file://`).
- **DebugView:** `debug_mode` automático em `localhost` / `127.0.0.1`, ou `localStorage.setItem('TGS_GA_DEBUG','1')` + reload.
- **Pack:** F12, `tgsGaEnableDebug()`, `tgsGaPing()`.
- Relatórios normais: atraso **24–48 h**; DebugView é imediato com `debug_mode`.

---

## 7. Privacidade

- `anonymize_ip: true`
- Não enviar email/username
- `VITE_GA_ENABLED=false` (Launcher/Pack dev) para desligar

---

## 8. Relacionado

- [FLUXO_RELEASE_E_GA4.md](FLUXO_RELEASE_E_GA4.md)
- [CHECKLIST_RELEASE.md](CHECKLIST_RELEASE.md)
