# Migração e Padronização para `MainCode/`

> **Estado (2026):** a estrutura em `MainCode/` e a documentação na raiz do repositório (`README.md`, `DOCUMENTACAO_*.md`, `GITHUB_SETUP_COMPLETE_GUIDE.md`) refletem o estado actual. Este ficheiro conserva o plano original da migração.

Este plano migra o Launcher, Pack Menager e Mod Menager para `MainCode/` com estrutura padronizada e dependências unificadas em `Dependence/`, copiando apenas o necessário para funcionamento.

---

## Objetivo

- Mover:
  - Launcher → `MainCode/Launcher`
  - Mod Menager → `MainCode/Mod Menager`
  - Pack Menager → `MainCode/Pack Menager`
- Padronizar estrutura e scripts para que **nenhum app tenha `node_modules` próprio**.
- Garantir que **todos os apps utilizem exclusivamente `Dependence/node_modules`**.
- Levar somente arquivos necessários (sem build artifacts, cache, logs, duplicações).

---

## Mapeamento de Fontes (origem → destino)

### 1) Launcher

- **Fonte UI (painel novo)**:
  - `oldcode/TGS_fivem_pack_maneger/novo painel do launcher/`
- **Fonte Electron (processo main + build)**:
  - (a confirmar durante implementação) usar a base Electron existente em:
    - `oldcode/TGS_fivem_pack_maneger/codigo fonte/launcher/`

**Destino**:
- `MainCode/Launcher/`

**Observação importante**: o “painel novo” é apenas o front React/Vite. Para o Launcher funcionar como app desktop, ele precisa ser acoplado a uma camada Electron (main/preload/build). O plano é padronizar o Launcher como um app Electron com:
- `renderer/` vindo do painel novo
- `main/` vindo do launcher Electron legado (somente o necessário)

### 2) Pack Menager

- **Fonte**:
  - `oldcode/TGS_fivem_pack_maneger/codigo fonte/`
- **Inclui templates/exemplos necessários**:
  - `[TGS-Fivem-Pack]/` e quaisquer templates que sejam parte do funcionamento do export/geração

**Destino**:
- `MainCode/Pack Menager/`

### 3) Mod Menager

- **Fonte**:
  - `oldcode/TGS Mod Menager/` (conforme seu aviso)

**Destino**:
- `MainCode/Mod Menager/`

---

## Padronização de Estrutura (padrão alvo)

### Estrutura padrão por app (Electron + UI + backend quando existir)

- `app/`
  - `main/` (Electron main + preload + IPC)
  - `renderer/` (UI React/Vite ou HTML/CSS/JS)
  - `shared/` (types, utils, constantes)
- `server/` (quando houver API separada)
- `assets/` (imagens/ícones)
- `scripts/` (scripts auxiliares de build/run)
- `package.json` (apenas scripts + metadados; **sem dependências instaladas localmente**)

A migração vai adaptar cada projeto para ficar o mais próximo possível desse padrão sem quebrar funcionamento.

---

## Regras do que entra / o que fica fora ("somente necessário")

### Incluir

- Código fonte:
  - `src/`, `app/`, `client/`, `server/`, `renderer/`, `main/` (conforme existir)
- Configs essenciais:
  - `package.json`, configs do Vite/TS/Electron Builder, `.env.example` (se existir)
- Assets necessários:
  - `resources/`, `assets/`, `public/`, ícones e imagens usadas em runtime
- Templates do Pack Menager:
  - templates e recursos-base utilizados para gerar/exportar packs

### Excluir (não migrar)

- `node_modules/` (já removido/será evitado)
- `dist/`, `release/`, `out/`, `build/` gerados
- logs (`*.log`, pastas `logs/`), caches (`.cache/`), relatórios
- downloads/artefatos temporários
- duplicações (ex.: duas versões do mesmo asset/config)

---

## Dependências Unificadas (como os apps vão “usar” `Dependence/`)

### Estratégia adotada (Windows-friendly e confiável)

- Criar **junctions** (atalhos do tipo diretório) de `node_modules` dentro de cada app apontando para o `Dependence/node_modules`.
- Assim:
  - o Node/Electron resolve imports normalmente (`require('express')`, `import react from 'react'`)
  - não existe duplicação física (somente um `node_modules` real)

**Padrão por app:**
- `MainCode/<App>/node_modules` → junction para `../../Dependence/node_modules`

### Scripts padronizados

- Criar um script por app (ou um script raiz) para:
  - remover `node_modules` local (se existir)
  - recriar junction para `Dependence/node_modules`
  - garantir que o app rode com as dependências unificadas

---

## Ajustes de configuração pós-migração (para “já funcionar”)

Para cada app em `MainCode/`:

- Atualizar paths relativos quebrados:
  - imports internos
  - caminhos de assets
  - configurações de build
  - referências de `resources/` do Electron
- Ajustar scripts do `package.json`:
  - `dev`, `build`, `start` para refletir a nova estrutura
- Padronizar portas/URLs (quando houver server):
  - documentar e evitar colisão (ex.: Pack Menager server vs Mod Menager server)

---

## Checklist de validação

- [ ] `MainCode/Launcher` abre (Electron) e carrega o painel novo
- [ ] `MainCode/Pack Menager` roda em dev e consegue gerar/exportar pack usando templates necessários
- [ ] `MainCode/Mod Menager` roda (client + server) e acessa endpoints corretamente
- [ ] Nenhum `node_modules` real dentro de `MainCode/*` (somente junctions)
- [ ] `oldcode/` permanece como referência (não é apagado nesta etapa)

---

## Riscos / pontos que podem exigir decisão rápida

- O painel novo do Launcher pode não incluir a parte Electron (main/preload/build). Caso esteja incompleto, usaremos a base Electron do launcher legado e apenas trocaremos o renderer pelo painel novo.
- Alguns projetos podem ter configs com caminhos absolutos (ex.: paths no Windows). Precisaremos normalizar para paths relativos ou parametrizar.
