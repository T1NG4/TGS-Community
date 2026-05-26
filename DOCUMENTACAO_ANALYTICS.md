# Google Analytics 4 — Ecossistema TGS

Integração **GA4** (gtag.js) no **TGS Launcher**, **Pack Menager** e **Mod Menager**. Eventos com prefixo **`tgs_`** para filtrar facilmente em **Principais eventos** / **DebugView**.

---

## 1. Criar propriedade GA4

1. [Google Analytics](https://analytics.google.com/) → Admin → Criar propriedade.
2. Fluxo de dados **Web** (ou vários fluxos, um por app).
3. Copiar o **Measurement ID** (`G-XXXXXXXXXX`).

Pode usar **um único ID** para todo o ecossistema e filtrar pelo parâmetro `tgs_product` / `app_name`.

---

## 2. Configuração por aplicativo

### TGS Launcher (`MainCode/Launcher`)

```bash
cd MainCode/Launcher
copy .env.example .env
# VITE_GA_MEASUREMENT_ID=G-SEU_ID
```

- `src/analytics/ga4.ts` — transporte gtag
- `src/analytics/tgsEvents.ts` — catálogo de eventos do hub
- Arranque: `App.tsx`

### Pack Menager (`MainCode/Pack Menager/src/client`)

```bash
cd "MainCode/Pack Menager/src/client"
copy .env.example .env
# VITE_GA_MEASUREMENT_ID=G-SEU_ID
```

- `src/client/src/analytics/ga4.ts` + `tgsEvents.ts`
- UI: `http://localhost:3791` (porta dinâmica em produção)

### Mod Menager (`MainCode/Mod Menager/client`)

```bash
cd "MainCode/Mod Menager/client"
copy analytics-config.example.js analytics-config.js
```

- `analytics.js` + `tgsEvents.js`
- UI: `http://127.0.0.1:3793`

---

## 3. Catálogo de eventos

Parâmetros comuns em quase todos os eventos:

| Parâmetro | Uso |
|-----------|-----|
| `tgs_product` | `tgs_launcher`, `tgs_pack_manager`, `tgs_mod_manager` |
| `tgs_category` | `lifecycle`, `navigation`, `export`, `auth`, `engagement` |
| `tgs_action` | Ação semântica (`install_start`, `export_complete`, …) |
| `tgs_target_app` | No hub: `pack` ou `mod` |

### Launcher (hub)

| Evento | Quando |
|--------|--------|
| `tgs_screen_view` | Troca de modo Pack / Mod / Code / home |
| `tgs_hub_app_install_start` | Início da **primeira** instalação |
| `tgs_hub_app_install_complete` | Instalação OK (`duration_ms`) |
| `tgs_hub_app_install_failed` | Instalação falhou |
| `tgs_hub_app_update_start` | Atualização de app (`version_from`, `version_to`) |
| `tgs_hub_app_update_complete` | Atualização OK |
| `tgs_hub_app_update_failed` | Atualização falhou |
| `tgs_hub_app_open` | Botão **Executar** (Pack/Mod aberto) |
| `tgs_launcher_self_update_start` | Update do próprio Launcher disponível |
| `tgs_launcher_self_update_complete` | Update do Launcher baixado |

Também é enviado `page_view` nas navegações (`trackScreen`).

### Pack Manager

| Evento | Quando |
|--------|--------|
| `tgs_pack_open` | App aberto / sessão iniciada |
| `tgs_pack_export_start` | Export confirmado (após gate de anúncio) |
| `tgs_pack_export_complete` | Pack gerado (`duration_ms`, `warning_count`) |
| `tgs_pack_export_failed` | Erro no export ou nas rodas |

Parâmetros úteis: `pack_id`, `pack_name`, `vehicle_count`.

### Mod Manager

| Evento | Quando |
|--------|--------|
| `tgs_mod_open` | Página carregada (login, dashboard, …) |
| `tgs_mod_login_success` | Login com sucesso |
| `tgs_mod_dashboard_open` | Dashboard montado |

---

## 4. Métricas no painel GA4

Sugestões em **Admin → Definições personalizadas → Dimensões personalizadas** (escopo: Evento):

- `tgs_product`
- `tgs_target_app`
- `tgs_category`
- `tgs_action`
- `pack_name` (Pack)

Explorar:

- **Instalações:** contagem de `tgs_hub_app_install_start` vs `complete` (funil).
- **Atualizações:** `tgs_hub_app_update_start` / `complete`.
- **Pack em uso:** `tgs_pack_open` + `tgs_hub_app_open` com `tgs_target_app=pack`.
- **Exports:** `tgs_pack_export_start` vs `complete` / `failed`.

Eventos antigos (`app_install_start`, `app_open`, `pack_export_complete`, …) deixam de ser emitidos nas versões novas.

---

## 5. Desktop (Electron) e DebugView

O GA4 não contabiliza bem `file://`. Os apps enviam `page_location` em `https://tgs.gamer.gd/...`.

**DebugView (Pack/Launcher em `http://localhost`):** `debug_mode` liga **automaticamente** — não precisa de `TGS_GA_DEBUG` se a UI for servida em localhost.

**DebugView (manual):** `localStorage.setItem('TGS_GA_DEBUG','1')` + reload, ou `npm run dev`.

**Console (Pack):** `tgsGaEnableDebug()`, `tgsGaPing()` (evento de teste), e logs `[TGS GA4] evento →` com cada envio.

---

## 6. Privacidade

- `anonymize_ip: true`
- ID padrão embutido (`G-DF8MNV3V66`); sobrescrever via `.env` / `analytics-config.js`
- Desligar em dev: `VITE_GA_ENABLED=false` ou `enabledInDev: false`

---

## 7. Relacionado

- [DOCUMENTACAO_GERAL.md](DOCUMENTACAO_GERAL.md)
- [DOCUMENTACAO_LAUNCHER.md](DOCUMENTACAO_LAUNCHER.md)
- [DOCUMENTACAO_PACK_MENAGER.md](DOCUMENTACAO_PACK_MENAGER.md)
