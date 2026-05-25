# TGS Pack Manager — Guia do utilizador

Documentação pública do **TGS FiveM Pack Manager**.  
Repositório de releases: [T1NG4/TGS-pack-manager-releases](https://github.com/T1NG4/TGS-pack-manager-releases)

---

## Índice

1. [Visão geral](#visão-geral)
2. [Requisitos](#requisitos)
3. [Instalação e primeiro uso](#instalação-e-primeiro-uso)
4. [Atualizações](#atualizações)
5. [Interface principal](#interface-principal)
6. [Criar e gerir packs](#criar-e-gerir-packs)
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
- Ligação à internet para instalar, atualizar e carregar configuração de patrocínios na exportação

---

## Instalação e primeiro uso

### Passo a passo

1. Abra o **TGS Launcher**.
2. Selecione o modo **Pack Manager** (tema escuro).
3. Defina a pasta de instalação com **Alterar pasta** (ex.: `C:\TGS`).
4. Clique em **Instalar** e aguarde o download do portable.
5. Quando aparecer **Executar App**, clique para abrir o Pack Manager.

### Onde ficam os ficheiros

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
2. Descarregue `TGS-Pack-Manager-Portable.exe`.
3. Substitua o ficheiro na pasta `data\apps\packManager\` (app fechado).

---

## Interface principal

| Aba | Função |
|-----|--------|
| **Packs** | Listar, criar e editar packs |
| **Brands** | Marcas dentro do pack atual |
| **Wheels** | Rodas partilhadas / carcols |
| **Sound** | Configurações de áudio |
| **Logs** | Diagnóstico de operações |
| **Config** | Idioma, pasta de packs, preferências |

**Rodapé**

- Indicador de ligação / update (versão vs GitHub)
- **TGS_Pack_Docs** — abre este guia no navegador
- **GitHub** — abre a página pública deste repositório (releases + documentação)

---

## Criar e gerir packs

1. **Create pack** — nome e estrutura base TGS.
2. Adicione **brands** e **vehicles**.
3. Faça upload de ficheiros (`.yft`, `.ytd`, `.meta`, etc.) por drag & drop ou seletor.
4. Use o editor de meta XML integrado quando necessário.
5. Configure som e rodas nas abas dedicadas.

Os dados de trabalho ficam em staging local até exportar.

---

## Exportação de packs

1. Abra o pack desejado.
2. Clique em **Export Pack**.
3. **Patrocínio (ads):** antes do export, pode ser necessário ver um anúncio completo (suporta o projeto).
   - Se aparecer erro ao carregar ads, verifique internet e tente **Retry**.
   - Configuração remota gerida pela TGS (`TGS-ads`).
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

Copie estas pastas para o `resources` do seu servidor FiveM.

---

## FAQ

**O app não abre pelo Launcher**  
Verifique se a instalação terminou e se não há update pendente. Confira o log no Launcher (**Ver log**).

**Erro ao atualizar — ficheiro em uso**  
Feche completamente o Pack Manager e tente de novo.

**Export bloqueado — “Could not load ads”**  
Atualize para a versão mais recente (v2.0.4+). Requer ligação à internet na primeira exportação após abrir o modal.

**Acesso negado ao abrir o .exe sozinho**  
Use sempre o **TGS Launcher** → Executar App.

**Onde está o código-fonte?**  
[github.com/T1NG4/TGS-pack-manager](https://github.com/T1NG4/TGS-pack-manager)

---

## Links úteis

| Recurso | URL |
|---------|-----|
| Releases (download) | https://github.com/T1NG4/TGS-pack-manager-releases/releases |
| Documentação (este ficheiro) | https://github.com/T1NG4/TGS-pack-manager-releases/blob/main/DOCUMENTACAO.md |
| TGS Launcher | https://github.com/T1NG4/TGS-launcher-releases/releases |
| Código-fonte Pack Manager | https://github.com/T1NG4/TGS-pack-manager |

---

*Última atualização da documentação: alinhada com a release **v2.0.4**.*
