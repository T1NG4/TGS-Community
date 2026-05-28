# Setup — TGS Community (monorepo)

## Requisitos

- Windows 10/11
- Git
- **Volta** (recomendado para padronizar Node/npm no time)

## Instalar Volta

Guia oficial: `https://volta.sh/`

Após instalar, abra um terminal novo e confirme:

```bash
volta --version
node -v
npm -v
```

Este repo fixa versões via `package.json` (campo `volta`).

## Rodar local

Na raiz do monorepo:

### Launcher (Hub)

```bash
npm run launcher:dev
```

### Pack Menager

```bash
npm run pack:dev
```

### Mod Menager

```bash
npm run mod:dev
```

### Site

```bash
npm run site:serve
```

## Variáveis de ambiente (referência)

- Launcher (dev): `TGS Launcher/MainCode/Launcher/.env.example` → copiar para `.env`
- Pack (client): `TGS Launcher/MainCode/Pack Menager/src/client/.env.example` → copiar para `.env`

Obs: o CI usa secrets do GitHub para GA4 quando aplicável.

## Publicar release (CI)

Ao criar uma tag `vX.Y.Z` no monorepo, três workflows publicam nos repos `*-releases`.

**Obrigatório** no [Secrets do TGS-Community](https://github.com/T1NG4/TGS-Community/settings/secrets/actions):

| Secret | Uso |
|--------|-----|
| `RELEASES_REPO_TOKEN` | PAT com permissão de escrever releases em `TGS-launcher-releases`, `TGS-pack-manager-releases`, `TGS-mod-manager-releases` |

Sem esse secret, o build termina com erro `GH_TOKEN is not set`.

Guia completo: `TGS Launcher/docs/GITHUB_SETUP_COMPLETE_GUIDE.md`  
Checklist pós-tag: `TGS Launcher/docs/CHECKLIST_RELEASE.md`

