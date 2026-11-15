# Fórum — Miniprojeto de DevOps com IA Generativa

Curso 14 — Manutenção, DevOps e Operações com GenAI (Unidade 5).

**Publicado em 15/11/2026** —
[post no fórum](https://ava.akcit.ufg.br/mod/forum/discuss.php?d=3859#p35597)
(prazo era 16/11 às 12h). As 4 imagens entraram no corpo do texto.
Print do resultado: `evidencias/07-post-publicado-forum.jpg`.

## Conteúdo

| Arquivo | Descrição |
|---|---|
| [post-forum.md](post-forum.md) | Versão de trabalho, em Markdown |
| [post-forum-tinymce.html](post-forum-tinymce.html) | Para colar no editor avançado do fórum, com formatação |
| [post-forum-texto-limpo.txt](post-forum-texto-limpo.txt) | Texto sem marcação, alternativa segura |
| [evidencias/](evidencias/) | Prints e logs do GitHub Actions |

## Como publicar

O editor do fórum (AVA/Moodle) é o **TinyMCE**, um editor rich text —
Markdown cru não renderiza, os `##` e `**` aparecem literais.

Para publicar com formatação:

1. abrir `post-forum-tinymce.html` no navegador;
2. selecionar do "Olá, pessoal!" até o "Abraço!" (sem a caixa amarela);
3. copiar e colar no editor **Avançado** do fórum.

Testado: títulos, negrito, itálico, links, listas, tabela com bordas,
código inline e blocos de código em fonte monoespaçada são preservados.
O print `05-teste-colagem-tinymce.jpg` mostra o resultado no editor.

Se a colagem falhar, `post-forum-texto-limpo.txt` serve de alternativa.

### Imagens — no meio do texto

O HTML traz **4 marcadores vermelhos** indicando onde cada imagem entra.
Depois de colar o texto no editor, para cada marcador:

1. clicar sobre a linha vermelha e apagá-la;
2. com o cursor no lugar, clicar no botão **Imagem** da barra do editor;
3. arrastar ou selecionar o arquivo indicado no marcador.

Os arquivos estão em [`evidencias/anexos-forum/`](evidencias/anexos-forum/)
(288 KB no total). Posições:

| Figura | Onde entra |
|---|---|
| 1 — pipeline | depois da tabela de runs, antes do log |
| 2 — log do pytest | logo após o bloco de log |
| 4 — análise dos 2 defeitos | após a citação "corrigir só o tipo não basta" |
| 3 — comentários no PR | no fim da seção 3 |

**Não usar o campo Anexo**: ele coloca as imagens todas no rodapé do post,
separadas do texto que elas ilustram.

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
- [Análise gerada pela IA](evidencias/analise-ia-comentario-pr.md) — com
  verificação humana de cada afirmação
- Print do pipeline: `01-pipeline-unit-test-falha-ai-debugger-sucesso.jpg`
- Print do log: `02-log-typeerror-pytest.jpg`
- Print dos dois comentários no PR: `03-comentario-ia-no-pr.jpg`
- Print da análise (dois defeitos): `04-analise-ia-dois-defeitos.jpg`

Links no GitHub:

- [PR #1](https://github.com/andreehgomes/fed-catalogo-tarefas/pull/1)
- [Execuções do workflow](https://github.com/andreehgomes/fed-catalogo-tarefas/actions)

## Estado

Laboratório concluído. O agente rodou nos dois modos no mesmo PR: sem chave
(run #3, comentário avisando que não houve chamada ao modelo) e com
`ANTHROPIC_API_KEY` cadastrada (run #5, análise completa em 40s).

A chave fica em *Settings → Secrets and variables → Actions* e é mascarada pelo
GitHub nos logs. O script detecta `ANTHROPIC_API_KEY` ou `OPENAI_API_KEY` e,
sem nenhuma das duas, apenas imprime o prompt sem falhar.
