# ☁️ Estratégia de Hospedagem e Implantação (Custo Zero)

Este documento descreve a arquitetura de implantação (deploy) do ecossistema TGS Launcher, considerando a necessidade de manter os custos em zero ($0) e superando as limitações técnicas de serviços de hospedagem web tradicionais.

---

## 1. O Desafio da Hospedagem Atual (InfinityFree)

A sua conta na **InfinityFree** é excelente para hospedar o site estático da TGS e aplicações em PHP. No entanto, ela possui limitações críticas para este projeto:
- ❌ **Não suporta Node.js**: Os servidores do *Mod Menager* e *Pack Menager* foram desenvolvidos em Node.js (Express), logo, não podem ser executados na InfinityFree.
- ❌ **Bloqueio de Banco de Dados Remoto**: A InfinityFree não permite que aplicações externas se conectem ao MySQL deles (apenas o próprio site hospedado lá pode acessar).

Para resolver isso, dividiremos a estratégia em três frentes principais.

---

## 2. Pack Menager (Servidor Local)

O *Pack Menager* é focado no processamento de arquivos pesados (modelos 3D, `.yft`, arquivos `.meta`). 

- **Estratégia:** O servidor Node.js dele **não deve ser hospedado na nuvem**. Ele deve rodar estritamente **localmente** (`localhost`) na máquina do usuário.
- **Como funciona:** O aplicativo Desktop (Electron) inicia o servidor Express em background quando o usuário abre o aplicativo, e o desliga ao fechar.
- **Custo:** $0 (Usa o processamento do próprio computador do cliente).

---

## 3. Mod Menager (Servidor Remoto e Banco de Dados)

O *Mod Menager* gerencia autenticação, controle de acesso e fornece o catálogo de mods para os usuários. Este precisa estar acessível via internet 24/7.

Temos duas opções gratuitas de arquitetura:

### Opção A: Infraestrutura Node.js Gratuita (Recomendada)
Migraremos a API Node.js e o Banco de Dados para serviços "Serverless" gratuitos focados em desenvolvedores:
1. **Hospedagem da API (Node.js)**: Usar o **Render.com** (plano gratuito). O Render suporta projetos Node.js nativamente. (Alternativas: Koyeb ou Railway).
2. **Banco de Dados (PostgreSQL/MySQL)**: Usar o **Supabase** ou o **Aiven** (planos gratuitos robustos). Isso substitui a necessidade do MySQL da InfinityFree.

### Opção B: Arquitetura Estática (Alternativa Mais Simples)
Se a segurança de login rigorosa não for um requisito imediato:
- Removemos a necessidade do servidor Node.js.
- O catálogo de mods é salvo em um arquivo `mods-config.json`.
- Hospedamos esse `.json` na sua própria **InfinityFree** ou via **GitHub Pages**.
- O Desktop app apenas baixa esse JSON e lê os mods disponíveis.

---

## 4. Distribuição e atualização (Launcher + apps)

- **Launcher:** instalador **NSIS** publicado no repositório público de releases; o cliente usa `electron-updater` contra esse feed.
- **Pack Menager / Mod Menager:** builds **portáteis** (`.exe` com nome fixo) no respetivo repositório `*-releases`. O **TGS Launcher** descarrega esses ficheiros para `<installPath>\data\apps\...` na primeira instalação; cada app pode continuar a atualizar-se via `electron-updater` a partir da mesma release pública.
- **Custo:** $0 na banda do GitHub para o fluxo típico de open source / releases públicas (sujeito às regras da GitHub).

Para configurar PAT, secrets e nomes exatos dos repositórios, veja [GITHUB_SETUP_COMPLETE_GUIDE.md](GITHUB_SETUP_COMPLETE_GUIDE.md).

---

## 5. Resumo do Plano de Ação

1. **Ajustar Pack Menager:** Integrar a inicialização do server.js junto com o ciclo de vida do Electron (para não precisar de hospedagem).
2. **Criar Contas Base:** Criar conta no [Render.com](https://render.com) e no [Supabase](https://supabase.com).
3. **Migrar API do Mod Menager:** Fazer o deploy do código da pasta `MainCode/Mod Menager/server` no Render.
4. **Configurar CI/CD:** Conectar o repositório do GitHub para lançar novas versões dos aplicativos (Electron) via GitHub Releases.
