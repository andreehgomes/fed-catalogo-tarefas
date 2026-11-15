# Fórum — Miniprojeto de DevOps com IA Generativa

Curso 14 — Manutenção, DevOps e Operações com GenAI (Unidade 5).
Prazo: segunda-feira, 16/11/2026, às 12h.

## Conteúdo

| Arquivo | Descrição |
|---|---|
| [post-forum.md](post-forum.md) | Texto para publicação no fórum |
| [evidencias/](evidencias/) | Prints e logs do GitHub Actions |

## Laboratório

O código fica em [`labs/devops-genai-lab/`](../../../labs/devops-genai-lab/)
e o pipeline em
[`.github/workflows/devops-genai-lab.yml`](../../../.github/workflows/devops-genai-lab.yml).

**Adaptação:** o roteiro original usa GitLab CI/CD; este lab foi implementado em
GitHub Actions. O mapeamento dos conceitos:

| GitLab CI/CD | GitHub Actions |
|---|---|
| `.gitlab-ci.yml` | `.github/workflows/devops-genai-lab.yml` |
| `stage: test` → job `unit_test` | job `unit_test` |
| `stage: genai_analysis` → job `ai_debugger` | job `ai_debugger` |
| `when: on_failure` | `needs: unit_test` + `if: failure()` |
| Merge Request | Pull Request |
| Variável mascarada de CI/CD | Repository secret |
| Log lido pela API do GitLab | Log passado como artefato entre jobs |

## Evidências

- [Histórico de execuções](evidencias/historico-runs.md)
- [Log completo da falha](evidencias/log-unit-test-falha.md)
- Print do pipeline: `01-pipeline-unit-test-falha-ai-debugger-sucesso.jpg`
- Print do log: `02-log-typeerror-pytest.jpg`

Links no GitHub:

- [PR #1](https://github.com/andreehgomes/fed-catalogo-tarefas/pull/1)
- [Execuções do workflow](https://github.com/andreehgomes/fed-catalogo-tarefas/actions)

## Pendência

O comentário publicado no PR ainda indica que a chave de API não está
configurada. Para obter o diagnóstico real da IA:

1. cadastrar `ANTHROPIC_API_KEY` em *Settings → Secrets and variables → Actions*;
2. re-executar o job `ai_debugger` no run do PR (botão **Re-run jobs**);
3. copiar o diagnóstico gerado para a seção 3 do post, no lugar do trecho
   marcado como pendente.
