# Guia Completo de Setup no GitHub — Ecossistema TGS

Configuração completa do TGS Launcher + Apps com auto-update via GitHub Releases.

---

## Estrutura de Repositórios

São **SEIS repositórios** no GitHub.

### Repositórios Privados (Código Fonte)

| App | Repositório privado |
|---|---|
| Launcher | `T1NG4/tgs-launcher` |
| Pack Manager | `T1NG4/TGS-pack-manager` |
| Mod Manager | `T1NG4/TGS-mod-manager` |

### Repositórios Públicos (Releases / Instaladores)

| App | Repositório público |
|---|---|
| Launcher | `T1NG4/TGS-launcher-releases` |
| Pack Manager | `T1NG4/TGS-pack-manager-releases` |
| Mod Manager | `T1NG4/TGS-mod-manager-releases` |

> Atenção ao casing: nos repositórios públicos, o prefixo é **`TGS-...`** (T maiúsculo). Confira que `package.json` e workflows usem o mesmo nome.

---

## Estratégia de Distribuição

| Componente | Formato | Auto-update |
|---|---|---|
| **Launcher** | Instalador **NSIS** (`TGS Launcher Setup X.Y.Z.exe`) | `electron-updater` aponta para `TGS-launcher-releases` |
| **Pack Manager** | **Portable EXE** (`TGS-Pack-Manager-Portable.exe`) | `electron-updater` aponta para `TGS-pack-manager-releases` |
| **Mod Manager** | **Portable EXE** (`TGS-Mod-Manager-Portable.exe`) | `electron-updater` aponta para `TGS-mod-manager-releases` |

**Por que portable para os apps?**

- O Launcher já é o instalador — apps portable evitam UAC duplo
- O Launcher controla 100% do ciclo de vida (instalar/atualizar/remover) em pasta gerenciada
- Auto-update substitui o `.exe` portable in-place

**Estrutura do diretório de instalação dos apps:**

```
<installPath>/
└── data/                      (oculto no Windows)
    └── apps/
        ├── packManager/
        │   ├── TGS-Pack-Manager-Portable.exe
        │   ├── version.json
        │   └── config.json
        └── modManager/
            ├── TGS-Mod-Manager-Portable.exe
            ├── version.json
            └── config.json
```

---

## Fluxo de Auto-Update

```
Push tag vX.Y.Z (privado)
        |
        v
GitHub Actions (release.yml)
        |
        v
electron-builder --publish always
        |
        v
Release publicada em <repo>-releases (.exe + latest.yml + .blockmap)
        |
        v
electron-updater no app cliente detecta nova versão -> baixa -> instala
```

---

## Passo 1: Criar Personal Access Token (PAT)

`electron-builder` precisa de um token com permissão de escrita no **repositório público de releases** (porque o código vive num repo privado e publica em outro).

1. Acesse [github.com/settings/tokens](https://github.com/settings/tokens) → **Generate new token (classic)**
2. Marque o escopo **`repo`** (write completo)
3. Defina expiração (recomendado: 1 ano)
4. Copie o token gerado (você só verá uma vez)

> Alternativa: PAT fino (fine-grained) com permissão `Contents: Read and write` apenas nos 3 repositórios `*-releases`.

---

## Passo 2: Adicionar o PAT como Secret no monorepo

No repositório **`T1NG4/TGS-Community`** (monorepo — os workflows de release rodam aqui):

1. Abra [github.com/T1NG4/TGS-Community/settings/secrets/actions](https://github.com/T1NG4/TGS-Community/settings/secrets/actions)
2. **New repository secret**
3. **Name**: `RELEASES_REPO_TOKEN` (exatamente este nome)
4. **Secret**: cole o PAT criado no passo anterior

> Sem esse secret, o build compila mas falha ao publicar: `GitHub Personal Access Token is not set` / `GH_TOKEN` vazio nos logs.

Repositórios antigos (`tgs-launcher`, etc.) **não** disparam mais os workflows — só o monorepo precisa deste secret (a menos que ainda uses Actions nesses repos).

---

## Passo 3: Habilitar GitHub Actions

Para cada repositório privado:

1. **Settings → Actions → General**
2. Selecione **"Allow all actions and reusable workflows"**
3. Em **Workflow permissions** marque **"Read and write permissions"**
4. **Save**

---

## Passo 4: Criar os Repositórios Públicos (vazios)

Para cada `*-releases`:

1. **New repository** → nome exato (com casing certo)
2. Marque **Public**
3. **NÃO** adicione README/license/gitignore (deixe completamente vazio)
4. **Create repository**

> Não é necessário fazer push de nada — o `electron-builder` cria a primeira release sozinho.

---

## Passo 5: Verificar `package.json`

Os 3 apps já estão configurados. Confirme:

### Launcher — `MainCode/Launcher/package.json`

```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "T1NG4",
        "repo": "TGS-launcher-releases",
        "releaseType": "release"
      }
    ],
    "win": { "target": ["nsis"] }
  }
}
```

### Pack Manager — `MainCode/Pack Menager/package.json`

```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "T1NG4",
        "repo": "TGS-pack-manager-releases",
        "releaseType": "release"
      }
    ],
    "win": { "target": ["portable"] },
    "portable": { "artifactName": "TGS-Pack-Manager-Portable.exe" }
  }
}
```

### Mod Manager — `MainCode/Mod Menager/client/package.json`

```json
{
  "build": {
    "win": {
      "target": ["portable"],
      "publish": [
        {
          "provider": "github",
          "owner": "T1NG4",
          "repo": "TGS-mod-manager-releases"
        }
      ]
    },
    "portable": { "artifactName": "TGS-Mod-Manager-Portable.exe" }
  }
}
```

---

## Passo 6: Publicar a Primeira Release

### Método A — Tag (recomendado)

```bash
# Launcher
git tag v2.0.3
git push origin v2.0.3

# Pack Manager
cd "MainCode/Pack Menager"
git tag v2.0.0
git push origin v2.0.0

# Mod Manager
cd "MainCode/Mod Menager"
git tag v1.0.0
git push origin v1.0.0
```

### Método B — Disparo manual

1. **Actions** do repositório privado
2. **Build & Release ...** → **Run workflow**
3. Digite a versão (ex: `v1.0.0`)
4. **Run workflow**

---

## Verificação Final

### 1. Workflow concluído com sucesso

- Em **Actions** do repositório privado, o job deve estar verde
- Tempo médio: 2–5 minutos

### 2. Release publicada no repositório público

Em `https://github.com/T1NG4/<app>-releases/releases` deve haver:

- Launcher: `TGS Launcher Setup X.Y.Z.exe` + `latest.yml` + `*.blockmap`
- Pack Manager: `TGS-Pack-Manager-Portable.exe` + `latest.yml`
- Mod Manager: `TGS-Mod-Manager-Portable.exe` + `latest.yml`

### 3. Auto-update funcionando

1. Instale a versão anterior do app
2. Crie a nova versão (tag)
3. Aguarde o workflow concluir
4. Abra o app — 5 segundos depois deve detectar a nova versão

---

## Comandos Úteis de Diagnóstico

```bash
# Ver tags locais
git tag

# Ver tags remotas
git ls-remote --tags origin

# Apagar tag local
git tag -d v1.0.0

# Apagar tag remota (recria release ao re-push)
git push origin --delete v1.0.0
```

**Logs do auto-update no cliente** ficam em:

| App | Caminho |
|---|---|
| Launcher | `%APPDATA%\TGS Launcher\logs\` |
| Pack Manager | Console (DevTools) |
| Mod Manager | Console (DevTools) |

---

## Troubleshooting

### "404 Not Found" durante o publish

→ Verifique o secret `RELEASES_REPO_TOKEN`: precisa ter permissão `repo` no repositório público.

### "Resource not accessible by integration"

→ O PAT expirou ou perdeu permissão. Gere outro em [github.com/settings/tokens](https://github.com/settings/tokens) e atualize o secret.

### Auto-update não detecta nova versão

- Confirme que `owner` + `repo` em `package.json` batem **exatamente** (incluindo casing) com o repositório público
- O auto-update **só funciona em build de produção** (não em `npm run dev`)
- Verifique se a versão no `package.json` é **menor** que a publicada na release
- Repositório público precisa estar realmente **public** (não interno)

### "No published versions on GitHub" no `electron-updater`

→ Provavelmente a primeira release ainda não foi publicada, ou os assets não incluem o `latest.yml`. Verifique a release pública.

### Token vencido / vai vencer

→ Regenere o PAT em [github.com/settings/tokens](https://github.com/settings/tokens), copie e atualize o secret `RELEASES_REPO_TOKEN` em **cada um dos 3 repositórios privados**.

---

## Resumo

1. Crie 3 repositórios privados (código) + 3 públicos (releases)
2. Gere 1 PAT com escopo `repo`
3. Adicione o PAT como secret `RELEASES_REPO_TOKEN` em cada repo privado
4. Habilite Actions com permissão de escrita
5. `git tag vX.Y.Z && git push origin vX.Y.Z` → release automática
6. Launcher e apps detectam e baixam updates automaticamente
