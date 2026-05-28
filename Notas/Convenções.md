# Convenções — Vault TGS

## Pastas

| Local | Uso |
|-------|-----|
| `Notas/` | Índices, MOCs, specs, logs (Obsidian) |
| `TGS Launcher/docs/` | Documentação técnica do monorepo |
| `TGS Site/docs/` | Documentação do site |
| `*.canvas` (raiz) | Diagramas de fluxo |

## Nomes de notas

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| MOC | `MOC - <tema>` | `MOC - Launcher` |
| Spec | `Spec - <feature>` | `Spec - Export pack` |
| ADR | `ADR - <decisão> - YYYY-MM-DD` | `ADR - Releases públicas - 2026-05-28` |
| Bug | `Bug - <sintoma>` | `Bug - EBUSY ao executar` |
| Log | `Log - YYYY-MM-DD` | `Log - 2026-05-28` |

## Tags sugeridas

`#launcher` `#pack` `#mod` `#site` `#release` `#bug` `#spec`

## Links

- Para docs nos repos: use caminho relativo Markdown, ex. `[Doc](../TGS%20Launcher/docs/DOCUMENTACAO_LAUNCHER.md)`
- Entre notas do vault: `[[Nome da nota]]` ou links Markdown

## Workflow diário

1. Ideias rápidas → nota em `Notas/` ou inbox mental
2. Trabalho real → Spec ou Bug + link no MOC correspondente
3. Fim do dia → `Log - YYYY-MM-DD` (5 linhas: feito / pendente / próximo)
