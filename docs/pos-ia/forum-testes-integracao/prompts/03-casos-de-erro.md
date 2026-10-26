# Tipo C — Prompt de geração de casos de erro (adversarial)

## [P-106] Casos de erro — v1

- **Modelo:** Claude Opus 5 via Claude Code
- **Data:** 2026-10-23
- **Fronteira alvo:** F2, F3, F4
- **Veredito:** parcialmente aproveitada

### Prompt enviado

> Gere casos de teste de erro para o `TaskService` abaixo.
>
> ```typescript
> [task.service.ts colado]
> ```

### Resultado obtido

Sete casos, todos derivados mecanicamente dos `throw` já presentes no código:
"lança `NotAuthenticatedError` quando não há usuário", "lança
`TaskNotFoundError` quando o documento não existe", e assim por diante — um
por `throw`.

É cobertura de linha travestida de teste de erro. Todos os casos eram
previsíveis a partir do código, e quatro deles já existiam no
`task.service.spec.ts`.

### Ajustes manuais necessários

Aproveitei dois casos (os de ownership, que ainda não estavam cobertos) e
descartei o resto.

### Lições aprendidas

- Pedir "casos de erro" faz a LLM enumerar os erros **que o código já trata**.
  Isso tem algum valor (cobertura), mas não encontra nada novo: por definição,
  não revela a falha que o desenvolvedor não previu.
- Para achar o que não está tratado, o prompt precisa mudar de perspectiva —
  de "quais erros o código lança" para "o que pode dar errado no mundo".

---

## [P-107] Casos de erro — v2 (final, usada na suíte)

- **Modelo:** Claude Opus 5 via Claude Code
- **Data:** 2026-10-23
- **Fronteira alvo:** F2, F3, F4
- **Veredito:** aceita — origem dos casos CI-15 a CI-23

### Prompt enviado

> Você é um **engenheiro de caos** contratado para quebrar a integração entre
> os componentes de um app Angular + Firebase. Seu objetivo **não** é
> confirmar que o código funciona: é encontrar as condições sob as quais a
> comunicação entre componentes falha de forma silenciosa ou inesperada.
>
> ## Código real
>
> ```typescript
> [task.service.ts, priority-suggestion.service.ts e task.ts colados]
> ```
>
> ## Fatos sobre o ambiente de execução
>
> - `createdAt`/`updatedAt` são escritos com `serverTimestamp()`. Entre o
>   `addDoc` e a confirmação do servidor, o listener local do Firestore emite
>   o documento com esses campos **`null`** (latency compensation).
> - `mapSnapshot` faz `TaskOutSchema.parse(...)`, e `TaskOutSchema` exige
>   `createdAt: z.date()`.
> - `update()` e `delete()` fazem `getDoc` e **depois** `updateDoc`/
>   `deleteDoc` — duas chamadas de rede, não atômicas.
> - A Cloud Function `suggestpriority` é chamada via `httpsCallable` e pode:
>   demorar, falhar, ou devolver um payload que não casa com
>   `SuggestPriorityOutput`.
> - O `list()` usa `where('userId','==',uid)` + `orderBy('createdAt','desc')`.
>
> ## Tarefa
>
> Liste as condições que fazem a **integração** falhar. Para cada uma:
>
> 1. O gatilho concreto (o que precisa acontecer no mundo real);
> 2. Qual fronteira entre componentes rompe;
> 3. O que o usuário vê quando isso acontece;
> 4. Se o código **atualmente trata** ou **não trata** o caso — seja honesto,
>    e marque como `NÃO TRATADO` quando for o caso;
> 5. O teste de integração que detectaria a falha.
>
> ## Restrições obrigatórias
>
> 1. **Não** liste casos que são simplesmente os `throw` já presentes no
>    código. Esses são triviais e já estão cobertos.
> 2. Priorize falhas de **ordem, tempo e concorrência** entre componentes.
> 3. Inclua ao menos um caso de **falha silenciosa** — onde nada lança erro,
>    mas o estado fica incorreto.
> 4. Inclua ao menos um caso onde o **contrato** entre cliente e servidor é
>    violado sem erro de rede.
>
> ## Formato de saída
>
> Tabela: `ID | Gatilho | Fronteira rompida | Sintoma para o usuário |
> Tratado? | Teste que detecta`.

### Resultado obtido

Onze condições, das quais nove viraram casos (CI-15 a CI-23). Quatro achados
substantivos, todos consequência direta das restrições:

**1. Timestamp nulo durante latency compensation (CI-15) — `NÃO TRATADO`.**
O achado mais importante. Logo após `create()`, o listener do `collectionData`
emite o documento novo com `createdAt: null`. O `mapSnapshot` usa
`raw.createdAt?.toDate() ?? new Date(0)`, então não quebra — mas substitui a
data por **1970-01-01**. Como o `list()` ordena por `createdAt desc`, a tarefa
recém-criada aparece no **fim** da lista por uma fração de segundo, e depois
salta para o topo. É exatamente a "falha silenciosa" que a restrição 3 pediu:
nada lança, o teste de caminho feliz passa, e o usuário vê a lista pular.

**2. Deleção concorrente entre `getDoc` e `updateDoc` (CI-17) — `NÃO TRATADO`.**
A restrição 2 (ordem e concorrência) produziu este caso: duas abas abertas, uma
deleta enquanto a outra edita. A LLM afirmou que o código tratava, lançando
`TaskNotFoundError`. **Não trata:** as checagens já passaram com o snapshot
antigo, e a falha vem do `updateDoc` com `not-found` cru, que o serviço não
converte em erro de domínio — então a UI recebe um erro que não reconhece.
Descobri isso conferindo o harness contra o serviço real, não revisando o
output da LLM. Virou o backlog item 6.

**3. Callable devolvendo prioridade fora do enum (CI-21) — `NÃO TRATADO`.**
A restrição 4 produziu o achado de contrato: o `PrioritySuggestionService`
tipa a resposta como `SuggestPriorityOutput` mas **não valida em runtime** —
`httpsCallable` só faz um cast de TypeScript. Se a Cloud Function devolver
`priority: 'critical'` (valor que o Claude Haiku poderia alucinar, dado que o
prompt da função pede uma prioridade), o valor entra no app, é gravado no
Firestore, e só explode mais tarde, no `TaskOutSchema.parse` do `mapSnapshot`
— em outra operação, com stack trace apontando para o lugar errado.
Um schema zod na borda da callable resolveria. Anotado no backlog.

**4. `orderBy` com campo ausente omite documentos (CI-23).** A LLM levantou a
hipótese, eu confirmei na documentação do Firestore: documentos sem o campo do
`orderBy` são excluídos da query, não ordenados por último. Combinado com o
achado 1, significa que a tarefa recém-criada pode **desaparecer** da lista
momentaneamente, não só mudar de posição.

### Ajustes manuais necessários

- **Descartei duas das onze condições** por não serem testáveis em nível de
  integração: "usuário perde conexão no meio do `addDoc`" e "quota do
  Firestore excedida" dependem de infraestrutura, não de fronteira entre
  componentes. Ficaram registradas como riscos, não como testes.
- **Reclassifiquei um "NÃO TRATADO" que estava errado.** A LLM afirmou que
  `getById` não trata documento inexistente. Trata — lança `TaskNotFoundError`
  na linha seguinte ao `getDoc`. Foi a única alucinação desta rodada, e veio
  justamente no campo "Tratado?", que é o mais crítico da tabela.
- **Precisei confirmar o achado 4 na documentação**, porque a LLM apresentou
  hipótese e fato com a mesma confiança, sem distinguir um do outro.
- **Reduzi o escopo de CI-15 no teste**: a LLM propôs simular a latency
  compensation inteira com dois `emit` sequenciais do listener. Simplifiquei
  para um único snapshot com `createdAt: null`, que testa o mesmo invariante
  com um décimo da complexidade de setup.

### Lições aprendidas

- **Mudar o papel muda a classe de achado.** "Engenheiro de caos" com proibição
  explícita de listar os `throw` existentes é o que fez a diferença entre
  cobertura de linha (v1) e descoberta de dois bugs reais não tratados (v2).
  O mesmo modelo, o mesmo código: só o enquadramento mudou.
- **Dar à LLM fatos sobre o runtime é mais produtivo que dar mais código.**
  O achado 1 só foi possível porque eu colei no prompt o fato de que
  `serverTimestamp()` emite `null` localmente. Esse fato não está no
  código-fonte — está na documentação do Firebase e na minha experiência.
  A LLM soube o que fazer com ele; não o teria inferido sozinha.
- **Pedir "falha silenciosa" explicitamente** (restrição 3) é o que extrai os
  casos que mais importam. Falhas que lançam exceção são fáceis; as que
  corrompem estado sem avisar são as caras de achar em produção.
- **Exigir o campo "Tratado? (seja honesto)" é útil e perigoso.** Útil porque
  prioriza o trabalho. Perigoso porque foi exatamente ali que a LLM errou.
  Todo `NÃO TRATADO` precisa ser confirmado lendo o código — é uma afirmação
  sobre ausência, e a LLM é ruim em verificar ausências.
