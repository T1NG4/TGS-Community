# TGS Pack Manager — Guia do usuário

> **Idiomas:** [English](./DOCUMENTATION.md) · [Português (Brasil)](./DOCUMENTACAO.md)

---

## Índice

1. [Como funciona](#como-funciona)
2. [O que você precisa](#o-que-você-precisa)
3. [Instalar e abrir o app](#instalar-e-abrir-o-app)
4. [Usando o Pack Manager passo a passo](#usando-o-pack-manager-passo-a-passo)
5. [Abas principais](#abas-principais)
6. [Exportar o pack para o servidor](#exportar-o-pack-para-o-servidor)
7. [Atualizações](#atualizações)
8. [FAQ](#faq)
9. [Links úteis](#links-úteis)

---

## Como funciona

O **TGS Pack Manager** ajuda você a montar **packs de veículos para FiveM** sem organizar pastas e arquivos na mão.

Na prática:

1. Você **cria um pack** e dá um nome.
2. Adiciona **marcas** e **veículos** e envia os arquivos dos carros (arrastar e soltar ou botão de arquivo).
3. Configura **sons de motor** e **rodas** quando precisar.
4. Clica em **Export Pack** e o app gera pastas prontas para o servidor.
5. Copia essas pastas para o **resources** do seu servidor FiveM e usa o pack.

Cada exportação pode incluir:

| Parte | Para que serve |
|-------|----------------|
| **Veículos** | Carros, modelos e configurações dos veículos |
| **Sons** | Áudio customizado de motor |
| **Rodas** | Rodas custom e tuning |

> **Importante:** os apps TGS (incluindo o Pack Manager) devem ser abertos pelo **TGS Launcher** — use **Executar App** depois de instalar.

---

## O que você precisa

- **Windows 10 ou 11**
- **TGS Launcher** instalado ([download](https://github.com/T1NG4/TGS-launcher-releases/releases/latest))
- Espaço em disco para o app e para os packs exportados
- Internet para instalar, atualizar e exportar (quando o patrocínio estiver ativo)

---

## Instalar e abrir o app

1. Abra o **TGS Launcher**.
2. Selecione **Pack Manager**.
3. Escolha a pasta de instalação em **Alterar pasta**, se quiser outro local.
4. Clique em **Instalar** e aguarde terminar.
5. Clique em **Executar App** para abrir o Pack Manager.

Sempre abra o app pelo Launcher — não execute o portable sozinho.

---

## Usando o Pack Manager passo a passo

### 1. Criar um pack

Na aba **Packs**, clique em **Create pack**, escolha um nome e confirme. Esse pack é o seu espaço de trabalho para um projeto de servidor (ou uma coleção de carros).

### 2. Adicionar marcas e veículos

- Abra o pack e vá em **Brands** para organizar fabricantes ou grupos.
- Adicione **vehicles** em cada marca.
- Envie arquivos com **arrastar e soltar** ou pelo botão de arquivo.

### 3. Ajustar som e rodas (opcional)

- **Sound** — configure o áudio de motor do pack.
- **Wheels** — gerencie rodas usadas por vários veículos.

### 4. Exportar

- Abra o pack e clique em **Export Pack**.
- Se pedir, conclua o **passo de patrocínio** (apoia o projeto) e confirme a exportação.
- Ao terminar, o app mostra onde as pastas foram salvas. Você pode mudar o local em **Config** (*Packs directory*).

### 5. Usar no servidor FiveM

Copie as pastas exportadas para o **resources** do servidor e adicione no `server.cfg` como qualquer outro resource.

---

## Abas principais

| Aba | O que você faz aqui |
|-----|---------------------|
| **Packs** | Ver todos os packs, criar novos, abrir um para trabalhar |
| **Brands** | Marcas e veículos do pack atual |
| **Wheels** | Rodas compartilhadas entre veículos |
| **Sound** | Configurações de som do motor |
| **Logs** | Ações recentes e mensagens se algo der errado |
| **Config** | Idioma, onde salvar exportações, outras preferências |

No rodapé você pode abrir **este guia** (TGS_Pack_Docs) ou a **página de releases** no GitHub.

---

## Exportar o pack para o servidor

Depois da exportação você recebe pastas separadas de **veículos**, **sons** e **rodas** (quando configurou). Elas já vêm organizadas para FiveM — basta copiar para o servidor.

**Dica:** exporte de novo depois de alterar veículos ou meta para o servidor sempre ter a versão mais recente.

Se a exportação falhar:

- Verifique a internet e clique em **Retry**.
- Atualize o Pack Manager pelo **Launcher** se estiver em versão antiga.
- Confira se o pack tem os arquivos necessários dos veículos adicionados.

---

## Atualizações

O jeito mais simples:

1. Abra o **TGS Launcher**.
2. Se aparecer **Atualizar** no Pack Manager, feche o app por completo antes.
3. Clique em **Atualizar** no Launcher e depois em **Executar App**.

O Launcher mantém o Pack Manager na versão mais recente. Você também pode ver as novidades em [Releases](https://github.com/T1NG4/TGS-pack-manager-releases/releases/latest).

---

## FAQ

**O Pack Manager não abre**  
Instale ou atualize pelo TGS Launcher. Se aparecer **Atualizar**, atualize primeiro e use **Executar App**.

**Fechei o app mas o update diz que o arquivo está em uso**  
Feche o Pack Manager por completo (inclusive na bandeja) e tente de novo.

**Exportação travada ou “Could not load ads”**  
Verifique a internet, clique em **Retry** e use a versão mais recente pelo Launcher.

**Posso abrir o app sem o Launcher?**  
Não. Use **TGS Launcher** → **Executar App**.

**Onde pedir ajuda?**  
[Discord TGS Community](https://discord.gg/cYv7W4XCXv) · [tgs.gamer.gd/pt/pack-manager/](https://tgs.gamer.gd/pt/pack-manager/)

---

## Links úteis

| Recurso | URL |
|---------|-----|
| TGS Launcher (instalar apps) | https://github.com/T1NG4/TGS-launcher-releases/releases/latest |
| Releases do Pack Manager | https://github.com/T1NG4/TGS-pack-manager-releases/releases |
| Documentação (English) | https://github.com/T1NG4/TGS-pack-manager-releases/blob/main/DOCUMENTATION.md |
| Documentação (PT-BR) | https://github.com/T1NG4/TGS-pack-manager-releases/blob/main/DOCUMENTACAO.md |
| Site TGS Community | https://tgs.gamer.gd/pt/pack-manager/ |

---

*Guia do usuário do TGS Pack Manager.*
