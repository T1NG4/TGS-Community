# 🔄 Configuração do Auto-Update — TGS Launcher

Guia rápido para configurar o sistema de atualização automática via GitHub Releases.

---

## ⚙️ Passo 1: Criar Repositório Público de Releases

1. No GitHub, crie um novo repositório **público** (ex: `tgs-launcher-releases`)
2. Não precisa adicionar código — apenas o repositório vazio

---

## ⚙️ Passo 2: Configurar `package.json`

Edite `MainCode/Launcher/package.json` e substitua os placeholders:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "SUA-ORG-OU-USUARIO",  // <-- substitua aqui
      "repo": "tgs-launcher-releases",  // <-- nome do repo criado
      "releaseType": "release"
    }
  }
}
```

**Exemplo real:**
```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "TGS-Studio",
      "repo": "tgs-launcher-releases",
      "releaseType": "release"
    }
  }
}
```

---

## ⚙️ Passo 3: Workflow de CI/CD

O workflow já está configurado em `.github/workflows/release.yml`.

Para usá-lo, você precisa:

1. **Push de tag** (recomendado):
   ```bash
   git tag v2.0.5
   git push origin v2.0.5
   ```

2. **Ou execução manual**:
   - Vá em Actions → Release Workflow → Run workflow
   - Informe a versão (ex: `v2.0.5`)

---

## 🚀 Como Funciona (Fluxo Completo)

```
1. Desenvolvedor faz push da tag vX.Y.Z
           ↓
2. GitHub Actions builda o app (electron-builder)
           ↓
3. Artefatos publicados no repo público de releases:
   - TGS Launcher Setup X.Y.Z.exe (NSIS)
   - latest.yml (feed de versão)
   - *.blockmap (delta download, quando existir)
           ↓
4. Launcher já instalado checa por updates na inicialização
           ↓
5. Se nova versão detectada → baixa automaticamente
           ↓
6. Usuário vê: "Update pronto → Reiniciar e Atualizar"
           ↓
7. Usuário clica → app reinicia na nova versão
```

---

## 📋 Checklist de Teste

Antes de publicar a primeira release:

- [ ] Repositório público criado
- [ ] `package.json` configurado com owner/repo corretos
- [ ] Workflow commitado na branch principal
- [ ] Teste local: `npm run build` gera o `.exe` sem erros
- [ ] Primeira release publicada manualmente (para validar)

---

## 🔧 Solução de Problemas

### "Não está encontrando updates"
Verifique se:
- O `owner` e `repo` estão corretos no `package.json`
- O repositório de releases é **público**
- A release foi publicada (não draft)

### "Erro ao baixar update"
- Verifique conexão com internet
- Veja logs em `%APPDATA%\TGS Launcher\logs\` (pasta *userData* do produto no Windows)

### "Não aparece notificação de update"
- O auto-update só funciona em build de produção (não em `npm run dev`)
- Faça build real: `npm run build`

---

## 📚 Canais de Release (Opcional)

Para suportar versões beta:

1. Crie tag com sufixo: `git tag v1.1.0-beta.1`
2. O workflow detecta automaticamente como `prerelease`
3. Usuários com versão beta instalada recebem updates beta

Para alternar entre canais, o usuário precisa reinstalar com a versão desejada.
