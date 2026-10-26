# Tipo A — Prompt de geração de cenários de integração

## [P-101] Cenários de integração — v1 (ruim, registrada propositalmente)

- **Modelo:** Claude Opus 5 via Claude Code
- **Data:** 2026-10-23
- **Fronteira alvo:** F1–F3
- **Veredito:** descartada

### Prompt enviado

> Gere casos de teste de integração para um app Angular de catálogo de tarefas
> que usa Firebase.

### Resultado obtido

Oito casos, dos quais:

- 5 eram testes **unitários** disfarçados ("verificar que `TaskCreateSchema`
  rejeita título vazio" — isso não atravessa fronteira nenhuma);
- 2 citavam métodos inexistentes (`taskService.findAll()`,
  `taskService.getTasksByStatus()`);
- 1 era aproveitável.

A LLM também assumiu HttpClient e uma API REST com `GET /api/tasks`, que o
projeto não tem — ele fala com o Firestore via SDK.

### Ajustes manuais necessários

Descartei a saída inteira. O problema não era refinável por iteração pequena:
o prompt não dava contexto algum, então a LLM preencheu as lacunas com o app
Angular "médio" da internet.

### Lições aprendidas

- Prompt sem código-fonte colado produz testes para um sistema imaginário.
  Descrição em prosa ("usa Firebase") é insuficiente: *como* se usa Firebase
  determina quais fronteiras existem.

---

## [P-102] Cenários de integração — v2 (melhor, ainda incompleta)

- **Modelo:** Claude Opus 5 via Claude Code
- **Data:** 2026-10-23
- **Fronteira alvo:** F1–F3
- **Veredito:** parcialmente aproveitada

### Prompt enviado

> Você é um engenheiro de QA especializado em testes de integração.
>
> Abaixo está o código real de um app Angular 20 de catálogo de tarefas.
>
> [código de `src/app/models/task.ts` e `src/app/services/task.service.ts` colado integralmente]
>
> Gere cenários de teste de integração para este código.

### Resultado obtido

Seis cenários, todos tecnicamente válidos e usando apenas métodos que existem
de fato (`create`, `update`, `delete`, `getById`, `list`). Melhora enorme em
relação à v1.

Mas a distribuição ficou enviesada: **cinco dos seis eram caminho feliz.** O
único de falha era "criar tarefa sem estar autenticado" — justamente o que o
`task.service.spec.ts` do projeto já cobre. A LLM não tocou em ownership
(`UnauthorizedTaskAccessError`), nem em `createdAt` nulo, nem na Cloud
Function.

### Ajustes manuais necessários

- Precisei adicionar ao prompt a exigência explícita de **atravessar
  fronteiras**, porque 2 dos 6 cenários ainda testavam só o schema zod.
- Precisei nomear as fronteiras F1–F4 eu mesmo e pedir cobertura de cada uma;
  a LLM não inferiu que a Cloud Function era parte do escopo, porque eu não
  tinha colado o `priority-suggestion.service.ts`.

### Lições aprendidas

- Colar o código resolve a alucinação, mas não o viés de caminho feliz. A LLM
  otimiza para "cenários que demonstram o sistema funcionando".
- A LLM só integra o que você cola. Omitir um arquivo equivale a dizer que
  aquela fronteira não existe.

---

## [P-103] Cenários de integração — v3 (final, usada na suíte)

- **Modelo:** Claude Opus 5 via Claude Code
- **Data:** 2026-10-23
- **Fronteira alvo:** F1, F2, F3 (F4 fica no Tipo D)
- **Veredito:** aceita — origem dos casos CI-01 a CI-08

### Prompt enviado

> Você é um engenheiro de QA sênior especializado em **testes de integração**
> em aplicações Angular + Firebase.
>
> ## Contexto do sistema
>
> Aplicação Angular 20 (standalone, Signals) de catálogo de tarefas. Código
> real abaixo, íntegro — **use apenas os métodos e campos que aparecem nele**:
>
> ### `src/app/models/task.ts`
> ```typescript
> [conteúdo integral colado]
> ```
>
> ### `src/app/services/task.service.ts`
> ```typescript
> [conteúdo integral colado]
> ```
>
> ### `src/app/services/auth.service.ts`
> ```typescript
> [conteúdo integral colado]
> ```
>
> ### Classes de erro
> `NotAuthenticatedError`, `TaskNotFoundError(taskId)`,
> `UnauthorizedTaskAccessError(taskId)`.
>
> ## Fronteiras de integração deste sistema
>
> - **F1** — Componente ↔ `TaskService` (validação zod do payload da UI)
> - **F2** — `TaskService` ↔ Firebase Auth (`requireUserId`, ownership)
> - **F3** — `TaskService` ↔ Firestore (`addDoc`/`getDoc`/`updateDoc`/
>   `deleteDoc`, conversão `Timestamp` → `Date`, `collectionData` reativo)
>
> ## Tarefa
>
> Gere cenários de teste de **integração** para F1, F2 e F3.
>
> ## Restrições obrigatórias
>
> 1. Cada cenário deve atravessar **no mínimo duas** das fronteiras acima.
>    Se um cenário exercita apenas um componente isolado, ele é um teste
>    unitário — **não o inclua**.
> 2. Distribua os cenários entre as três fronteiras; não concentre em F3.
> 3. Inclua pelo menos um cenário onde o estado muda **entre** duas operações
>    (ex.: ler e depois escrever, com algo acontecendo no meio).
> 4. Não invente métodos, campos ou classes que não estão no código colado.
> 5. Para cada cenário, indique o **invariante** que ele protege — a regra do
>    sistema que quebraria se o teste falhasse.
>
> ## Formato de saída
>
> Tabela Markdown com as colunas: `ID | Cenário | Fronteiras | Pré-condição |
> Ação | Resultado esperado | Invariante protegido`.

### Resultado obtido

Oito cenários (CI-01 a CI-08), todos atravessando ≥2 fronteiras, distribuídos
como F1:2, F2:3, F3:5 (com sobreposição). A restrição 3 produziu o cenário
mais valioso de todo o exercício: **CI-07** — "atualizar tarefa deletada por
outra sessão entre o `getDoc` e o `updateDoc`", um caso de corrida que eu não
tinha considerado.

A LLM afirmou que o código tratava esse caso lançando `TaskNotFoundError`.
**Isso estava errado**, e eu só descobri ao conferir o harness contra o
`task.service.ts`: as checagens de existência e ownership já passaram com o
snapshot anterior à deleção, então a falha vem do próprio `updateDoc`, com
`FirebaseError(not-found)` cru, que o serviço não converte em erro de domínio.
Ou seja: cenário certo, asserção errada — ver
[evidências](../evidencias/execucao-testes.md#correção-de-fidelidade-durante-a-execução)
e o backlog item 6.

A restrição 5 (invariante protegido) elevou a qualidade de forma
desproporcional ao seu custo: obrigada a nomear a regra que o teste protege, a
LLM descartou sozinha dois cenários redundantes que a v2 havia gerado — eles
protegiam o mesmo invariante com dados diferentes.

### Ajustes manuais necessários

- **Mesclei CI-04 e CI-05**, que a LLM gerou separados mas protegiam o mesmo
  invariante de ownership (um para `update`, outro para `delete`). Mantive os
  dois na tabela de casos, mas na suíte eles viraram um `describe` com dois
  `it` compartilhando setup.
- **Corrigi a pré-condição de CI-08**: a LLM supôs que `list()` emitiria
  imediatamente, mas `toSignal` com `initialValue: []` emite `[]` primeiro.
  O teste precisou de um `await` no microtask para ver os dados.
- **Removi uma suposição sobre `orderBy`**: a LLM afirmou que tarefas sem
  `createdAt` apareceriam por último na listagem. No Firestore real, documentos
  sem o campo do `orderBy` são **omitidos** da query. Esse detalhe ficou
  documentado como limitação, porque o fake in-memory não o reproduz.

### Lições aprendidas

- Pedir o **invariante protegido** é o ajuste de melhor custo-benefício de
  todo o exercício: uma coluna a mais na tabela, e a LLM passa a deduplicar
  cenários por si mesma.
- A restrição "no mínimo duas fronteiras" é o que separa teste de integração
  de teste unitário no output. Sem ela, ~40% da saída vira teste unitário,
  mesmo com o código colado.
- Proibir invenção de métodos (restrição 4) eliminou 100% das alucinações de
  API que dominaram a v1.
- A LLM continua errando em **semântica de runtime** (ordem de emissão do
  `toSignal`, comportamento do `orderBy` com campo ausente). Ela acerta a
  estrutura do teste; o comportamento real da plataforma exige verificação
  humana contra a documentação.
