# Assinatura Windows — TGS Launcher

O aviso **"Windows protegeu o seu PC"** / **SmartScreen** / antivírus alegando vírus acontece porque o instalador **não tem assinatura digital (Authenticode)**.

Instaladores Electron + NSIS sem certificado são bloqueados quase sempre. **Não há correção só no código** — é obrigatório assinar o `.exe` com certificado de editor de confiança.

---

## Solução definitiva: certificado de assinatura de código

### Opções recomendadas

| Opção | Custo aprox. | SmartScreen | Notas |
|-------|--------------|-------------|--------|
| **Certificado EV (Extended Validation)** | ~US$ 300–500/ano | Reputação imediata na maioria dos casos | Melhor para distribuição pública |
| **Certificado OV (Standard)** | ~US$ 100–250/ano | Reputação constrói com downloads | Mais barato; aviso some após reputação |
| **Azure Trusted Signing** | Pay-as-you-go | Bom | Conta Azure + verificação de identidade |
| **SignPath** (open source) | Grátis | Bom se aprovado | Repositório público + política de uso |

Fornecedores comuns: **SSL.com**, **Sectigo**, **DigiCert**, **Certum**.

---

## Passo 1 — Obter o certificado (.pfx)

1. Compre o certificado (OV ou EV) em nome de **TGS Community** ou empresa registada.
2. Exporte como **`.pfx`** (Personal Information Exchange) com chave privada.
3. Guarde a password em local seguro — **nunca** commite o `.pfx` no Git.

---

## Passo 2 — Configurar secrets no GitHub

No repositório do Launcher → **Settings → Secrets and variables → Actions**:

| Secret | Valor |
|--------|--------|
| `WIN_CSC_LINK` | Ficheiro `.pfx` codificado em **Base64** |
| `WIN_CSC_KEY_PASSWORD` | Password do `.pfx` |

**Variable** (opcional, recomendado após certificado ativo):

| Variable | Valor |
|----------|--------|
| `CODE_SIGNING_ENABLED` | `true` — usa `WIN_CSC_LINK` no CI e exige assinatura válida |

**Importante:** não crie `WIN_CSC_LINK` como secret/variable com um caminho de pasta. O valor deve ser o conteúdo **Base64 do ficheiro `.pfx`**, ou deixe o secret **apagado** até ter certificado.

Depois de assinar releases, altere em `src/main/main.js`:

```js
autoUpdater.verifyUpdateCodeSignature = true;
```

### Gerar Base64 no PowerShell (Windows)

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\caminho\TGS-CodeSign.pfx")) | Set-Clipboard
```

Cole o resultado no secret `WIN_CSC_LINK`.

---

## Passo 3 — Publicar release assinada

Com os secrets configurados, o workflow `.github/workflows/release.yml` assina automaticamente:

```bash
git tag v2.0.31
git push origin v2.0.31
```

Ou dispare manualmente em **Actions → Build & Release TGS Launcher**.

---

## Passo 4 — Verificar assinatura localmente

```powershell
Get-AuthenticodeSignature ".\release\TGS-Launcher-Setup.exe" | Format-List
```

Deve mostrar **Status: Valid** e o nome do editor (Publisher).

---

## Enquanto não houver certificado

1. **Submeter falso positivo à Microsoft** (grátis, ajuda mas não substitui assinatura):  
   https://www.microsoft.com/en-us/wdsi/filesubmission  
   - Tipo: **Software developer**  
   - Anexe o `.exe` e explique que é instalador Electron legítimo do TGS Launcher.

2. **Não peça aos utilizadores** para desativar o Defender — isso destrói confiança.

3. Distribua **sempre** pelo GitHub Releases oficial:  
   https://github.com/T1NG4/TGS-launcher-releases/releases

---

## Por que o antivírus reage?

Comportamentos legítimos do Launcher que heurísticas confundem com malware:

- Instalador NSIS empacota ficheiros executáveis
- Download e substituição de `.exe` (Pack/Mod Manager)
- `taskkill` para fechar apps antes de atualizar
- Auto-update via GitHub

A **assinatura digital** prova que o binário veio da TGS e não foi alterado.

---

## Checklist pós-assinatura

- [ ] `Get-AuthenticodeSignature` → Valid
- [ ] SmartScreen não bloqueia em máquina limpa (ou só aviso brando)
- [ ] Site e Discord apontam só para releases oficiais
- [ ] Nova tag publicada com workflow verde
