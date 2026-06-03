# TGS Pack Manager — Guia do usuário

Documentação pública do **TGS FiveM Pack Manager**.  
Repositório de releases: [T1NG4/TGS-pack-manager-releases](https://github.com/T1NG4/TGS-pack-manager-releases)

> **Idiomas:** [English](./DOCUMENTATION.md) · [Português (Brasil)](./DOCUMENTACAO.md)

---

## Índice

1. [Visão geral](#visão-geral)
2. [Requisitos](#requisitos)
3. [Instalação e primeiro uso](#instalação-e-primeiro-uso)
4. [Atualizações](#atualizações)
5. [Interface principal](#interface-principal)
6. [Criar e gerenciar packs](#criar-e-gerenciar-packs)
7. [Exportação de packs](#exportação-de-packs)
8. [Pasta de saída](#pasta-de-saída)
9. [FAQ](#faq)
10. [Links úteis](#links-úteis)

---

## Visão geral

O **TGS Pack Manager** automatiza a criação de packs de carros para servidores **FiveM**, seguindo a estrutura otimizada TGS:

| Recurso exportado | Conteúdo |
|-------------------|----------|
| **VehiclesPack** | Modelos, texturas, handling, vehicles.meta |
| **SoundsPack** | Áudio de motores (`.awc`, manifests) |
| **WheelsPack** | Rodas custom, `carcols.meta`, tuning |

O app deve ser iniciado pelo **TGS Launcher** (token de segurança). Abrir o `.exe` diretamente sem o Launcher mostra acesso negado na versão instalada.

---

## Requisitos

- **Windows 10/11** (64-bit)
- **~500 MB** livres na pasta de instalação (+ espaço para packs exportados)
- **TGS Launcher** instalado ([download](https://github.com/T1NG4/TGS-launcher-releases/releases/latest))
- Conexão com a internet para instalar, atualizar e carregar configuração de patrocínios na exportação

---

## Instalação e primeiro uso

### Passo a passo

1. Abra o **TGS Launcher**.
2. Selecione o modo **Pack Manager** (tema escuro).
3. Defina a pasta de instalação com **Alterar pasta** (ex.: `C:\TGS`).
4. Clique em **Instalar** e aguarde o download do portable.
5. Quando aparecer **Executar App**, clique para abrir o Pack Manager.

### Onde ficam os arquivos

```
<pasta escolhida>/
  data/
    apps/
      packManager/
        TGS-Pack-Manager-Portable.exe
        version.json
```

A pasta `output/` (packs gerados) fica junto ao runtime do app conforme a configuração na aba **Config**.

---

## Atualizações

### Pelo Launcher (recomendado)

- O Launcher compara a versão instalada (`version.json`) com a última release neste repositório.
- Se houver versão nova, **não é possível abrir** o app até clicar em **Atualizar**.
- **Feche o Pack Manager** antes de atualizar (o `.exe` não pode estar em uso).

### Pelo próprio app

- Com `latest.yml` na release, o app pode notificar update e reiniciar após o download.
- Em caso de dúvida, use sempre o **Launcher** para garantir a versão correta.

### Baixar manualmente

1. Abra [Releases](https://github.com/T1NG4/TGS-pack-manager-releases/releases/latest).
2. Baixe `TGS-Pack-Manager-Portable.exe`.
3. Substitua o arquivo na pasta `data\apps\packManager\` (app fechado).

---

## Interface principal

| Aba | Função |
|-----|--------|
| **Packs** | Listar, criar e editar packs |
| **Brands** | Marcas dentro do pack atual |
| **Wheels** | Rodas compartilhadas / carcols |
| **Sound** | Configurações de áudio |
| **Logs** | Diagnóstico de operações |
| **Config** | Idioma, pasta de packs, preferências |

**Rodapé**

- Indicador de conexão / update (versão vs GitHub)
- **TGS_Pack_Docs** — abre este guia no navegador
- **GitHub** — abre a página pública deste repositório (releases + documentação)

---

## Criar e gerenciar packs

1. **Create pack** — nome e estrutura base TGS.
2. Adicione **brands** e **vehicles**.
3. Envie arquivos (`.yft`, `.ytd`, `.meta`, etc.) por drag & drop ou seletor.
4. Use o editor de meta XML integrado quando necessário.
5. Configure som e rodas nas abas dedicadas.

Os dados de trabalho ficam em staging local até exportar.

---

## Exportação de packs

1. Abra o pack desejado.
2. Clique em **Export Pack**.
3. **Patrocínio (ads):** antes do export, pode ser necessário ver um anúncio completo (suporta o projeto).
   - Se aparecer erro ao carregar ads, verifique a internet e tente **Retry**.
   - Configuração remota gerenciada pela TGS (`TGS-ads`).
4. Após concluir o anúncio, confirme **Export Pack**.
5. Os recursos são gerados em `output/` (Vehicles, Sounds, Wheels).

---

## Pasta de saída

- Configurável na aba **Config** (*Packs directory*).
- Estrutura típica após export:

```
output/
  <nome-do-pack>/
    TGS-VehiclesPack/
    TGS-SoundsPack/
    TGS-WheelsPack/
```

Copie essas pastas para o `resources` do seu servidor FiveM.

---

## FAQ

**O app não abre pelo Launcher**  
Verifique se a instalação terminou e se não há update pendente. Confira o log no Launcher (**Ver log**).

**Erro ao atualizar — arquivo em uso**  
Feche completamente o Pack Manager e tente de novo.

**Export bloqueado — “Could not load ads”**  
Atualize para a versão mais recente (v2.0.4+). Requer conexão com a internet na primeira exportação após abrir o modal.

**Acesso negado ao abrir o .exe sozinho**  
Use sempre o **TGS Launcher** → Executar App.

**Onde está o código-fonte?**  
[github.com/T1NG4/TGS-pack-manager](https://github.com/T1NG4/TGS-pack-manager)

---

## Links úteis

| Recurso | URL |
|---------|-----|
| Releases (download) | https://github.com/T1NG4/TGS-pack-manager-releases/releases |
| Documentação (English) | https://github.com/T1NG4/TGS-pack-manager-releases/blob/main/DOCUMENTATION.md |
| Documentação (PT-BR) | https://github.com/T1NG4/TGS-pack-manager-releases/blob/main/DOCUMENTACAO.md |
| TGS Launcher | https://github.com/T1NG4/TGS-launcher-releases/releases |
| Código-fonte Pack Manager | https://github.com/T1NG4/TGS-pack-manager |
| Site TGS Community | https://tgs.gamer.gd/pt/pack-manager/ |

---

*Última atualização da documentação: alinhada com a release **v2.1.0**.*
