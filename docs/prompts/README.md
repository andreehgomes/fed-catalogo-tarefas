# Registro de Prompts

Esta pasta documenta **todos** os prompts usados durante a construção do
projeto, em qualquer ferramenta de IA (Claude, ChatGPT, Copilot, etc.).
O objetivo é cumprir a exigência da disciplina (rastreabilidade do uso
de IA no desenvolvimento) e permitir reproduzir ou auditar cada decisão.

## Convenções

- Um arquivo por prompt: `NN-tema-curto.md`, com `NN` em ordem cronológica.
- Cada arquivo segue o template abaixo.
- Após executar o prompt, **sempre** preencher os campos de "Ajustes manuais"
  e "Lições aprendidas" — esses são os campos que mais agregam valor à
  avaliação acadêmica.
- Não apague prompts ruins: registre como ruins. Eles são parte do aprendizado.

## Template

```markdown
## [P-NNN] Título curto e descritivo
- Modelo: <ex: Claude Opus 4 via Claude Code | ChatGPT GPT-4o | Copilot>
- Data: AAAA-MM-DD
- Release: <1 — Core | 2 — Qualidade | 3 — Final>
- Camada: <Bootstrap | Models | Services | UI | Cloud Functions | Docs | …>

### Prompt enviado
> Cole o prompt completo, em bloco de citação ou bloco de código.

### Resultado obtido
Descrição sucinta do que a IA produziu.

### Ajustes manuais necessários
O que precisou ser corrigido/refinado depois do output da IA.

### Lições aprendidas
- Em uma frase: o que esse prompt ensinou sobre como pedir melhor.
```

## Índice

- [01 — Bootstrap completo da Release 1](./01-bootstrap.md)
- [02 — Release 2: Qualidade (Auth, regras, testes, Makefile)](./02-release-2-quality.md)
- [03 — Release 3: Final (Cloud Function com Claude + App Check)](./03-release-3-final.md)
- [04 — Prompts para testes de integração (fórum Unidade III)](../pos-ia/forum-testes-integracao/prompts/README.md)
  — quatro tipos de prompt (cenários, dados, casos de erro, contrato), nove
  iterações registradas e a suíte executável que elas produziram.
