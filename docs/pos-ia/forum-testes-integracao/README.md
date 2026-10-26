# Fórum — Unidade III: GenAI aplicada a testes de integração

Entrega do fórum avaliativo da Unidade III. O objetivo é definir **tipos de
prompt** para apoiar testes de integração, experimentá-los com uma LLM e
registrar os casos de teste gerados, comentando como cada tipo de prompt
influenciou a qualidade e a diversidade dos casos.

- **Disciplina:** Engenharia de Software com IA Generativa — Unidade III
- **Data:** 2026-10-23
- **LLM utilizada:** Claude Opus 5 (via Claude Code)
- **Cenário de integração:** catálogo de tarefas — Angular 20 ↔ Firebase Auth
  ↔ Firestore ↔ Cloud Function callable `suggestpriority`

## Por que este cenário

O projeto [fed-catalogo-tarefas](../../../README.md) não é um exemplo didático: é a
aplicação construída ao longo da pós, e seus pontos de integração são reais.

```
┌─────────────────────┐
│  Angular 20 (SPA)   │
│  TasksComponent     │
└──────┬───────┬──────┘
       │       │
       │       └──────────────► PrioritySuggestionService
       │                        │  httpsCallable('suggestpriority')
       ▼                        ▼
  AuthService              Cloud Function (Claude Haiku + fallback)
  Firebase Auth                 │
       │                        └──► contrato: { priority, source }
       ▼
  TaskService ──► Firestore (coleção `tasks`)
       │              └── Security Rules: userId == request.auth.uid
       └── validação zod (TaskCreateSchema / TaskUpdateSchema / TaskOutSchema)
```

São quatro fronteiras de integração distintas, cada uma com modos de falha
próprios:

| # | Fronteira | Risco de integração |
|---|-----------|---------------------|
| F1 | Componente ↔ `TaskService` | validação zod rejeitando payload da UI |
| F2 | `TaskService` ↔ Firebase Auth | operação sem usuário autenticado |
| F3 | `TaskService` ↔ Firestore | ownership, documento inexistente, `Timestamp` nulo |
| F4 | `PrioritySuggestionService` ↔ Cloud Function | contrato de resposta, fallback, latência, erro remoto |

Essa variedade é o que torna o cenário interessante para avaliar prompts: um
prompt genérico tende a cobrir só o caminho feliz de F3 e ignorar F2 e F4.

## Estrutura dos arquivos

| Arquivo | Conteúdo |
|---------|----------|
| [post-forum.md](./post-forum.md) | **Texto pronto para postar no fórum** |
| [analise-prompts.md](./analise-prompts.md) | A resposta às perguntas do fórum, em detalhe: qualidade, diversidade e ajustes |
| [prompts/README.md](./prompts/README.md) | Os 4 tipos de prompt, com o texto integral de cada um |
| [prompts/01-cenarios-integracao.md](./prompts/01-cenarios-integracao.md) | Tipo A — geração de cenários (3 iterações, v1 → v3) |
| [prompts/02-dados-de-teste.md](./prompts/02-dados-de-teste.md) | Tipo B — geração de dados de teste e fronteiras |
| [prompts/03-casos-de-erro.md](./prompts/03-casos-de-erro.md) | Tipo C — casos de erro e falhas adversariais |
| [prompts/04-contrato-api.md](./prompts/04-contrato-api.md) | Tipo D — testes de contrato da callable |
| [casos-de-teste.md](./casos-de-teste.md) | Os 27 casos gerados + CI-28, rastreados ao prompt de origem |
| [evidencias/execucao-testes.md](./evidencias/execucao-testes.md) | Saída real da execução da suíte |
| `fed-catalogo-tarefas-app/src/app/integration/` | Suíte executável derivada dos casos (caminho a partir da raiz do repo) |
| `fed-catalogo-tarefas-app/scripts/check-harness-parity.mjs` | Verificação de paridade entre o harness de teste e o `TaskService` real |

## Como rodar a suíte gerada

```bash
cd fed-catalogo-tarefas-app && npm install && npm run test:integration
```

Resultado em 2026-10-23: **50 testes, todos passando** — 34 de integração
desta entrega e 16 pré-existentes do projeto —, mais 6 verificações de
paridade. Saída completa em
[evidencias/execucao-testes.md](./evidencias/execucao-testes.md).

Os testes de integração ficam em
`src/app/integration/*.integration.spec.ts` e rodam com Karma/Jasmine, a
mesma stack já usada pelo projeto. Eles exercitam a integração real entre a lógica de fronteira do
`TaskService` e os schemas zod contra **fakes in-memory** de Firestore e Auth
— sem rede, sem credenciais, sem custo. Os testes da fronteira F4 reproduzem
o cast que o `PrioritySuggestionService` faz na resposta da callable (não há
duplo de `Functions`; o motivo está no docblock do spec de contrato).

> **Nota sobre a escolha dos fakes.** Testar contra o Firebase de produção
> exigiria credenciais no repositório e tornaria os testes não
> determinísticos. O Firebase Emulator Suite seria o ideal — e o projeto **já
> tem** `firebase.json` com os emuladores configurados (auth 9099, firestore
> 8080, functions 5001) —, mas ele exige um JDK, que não está instalado nesta
> máquina. Os fakes in-memory preservam o que importa aqui: as fronteiras
> entre componentes são atravessadas de verdade, incluindo validação zod e
> checagem de ownership. O que eles **não** cobrem está declarado
> explicitamente em [casos-de-teste.md](./casos-de-teste.md#limitações-conhecidas),
> e a paridade entre o harness e o serviço real é verificada por
> `npm run test:parity`.

## Resumo dos resultados

| Tipo de prompt | Casos gerados | Casos de falha | Fronteiras cobertas |
|----------------|---------------|----------------|---------------------|
| A — Cenários de integração | 8 | 1 | F1, F2, F3 |
| B — Dados de teste | 6 | 2 | F1, F3 |
| C — Casos de erro | 9 | 8 | F2, F3, F4 |
| D — Contrato de API | 4 | 2 | F4 |
| **Total** | **27** | **13** | **F1–F4** |

Os 27 casos gerados pelos prompts viraram 34 `it()` executáveis (com o CI-28, que verifica a correção proposta) (alguns casos têm um `it` por classe
de valor). Nove casos passam documentando comportamento **indesejado** — são
os bugs reais que o exercício encontrou, com itens de backlog em
[casos-de-teste.md](./casos-de-teste.md#os-seis-achados-que-viraram-itens-de-backlog).

A conclusão central da análise: **nenhum tipo de prompt isolado produziu uma
suíte aceitável.** O prompt de cenários gerou quase só caminho feliz; o de
casos de erro gerou falhas sem nenhum caminho de sucesso para ancorá-las. A
cobertura das quatro fronteiras só apareceu com os quatro tipos combinados —
detalhes em [analise-prompts.md](./analise-prompts.md).
