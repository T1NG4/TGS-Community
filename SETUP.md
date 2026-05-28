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

