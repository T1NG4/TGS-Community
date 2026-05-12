# 🚗 Documentação - Pack Menager

> Sistema profissional de automação para criação e gerenciamento de packs de veículos para FiveM

---

## Índice

- [Visão Geral](#-visão-geral)
- [Integração com o TGS Launcher](#integração-com-o-tgs-launcher)
- [Tecnologias e Arquitetura](#-tecnologias-e-arquitetura)
- [Instalação e Execução](#-instalação-e-execução)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Como Usar](#-como-usar)
- [Estrutura dos Packs Gerados](#-estrutura-dos-packs-gerados)
- [Processamento de Arquivos .META](#-processamento-de-arquivos-meta)
- [Sistema de Rodas Compartilhadas](#-sistema-de-rodas-compartilhadas)
- [API Reference](#-api-reference)
- [Logs e Troubleshooting](#-logs-e-troubleshooting)

---

## 🌐 Visão Geral

O **Pack Menager** é uma aplicação desktop completa desenvolvida em Electron + React + Node.js que automatiza todo o processo de criação, configuração e gerenciamento de packs de veículos para FiveM. Utilizando a estrutura otimizada da base TGS, o aplicativo transforma um processo manual complexo em uma experiência intuitiva e eficiente.

### Objetivo Principal

- **Automação Completa** — Da importação de arquivos à exportação do pack final
- **Estrutura Otimizada** — Base TGS com meta files compartilhados por marca
- **Interface Intuitiva** — Drag & drop, visualização em tempo real e feedback inteligente
- **Validação Avançada** — Verificação de integridade XML e referências cruzadas

### Recursos Gerados

O aplicativo gera automaticamente **três recursos independentes** para FiveM:

| Recurso | Descrição | Arquivos Principais |
|---------|-----------|-------------------|
| **VehiclesPack** | Veículos, modelos 3D e configurações | `.yft`, `.ytd`, `.ydr`, `.ycd`, `.meta` |
| **SoundsPack** | Sons de motores customizados | `.awc`, `.dat`, `.rel`, `.nametable` |
| **WheelsPack** | Rodas customizadas e scripts | `.ydr`, `carcols.meta`, `tuning.lua` |

### Integração com o TGS Launcher

O **TGS Launcher** descarrega o build portátil `TGS-Pack-Manager-Portable.exe` (release pública no GitHub, ver `DOWNLOAD_URLS` em `MainCode/Launcher/src/main/constants.js`) para `<installPath>\data\apps\packManager\`, junto com `version.json`. O fluxo recomendado é **Executar** a partir do hub, para respeitar a pasta de instalação escolhida no rodapé (**Alterar pasta**). O Pack Menager pode atualizar-se sozinho via **electron-updater** contra o repositório público de releases. Mais detalhes: [DOCUMENTACAO_LAUNCHER.md](DOCUMENTACAO_LAUNCHER.md).

---

## 🛠 Tecnologias e Arquitetura

### Stack Tecnológico

| Componente | Tecnologia | Versão | Uso |
|-------------|------------|--------|-----|
| **Runtime** | Electron | 39.8.9 | Aplicação desktop |
| **Frontend** | React + TypeScript | 19.x | Interface do usuário |
| **Backend** | Node.js + Express | 20.x | API e processamento |
| **Build Tool** | Vite | 7.x | Build e desenvolvimento |
| **Database** | File System (JSON) | - | Armazenamento local |
| **File Processing** | fs-extra, multer | - | Manipulação de arquivos |
| **XML Parsing** | xml2js | - | Parser de .meta files |

### Estrutura do Projeto

```
Pack Menager/
├── 📁 src/
│   ├── 📁 client/                   # Frontend React
│   │   ├── 📁 src/
│   │   │   ├── 📄 App.tsx           # Componente principal
│   │   │   ├── 📁 components/       # Componentes UI
│   │   │   ├── 📁 hooks/            # Custom hooks
│   │   │   ├── 📄 translations.ts   # Internacionalização
│   │   │   └── 📁 utils/           # Utilitários
│   │   ├── 📄 index.html            # HTML base
│   │   ├── 📄 vite.config.ts        # Configuração Vite
│   │   └── 📄 package.json          # Dependências client
│   ├── 📁 server/                   # Backend Node.js
│   │   ├── 📁 src/
│   │   │   ├── 📄 index.js          # Entry point
│   │   │   ├── 📄 app.js            # API principal
│   │   │   ├── 📄 generator.js      # Gerador de packs
│   │   │   ├── 📄 metaParser.js     # Parser de .meta files
│   │   │   ├── 📄 carcolsMenager.js # Gerenciador de rodas
│   │   │   ├── 📄 audioManifestGenerator.js # Gerador de áudio
│   │   │   └── 📁 __tests__/        # Testes automatizados
│   │   └── 📄 package.json          # Dependências server
│   └── 📁 electron/                 # Processo principal
│       ├── 📄 main.js               # Entry point Electron
│       ├── 📄 preload.js            # Script de preload
│       └── 📄 app.manifest          # Manifest da aplicação
├── 📁 [TGS-Fivem-Pack]/             # Template base para packs
│   ├── 📁 TGS-VehiclesPack/         # Template de veículos
│   ├── 📁 TGS-SoundsPack/           # Template de sons
│   └── 📁 TGS-WheelsPack/           # Template de rodas
├── 📁 input/                        # Diretório de staging
├── 📁 output/                       # Diretório de saída
├── 📁 assets/                       # Assets da aplicação
├── 📁 examples/                     # Exemplos e documentação
├── 📁 Dependence/                   # 📍 Dependências unificadas (único local)
└── 📄 package.json                  # Configuração raiz
```

---

## 📦 Instalação e Execução

### Pré-requisitos

- **Node.js** 20.x ou superior
- **npm** ou **yarn**
- **5GB** de espaço livre em disco
- **Windows 10+** / **macOS 12+** / **Ubuntu 20.04+**

### Instalação

1. **Navegar para o diretório**:
```bash
cd "MainCode/Pack Menager"
```

2. **Instalar dependências completas**:
```bash
# Todas as dependências são buscadas do diretório unificado Dependence/
npm run install-all
```

3. **Executar em desenvolvimento**:
```bash
npm run dev
```

4. **Build para produção**:
```bash
npm run build:electron
```

### Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor + cliente + Electron |
| `npm run server` | Apenas servidor Node.js (porta 3001) |
| `npm run client` | Apenas Vite dev server (porta 5173) |
| `npm run build:client` | Build do cliente para produção |
| `npm run build:exe` | Build do executável Windows |
| `npm run test:run` | Executa testes automatizados |
| `npm run lint` | Executa linting do código |

---

## ✨ Funcionalidades Principais

### 🏗️ Geração Automática de Packs

- **Meta por Marca** — Todos os carros da mesma marca compartilham arquivos `.meta`
- **Sons Compartilhados** — Múltiplos carros podem usar o mesmo arquivo de áudio
- **Rodas Compartilhadas** — Gerenciamento centralizado por marca
- **Wildcards Automáticos** — Adicione novos carros sem editar `fxmanifest.lua`
- **Separação Inteligente** — Identifica automaticamente arquivos base e de tunagem

### 🎨 Interface Moderna

- **Design Glassmorphism** — Interface moderna com gradientes e animações
- **Drag & Drop** — Arraste e solte arquivos diretamente na interface
- **Gerenciamento por Marcas** — Organização hierárquica intuitiva
- **Preview em Tempo Real** — Visualização da estrutura antes da exportação

### 🔧 Processamento Inteligente

- **Upload Automático** — Separa automaticamente arquivos base de tunagem
- **Meta Files** — Geração e merge automáticos de configurações XML
- **Rodas Compartilhadas** — Gerenciador integrado de rodas por marca
- **Validação Avançada** — Verifica integridade completa da estrutura do pack

---

## 📖 Como Usar

### Criando um Novo Pack

1. **Iniciar o Aplicativo**
   - Execute `npm run dev:electron`
   - Aguarde o carregamento completo

2. **Criar Novo Pack**
   - Clique em **"Criar Novo Pack"**
   - Defina nome e descrição do pack

3. **Adicionar Marcas e Veículos**
   - Clique em **"Adicionar Marca"**
   - Para cada marca, adicione veículos individuais

4. **Upload de Arquivos**
   - Arraste e solte os arquivos na área de upload
   - O sistema separa automaticamente:
     - **Modelos 3D**: `.yft`, `.ytd`, `.ydr`, `.ycd`
     - **Tunagem**: Arquivos com `_arch_` ou `_tuning`
     - **Meta files**: `.meta` (handling, vehicles, carcols, etc.)

5. **Configurar Meta Files**
   - Os arquivos `.meta` são processados automaticamente
   - Use o editor visual para ajustes finos se necessário

6. **Gerenciar Rodas Compartilhadas**
   - Navegue até **"Rodas Compartilhadas"**
   - Adicione rodas por marca usando o gerenciador integrado

7. **Exportar Pack**
   - Clique em **"Exportar"**
   - Aguarde o processamento e validação
   - O pack será gerado em `output/`

---

## 📦 Estrutura dos Packs Gerados

### VehiclesPack

```
PackName-VehiclesPack/
├── 📄 fxmanifest.lua              # Manifest com wildcards
├── 📁 data/                       # Configurações consolidadas
│   ├── 📄 handling.meta           # Física dos veículos
│   ├── 📄 vehicles.meta           # Metadados gerais
│   ├── 📄 carcols.meta            # Cores e modificações
│   ├── 📄 carvariations.meta      # Variações (cores/liveries)
│   └── 📄 vehiclelayouts.meta     # Layouts internos
└── 📁 stream/                     # Modelos 3D por marca
    └── 📁 [MARCA]/
        └── 📁 [MODELO]/
            ├── 📄 [modelo]_hi.yft     # Modelo alta qualidade
            ├── 📄 [modelo].yft        # Modelo padrão
            ├── 📄 [modelo]_hi.ytd     # Texturas alta qualidade
            ├── 📄 [modelo].ytd        # Texturas padrão
            ├── 📄 [modelo].ycd        # Animações
            ├── 📄 [modelo].ydr        # Drawables
            └── 📁 Tuning/             # Peças de tuning
```

### SoundsPack

```
PackName-SoundsPack/
├── 📄 fxmanifest.lua              # Manifest para áudio
├── 📁 audioconfig/                # Configurações de áudio
│   ├── 📄 *.dat                   # Arquivos de dados
│   └── 📄 *.nametable             # Tabelas de nomes
└── 📁 sfx/
    └── 📁 dlc_packname_xxx/       # DLC de áudio
        ├── 📄 *.awc               # Áudio compactado
        └── 📄 *_npc.awc           # Áudio para NPCs
```

### WheelsPack

```
PackName-WheelsPack/
├── 📄 fxmanifest.lua              # Manifest para rodas
├── 📁 data/
│   ├── 📄 carcols.meta            # Definições de todas as rodas
│   └── 📄 contentunlocks.meta     # Desbloqueios de conteúdo
├── 📁 stream/
│   └── 📄 *.ydr                   # Modelos 3D das rodas
└── 📁 client/
    └── 📄 tuning.lua              # Script AddTextEntry
```

---

## 🔧 Processamento de Arquivos .META

### Merge Preservativo

O sistema realiza um merge **100% preservativo** dos arquivos `.meta`:

```
Arquivos Individuais (.meta por carro)
        │
        ▼
   ┌─────────────┐
   │  Extração    │ → Lê dados completos do XML
   │  Completa    │
   └──────┬──────┘
          │
   ┌──────▼──────┐
   │  Preservação │ → Copia valores exatamente como estão
   │  Total       │   (sem alteração de parâmetros)
   └──────┬──────┘
          │
   ┌──────▼──────┐
   │  Inserção    │ → Injeta no .meta global do pack
   │  Direta      │   nos locais corretos
   └──────┬──────┘
          │
          ▼
  Arquivo .meta Consolidado
```

### Validação de Integridade

O sistema valida automaticamente:

- ✅ **Estrutura XML** — Bem formado e compatível com FiveM
- ✅ **Campos Obrigatórios** — Todos os campos essenciais presentes
- ✅ **Referências Cruzadas** — Consistência entre arquivos `.meta`
- ✅ **IDs Únicos** — Sem conflitos de nomes ou referências

### Dados Preservados

| Categoria | O que é mantido |
|-----------|----------------|
| **Física** | Massa, tração, suspensão (handling.meta) |
| **Modificações** | Kits de tuning com IDs únicos (carcols.meta) |
| **Visuais** | Variações de cores e liveries (carvariations.meta) |
| **Áudio** | Referências de áudio originais |

---

## 🛞 Sistema de Rodas Compartilhadas

### Gerenciamento Integrado

1. **Adicionar Rodas**
   - Navegue até **"Rodas Compartilhadas"**
   - Clique **"Adicionar Rodas"**
   - Digite o nome da marca
   - Selecione os arquivos `.ydr`

2. **Configuração Automática**
   - Sistema cria estrutura automaticamente
   - Gera `carcols.meta` compartilhado
   - Cria scripts `AddTextEntry`

3. **Estrutura Gerada**
```
shared/wheels/
├── 📁 stream/[MARCA]/             # Modelos 3D
├── 📁 data/[MARCA]/               # Configurações
└── 📁 data/carcols.meta           # Arquivo único compartilhado
```

### Formato do carcols.meta

Cada roda definida precisa conter:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `wheelName` | Nome interno (= nome do `.ydr`) | `brimsvo_33` |
| `modShopLabel` | Label na mod shop (único) | `WHEEL_BRIMSVO_33` |
| `rimRadius` | Raio em metros | `0.4000` |
| `rear` | Se é roda traseira específica | `true` / `false` |

---

## 📡 API Reference

### Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/upload-files` | Upload de arquivos de veículo |
| `GET` | `/api/staged-files` | Lista arquivos em staging |
| `POST` | `/api/export` | Gera o pack FiveM final |
| `POST` | `/api/upload-wheels` | Upload de rodas compartilhadas |
| `GET` | `/api/packs` | Lista todos os packs |
| `DELETE` | `/api/packs/:id` | Remove um pack |
| `POST` | `/api/validate-meta` | Valida arquivos .meta |

### POST /api/upload-files

**Parâmetros:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `packId` | `string` | ID do pack (alfanumérico + hífens/underscores) |
| `brandName` | `string` | Nome da marca |
| `vehicleModel` | `string` | Nome do modelo |
| `files` | `multipart` | Arquivos do veículo |

**Validação:**

Nomes devem seguir: `^[a-zA-Z0-9_-]+$`

---

## 📋 Logs e Troubleshooting

### Sistema de Logs

Logs estruturados são salvos em `src/server/logs/`:
- `error.log` — Apenas erros
- `combined.log` — Todos os eventos

### Problemas Comuns

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| **Upload falha** | Arquivo não suportado | Verifique extensões permitidas |
| **Merge .meta erro** | XML malformado | Valide o arquivo XML |
| **Export incompleto** | Permissões negadas | Execute como administrador |
| **App não inicia** | Porta em uso | Configure porta alternativa |
| **Template não encontrado** | Path incorreto | Verifique `[TGS-Fivem-Pack]` |

### Logs de Diagnóstico

**Localização dos Logs:**
- **Server**: `src/server/logs/combined.log`
- **Error**: `src/server/logs/error.log`
- **Electron**: Console do desenvolvedor

**Níveis de Log:**
- `ERROR`: Erros críticos
- `WARN`: Avisos importantes
- `INFO`: Informações gerais
- `DEBUG`: Detalhes de depuração

---

## 🚀 Performance e Otimização

### Métricas de Performance

- **Startup Time**: < 5 segundos
- **File Upload**: 100MB em < 30 segundos
- **Pack Generation**: < 2 minutos para packs médios
- **Memory Usage**: < 500MB pico
- **CPU Usage**: < 25% durante operações

### Otimizações Implementadas

- **Lazy Loading** — Componentes carregados sob demanda
- **File Streaming** — Upload de grandes arquivos em chunks
- **Caching Inteligente** — Cache de templates e metadados
- **Parallel Processing** — Múltiplas operações simultâneas
- **Memory Management** — Limpeza automática de recursos

---

## 📞 Suporte

### Canais de Ajuda

- **Documentação** — Este arquivo como referência principal
- **Issues** — GitHub para bugs e features
- **Comunidade** — Discord TGS para suporte rápido
- **Email** — packmenager@tgs.dev

### Contribuição

Contribuições são bem-vindas:

1. **Fork** o repositório
2. **Branch** — `git checkout -b feature/nova-funcionalidade`
3. **Commit** — `git commit -m 'Add nova funcionalidade'`
4. **Push** — `git push origin feature/nova-funcionalidade`
5. **PR** — Pull request com descrição detalhada

---

<p align="center">
  <strong>Pack Menager — Automação Profissional para Packs FiveM</strong>
</p>
