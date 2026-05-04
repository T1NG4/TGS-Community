# TGS Launcher

> Launcher desktop para ecossistema de aplicações TGS (FiveM)

## 🌐 Visão Geral

O **TGS Launcher** é um hub central desenvolvido em Electron que gerencia a instalação, atualização e execução de aplicações do ecossistema TGS. Atualmente suporta:

- **Pack Menager** — Sistema profissional de automação para criação e gerenciamento de packs de veículos para FiveM
- **Mod Menager** — Sistema completo de gerenciamento de mods para FiveM com autenticação segura

## 🚀 Funcionalidades

- ✅ **Instalação automatizada** de aplicações
- ✅ **Auto-update** robusto via GitHub Releases
- ✅ **Interface unificada** com design moderno
- ✅ **Gestão centralizada** de configurações
- ✅ **Logs em tempo real** para diagnóstico
- ✅ **Suporte a múltiplos canais** (stable/beta)

## 🏗️ Arquitetura

```
TGS Launcher (Hub Central)
├── Pack Menager (App 1)
└── Mod Menager (App 2)
```

## 📁 Estrutura do Projeto

```
├── 📁 DOCUMENTACAO_*.md     # Documentação oficial
├── 📁 MainCode/            # Código fonte ativo
│   ├── 📁 Launcher/        # Hub principal
│   ├── 📁 Pack Menager/    # App 1
│   └── 📁 Mod Menager/     # App 2
├── 📁 Dependence/          # Dependências compartilhadas
├── 📁 usuario/             # Dados do usuário
└── 📁 plan/               # Planos de migração
```

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Node.js + Electron
- **Build**: electron-builder + Vite
- **CI/CD**: GitHub Actions
- **Updates**: electron-updater + GitHub Releases

## 📋 Pré-requisitos

- Node.js 20.x ou superior
- npm ou yarn
- Windows 10/11 (suporte principal)

## 🚀 Instalação e Desenvolvimento

### Clonar o repositório

```bash
git clone https://github.com/SEU-ORG/tgs-launcher.git
cd tgs-launcher
```

### Instalar dependências

```bash
# Para o Launcher
cd MainCode/Launcher
npm install

# Para dependências compartilhadas (opcional)
cd ../../Dependence
npm install
```

### Executar em desenvolvimento

```bash
cd MainCode/Launcher
npm run dev
```

### Build para produção

```bash
cd MainCode/Launcher
npm run build
```

## 🔄 Sistema de Auto-Update

O Launcher implementa um sistema robusto de atualização automática:

- **Verificação automática** na inicialização
- **Download em background** com progresso visual
- **Confirmação explícita** antes de instalar
- **Suporte a canais** stable e beta
- **Repositório separado** para releases (público)

> 📖 Veja o guia completo: [AUTO_UPDATE_SETUP.md](MainCode/Launcher/AUTO_UPDATE_SETUP.md)

## 📦 Processo de Release

1. **Criar tag**: `git tag v1.0.1 && git push origin v1.0.1`
2. **GitHub Actions** builda automaticamente
3. **Release publicada** no repositório público
4. **Usuários recebem** update automaticamente

## 📚 Documentação

- [📋 Documentação Geral](DOCUMENTACAO_GERAL.md) — Visão completa do ecossistema
- [🚀 Launcher](DOCUMENTACAO_LAUNCHER.md) — Detalhes do hub central
- [📦 Pack Menager](DOCUMENTACAO_PACK_MENAGER.md) — Sistema de packs
- [🔧 Mod Menager](DOCUMENTACAO_MOD_MENAGER.md) — Sistema de mods
- [🌐 Hospedagem](DOCUMENTACAO_HOSPEDAGEM.md) — Infraestrutura

## 🤝 Contribuição

1. Fork o repositório
2. Crie branch para sua feature: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Add: nova funcionalidade'`
4. Push para o branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🏷️ Versão

**Versão atual**: 1.0.0

---

> **TGS Studio** — Desenvolvimento de soluções para FiveM
