# Fluxo de release e GA4 — Ecossistema TGS

Como testar **sempre via build do GitHub** (sem depender de `npm run dev`).

---

## 1. Repositórios

| Componente | Código (monorepo) | Releases (.exe) |
|------------|-------------------|-----------------|
| Launcher | `T1NG4/tgs-launcher` | [TGS-launcher-releases](https://github.com/T1NG4/TGS-launcher-releases/releases) |
| Pack Manager | `MainCode/Pack Menager` | [TGS-pack-manager-releases](https://github.com/T1NG4/TGS-pack-manager-releases/releases) |
| Mod Manager | `MainCode/Mod Menager` | [TGS-mod-manager-releases](https://github.com/T1NG4/TGS-mod-manager-releases/releases) |

---

## 2. CI (GitHub Actions)

Workflows na **raiz** `.github/workflows/` (só estes rodam no monorepo):

| Workflow | Publica em |
|----------|------------|
| `release.yml` | Launcher (NSIS) |
| `release-pack.yml` | Pack (portable) |
| `release-mod.yml` | Mod (portable) |

**Trigger:** tag `vX.Y.Z` (ex.: `v2.0.17`).

**Regra obrigatória:** `package.json` de cada app = `X.Y.Z` da tag. O CI falha se não bater.

---

## 3. Fluxo do utilizador (teste)

```
1. Baixar / instalar Launcher (NSIS) da release latest
        ↓
2. Launcher verifica update de si mesmo (electron-updater)
   → se houver v nova: banner "Nova versão" → instalar
        ↓
3. No hub: Instalar ou Atualizar Pack / Mod
   → Launcher baixa sempre de:
     github.com/.../releases/latest/download/<Portable.exe>
   → grava version.json na pasta TGSApps
        ↓
4. Executar App (Pack ou Mod)
   → bloqueado se versão instalada < latest no GitHub
        ↓
5. GA4 em cada processo (.exe separado)
   → Launcher: tgs_hub_*, tgs_launcher_*
   → Pack: tgs_pack_*
   → Mod: tgs_mod_*
```

---

## 4. Google Analytics 4

- **Três fluxos Web** na mesma propriedade GA4 (recomendado): secrets `GA_MEASUREMENT_ID_LAUNCHER`, `_PACK`, `_MOD`
- **Fallback CI:** `G-DF8MNV3V66` se secret vazio
- **Launcher / Pack:** `VITE_GA_MEASUREMENT_ID` no build
- **Mod:** `analytics-config.js` gerado no CI ou `analytics-config.example.js`
- **Core partilhado:** `MainCode/shared/analytics/` (fila de eventos)

**DebugView (build GitHub):**

| App | Como |
|-----|------|
| Launcher | F12 (já abre) ou `localStorage TGS_GA_DEBUG=1` + reload |
| Pack | **F12** ou **Ctrl+Shift+I** no portable v2.0.16+ |
| Mod | F12 ou `TGS_GA_DEBUG=1` + reload |

Filtrar eventos com prefixo `tgs_` ou parâmetro `tgs_product`.

Detalhes: [DOCUMENTACAO_ANALYTICS.md](DOCUMENTACAO_ANALYTICS.md)

---

## 5. Publicar nova versão (dev)

1. Alinhar versões nos `package.json`:
   - `MainCode/Launcher/package.json` + `src/main/constants.js`
   - `MainCode/Pack Menager/package.json` + UI `currentVersion`
   - `MainCode/Mod Menager/client/package.json` + `analytics-config.js`
2. Commit + push `main`
3. Tag: `git tag -a v2.0.17 -m "..."` + `git push origin v2.0.17`
4. Aguardar 3 jobs verdes em [Actions](https://github.com/T1NG4/tgs-launcher/actions)
5. Testar downloads nas 3 páginas de releases

---

## 6. Problema que existia (corrigido)

Os workflows em `MainCode/*/.github/workflows/` **não executavam** — o GitHub só lê `.github/workflows/` na **raiz** do repo. Por isso o Pack ficou preso em **v2.0.11** enquanto só o Launcher publicava.
