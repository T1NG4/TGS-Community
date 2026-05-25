# Google Analytics 4 — Ecossistema TGS

Integração **GA4** (gtag.js) no **TGS Launcher**, **Pack Menager** e **Mod Menager**. Em produção os eventos só são enviados se o Measurement ID estiver configurado.

---

## 1. Criar propriedade GA4

1. [Google Analytics](https://analytics.google.com/) → Admin → Criar propriedade.
2. Fluxo de dados **Web** (ou vários fluxos, um por app).
3. Copiar o **Measurement ID** (`G-XXXXXXXXXX`).

Pode usar **um único ID** para todo o ecossistema e filtrar no GA4 pelo parâmetro `app_name`, ou IDs separados por app.

---

## 2. Configuração por aplicativo

### TGS Launcher (`MainCode/Launcher`)

```bash
cd MainCode/Launcher
copy .env.example .env
# Editar .env:
# VITE_GA_MEASUREMENT_ID=G-SEU_ID
```

- Código: `src/analytics/ga4.ts`
- Arranque: `App.tsx` (após `get-app-info`)
- **Build:** o ID é embutido no `vite build`; para releases CI, definir `VITE_GA_MEASUREMENT_ID` como secret/variável do workflow.

Testar em dev: `VITE_GA_ENABLED=true` no `.env`.

### Pack Menager (`MainCode/Pack Menager/src/client`)

```bash
cd "MainCode/Pack Menager/src/client"
copy .env.example .env
# VITE_GA_MEASUREMENT_ID=G-SEU_ID
```

- Código: `src/client/src/analytics/ga4.ts`
- CSP: `src/server/src/app.js` inclui `https://www.googletagmanager.com` em `script-src`
- Rebuild do cliente + servidor empacotado para produção

### Mod Menager (`MainCode/Mod Menager/client`)

```bash
cd "MainCode/Mod Menager/client"
copy analytics-config.example.js analytics-config.js
# Editar analytics-config.js → measurementId: 'G-SEU_ID'
```

- Scripts: `analytics-config.js` + `analytics.js` (incluídos em `login.html`, `dashboard.html`, etc.)
- CSP: `main-new.js` (`connect-src` para domínios GA4)

---

## 3. Eventos enviados

| App | `app_name` | Eventos |
|-----|------------|---------|
| Launcher | `tgs_launcher` | `page_view` (hub + troca Pack/Mod/Code), `app_install_start`, `app_install_complete`, `app_update_start`, `app_update_complete`, `app_launch` |
| Pack Menager | `tgs_pack_manager` | `page_view`, `pack_export_complete` |
| Mod Menager | `tgs_mod_manager` | `page_view` (por página HTML), `login_success` |

O Pack Menager mantém o canal separado **`trackAdEvent`** (URL opcional no JSON de ads em `T1NG4/TGS-ads`) — não substitui o GA4.

---

## 4. Privacidade e dev

- `anonymize_ip: true` na config gtag.
- Sem ID configurado → **nenhum** script GA é carregado.
- Em desenvolvimento, analytics **desligado** por defeito (exceto `VITE_GA_ENABLED=true` no Launcher/Pack ou `enabledInDev: true` no Mod).

---

## 5. Relacionado

- [DOCUMENTACAO_GERAL.md](DOCUMENTACAO_GERAL.md)
- [DOCUMENTACAO_LAUNCHER.md](DOCUMENTACAO_LAUNCHER.md)
- [DOCUMENTACAO_PACK_MENAGER.md](DOCUMENTACAO_PACK_MENAGER.md)
