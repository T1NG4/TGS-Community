# 🚀 Como Adicionar Novas Versões - Guia Completo

## 📋 Visão Geral

Este guia ensina como adicionar novas versões para os aplicativos TGS (Launcher, Pack Manager, Mod Manager) usando o sistema de auto-update configurado.

## 🎯 Fluxo de Versionamento

```
Desenvolvimento → Commit → Tag → GitHub Actions → Release → Auto-Update
```

## 📦 Estrutura de Versões

### **Formato de Versionamento**
- **Stable**: `v1.0.0`, `v1.1.0`, `v2.0.0`
- **Beta**: `v1.0.1-beta.1`, `v2.1.0-beta.2`
- **Alpha**: `v1.0.1-alpha.1`, `v2.0.0-alpha.3`

### **Regras de Versionamento**
- **Major**: Mudanças que quebram compatibilidade
- **Minor**: Novas funcionalidades compatíveis
- **Patch**: Correções de bugs e melhorias

---

## 🔧 Passo a Passo - Adicionar Nova Versão

### **Passo 1: Fazer as Alterações no Código**

```bash
# Navegar para o diretório do app
cd "MainCode/Launcher"        # ou "MainCode/Pack Menager" ou "MainCode/Mod Menager"

# Fazer as alterações necessárias
# Editar arquivos, adicionar funcionalidades, corrigir bugs
```

### **Passo 2: Commit das Alterações**

```bash
# Adicionar arquivos modificados
git add .

# Fazer commit com mensagem descritiva
git commit -m "feat: Adicionar nova funcionalidade X

- Implementar feature Y
- Corrigir bug Z
- Melhorar performance"
```

### **Passo 3: Enviar para GitHub**

```bash
# Enviar para o repositório remoto
git push origin main
```

### **Passo 4: Criar Tag da Versão**

```bash
# Criar tag da nova versão
git tag v1.0.1

# Enviar tag para GitHub
git push origin v1.0.1
```

### **Passo 5: Monitorar GitHub Actions**

**Acessar o workflow:**
- **Launcher**: https://github.com/T1NG4/tgs-launcher/actions
- **Pack Menager**: https://github.com/T1NG4/TGS-pack-manager/actions
- **Mod Menager**: https://github.com/T1NG4/TGS-mod-manager/actions

**O workflow irá:**
1. 🔍 Detectar a tag automaticamente
2. 🔨 Compilar o aplicativo
3. 📦 Criar o instalador (.exe)
4. 🚀 Publicar no repositório de releases
5. 📡 Disponibilizar para auto-update

---

## 🎮 Exemplos Práticos

### **Exemplo 1: Correção de Bug (Patch)**

```bash
# 1. Corrigir o bug
# Editar o arquivo com a correção

# 2. Commit
git add .
git commit -m "fix: Corrigir erro de login

- Resolver problema de autenticação
- Melhorar mensagem de erro"

# 3. Push
git push origin main

# 4. Tag
git tag v1.0.1
git push origin v1.0.1
```

### **Exemplo 2: Nova Funcionalidade (Minor)**

```bash
# 1. Implementar nova funcionalidade
# Adicionar código, testar

# 2. Commit
git add .
git commit -m "feat: Adicionar tema escuro

- Implementar switch de tema
- Adicionar cores personalizadas
- Salvar preferências do usuário"

# 3. Push
git push origin main

# 4. Tag
git tag v1.1.0
git push origin v1.1.0
```

### **Exemplo 3: Versão Beta**

```bash
# 1. Implementar funcionalidade experimental
# Adicionar código, testar basicamente

# 2. Commit
git add .
git commit -m "feat: Nova dashboard (beta)

- Interface redesenhada
- Gráficos em tempo real
- Funcionalidades básicas"

# 3. Push
git push origin main

# 4. Tag Beta
git tag v2.0.0-beta.1
git push origin v2.0.0-beta.1
```

---

## 🔄 Execução Manual do Workflow

Se o workflow não rodar automaticamente:

### **Via Interface GitHub**

1. **Acessar**: https://github.com/T1NG4/[app-name]/actions
2. **Clicar** no workflow "Build & Release"
3. **Clicar** em "Run workflow"
4. **Digitar** a versão (ex: `v1.0.1`)
5. **Clicar** em "Run workflow"

### **Via Command Line**

```bash
# Re-executar workflow manualmente (se necessário)
# Acesse a interface do GitHub para executar manualmente
```

---

## 📊 Verificar Releases

### **Acessar Releases Públicas**

- **Launcher**: https://github.com/T1NG4/TGS-launcher-releases/releases
- **Pack Menager**: https://github.com/T1NG4/TGS-pack-manager-releases/releases
- **Mod Menager**: https://github.com/T1NG4/TGS-mod-manager-releases/releases

### **Arquivos gerados (por tipo)**

**TGS Launcher** (instalador NSIS):

- `TGS Launcher Setup X.Y.Z.exe`
- `latest.yml`, `*.blockmap` (quando o builder os publicar)

**Pack Manager / Mod Manager** (portáveis usados pelo hub e pelo auto-update interno):

- `TGS-Pack-Manager-Portable.exe` ou `TGS-Mod-Manager-Portable.exe`
- `latest.yml` na release pública correspondente

O hub copia os portáveis para `<installPath>\data\apps\packManager\` ou `\modManager\` (ver [DOCUMENTACAO_LAUNCHER.md](DOCUMENTACAO_LAUNCHER.md)).

---

## 🧪 Testar Auto-Update

### **Processo de Teste**

1. **Instalar versão anterior** (ex: v1.0.0)
2. **Criar nova versão** (ex: v1.0.1)
3. **Aguardar build** (2-5 minutos)
4. **Abrir aplicativo instalado**
5. **Verificar notificação** de update
6. **Testar download** e instalação

### **Logs de Auto-Update**

**Verificar console do aplicativo:**
```javascript
// Logs esperados
[AutoUpdate] Configurando verificação de updates...
[AutoUpdate] Update disponível: v1.0.1
[AutoUpdate] Progresso: 25%
[AutoUpdate] Update baixado - pronto para instalar
```

---

## 🛠️ Comandos Úteis

### **Gerenciamento de Tags**

```bash
# Listar tags locais
git tag

# Listar tags remotas
git ls-remote --tags origin

# Deletar tag local
git tag -d v1.0.1

# Deletar tag remota
git push origin --delete v1.0.1

# Criar tag anotada com mensagem
git tag -a v1.0.1 -m "Release versão 1.0.1"
```

### **Verificar Status**

```bash
# Verificar últimos commits
git log --oneline -5

# Verificar branches
git branch -v

# Verificar status
git status
```

---

## 🚨 Troubleshooting

### **Workflow não executa**

**Causas comuns:**
- GitHub Actions desabilitado
- Permissões insuficientes
- Erro de sintaxe no workflow

**Soluções:**
1. Habilitar Actions em Settings → Actions → General
2. Verificar se o workflow está correto
3. Executar manualmente

### **Release não é criada**

**Causas comuns:**
- Nome do repositório incorreto
- Token sem permissões
- Erro no build

**Soluções:**
1. Verificar configuração do `package.json`
2. Verificar secrets do repositório
3. Analisar logs do workflow

### **Auto-update não funciona**

**Causas comuns:**
- Versão não publicada
- Configuração incorreta
- Rede bloqueada

**Soluções:**
1. Verificar se a release existe
2. Testar com `--dev=false`
3. Verificar firewall

---

## 📋 Checklist de Release

### **Antes de Publicar**

- [ ] Código testado e funcional
- [ ] Commits com mensagens claras
- [ ] Versão seguindo semântica
- [ ] GitHub Actions habilitados
- [ ] Configuração correta no `package.json`

### **Após Publicar**

- [ ] Workflow executou com sucesso
- [ ] Release criada no repositório público
- [ ] Instalador disponível para download
- [ ] Auto-update funcionando
- [ ] Logs sem erros

---

## 🎯 Dicas de Boas Práticas

### **Versionamento**

- Use **versionamento semântico**
- Crie **tags para cada release**
- Mantenha **consistência entre apps**

### **Commits**

- Use **mensagens descritivas**
- Faça **commits atômicos**
- Mantenha **histórico limpo**

### **Releases**

- **Teste antes de publicar**
- **Monitore os workflows**
- **Verifique o auto-update**

---

## 📞 Suporte

### **Recursos Úteis**

- **GitHub Actions Docs**: https://docs.github.com/actions
- **Electron Builder**: https://www.electron.build/
- **Auto-updater Guide**: https://www.electronjs.org/docs/latest/api/auto-updater

### **Logs e Debug**

- **Workflow Logs**: GitHub → Actions → [workflow-name]
- **App Console**: F12 → Console (modo desenvolvimento)
- **Electron Logs**: `%APPDATA%\TGS Launcher\logs\` (hub; cada app pode usar outra pasta)

---

## 📌 Versões recentes no GitHub (maio 2026)

| App | Tag publicada | Notas principais |
|-----|---------------|------------------|
| **Launcher** | `v2.0.5` | Hub bloqueado se o Launcher estiver desatualizado; apps só abrem na versão da release. |
| **Pack Menager** | `v2.0.5` | Footer docs/GitHub no navegador; v2.0.4 trouxe ads + `latest.yml` no CI. |

Repositórios de **código** (privados): `tgs-launcher` (monorepo), `TGS-pack-manager`, `TGS-mod-manager`.  
Repositórios de **releases** (públicos): `TGS-launcher-releases`, `TGS-pack-manager-releases`, `TGS-mod-manager-releases`.  
Config de anúncios (Pack): branch `main` em `T1NG4/TGS-ads` (`pack-manager.json`).

Documentação privada (este monorepo): `DOCUMENTACAO_*.md`, `README.md`.  
Documentação pública do Pack: `MainCode/Pack Menager/releases-public/` → sincronizada pelo workflow de release.

---

## 🎉 Conclusão

Com este guia, você pode facilmente adicionar novas versões para qualquer aplicativo TGS:

1. **Desenvolva** as alterações
2. **Comite** o código
3. **Tag** a versão
4. **Push** para GitHub
5. **Monitore** o workflow
6. **Teste** o auto-update

O sistema está totalmente automatizado e pronto para uso! 🚀
