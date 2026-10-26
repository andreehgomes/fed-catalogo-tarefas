# Casos de teste de integração gerados

28 casos, cada um rastreado ao prompt que o originou e ao teste executável
correspondente. Os IDs seguem a numeração `CI-nn` usada nos arquivos de
prompt.

**Legenda das fronteiras:** F1 = Componente ↔ `TaskService` · F2 =
`TaskService` ↔ Auth · F3 = `TaskService` ↔ Firestore · F4 =
`PrioritySuggestionService` ↔ Cloud Function.

**Legenda de status:** ✅ passa e o comportamento é o desejado · ⚠️ passa e
documenta comportamento indesejado (bug real, registrado no backlog, não
corrigido nesta entrega) · 📋 documentado, não automatizado · ⚠️📋 parcialmente automatizado.

São 9 casos ⚠️ (CI-07, 13, 15, 17, 20, 21, 24, 25, 27). Eles passam de
propósito: ver
[a nota sobre isso nas evidências](./evidencias/execucao-testes.md#nota-sobre-os-casos-️).

---

## Tipo A — Cenários de integração (P-103)

| ID | Cenário | Fronteiras | Ação | Resultado esperado | Invariante protegido | Status |
|----|---------|-----------|------|--------------------|---------------------|--------|
| CI-01 | Criar tarefa com usuário autenticado | F1→F2→F3 | `create({title:'Estudar Signals'})` | Documento gravado com `userId` do usuário corrente, `createdAt`/`updatedAt` via `serverTimestamp()`, e id devolvido | O serviço — nunca o chamador — é quem preenche `userId` e as datas | ✅ |
| CI-02 | Defaults do schema aplicados no caminho completo | F1→F3 | `create({title:'Só título'})` | Grava `description:''`, `priority:'medium'`, `status:'open'` | Omissão de campo opcional não chega ao Firestore como `undefined` | ✅ |
| CI-03 | Ler tarefa própria | F2→F3 | `getById(id)` da própria tarefa | `Task` com `createdAt`/`updatedAt` como `Date`, não `Timestamp` | A conversão `Timestamp → Date` ocorre na borda do serviço | ✅ |
| CI-04 | Atualizar tarefa de outro usuário | F2→F3 | `update(idDeOutro, {status:'done'})` | `UnauthorizedTaskAccessError`, e o documento **não** é alterado | Ownership é verificado antes de qualquer escrita | ✅ |
| CI-05 | Excluir tarefa de outro usuário | F2→F3 | `delete(idDeOutro)` | `UnauthorizedTaskAccessError`, e o documento continua existindo | Ownership é verificado antes de qualquer deleção | ✅ |
| CI-06 | Listagem isola usuários | F2→F3 | `list()` com tarefas de dois usuários na coleção | Apenas as tarefas do `uid` corrente | O filtro `where('userId','==',uid)` nunca é omitido | ✅ |
| CI-07 | Atualizar tarefa deletada entre `getDoc` e `updateDoc` | F3 | Deletar o documento na janela entre as duas chamadas | Falha com `not-found` do SDK, sem gravação parcial | Operação não atômica degrada para erro, nunca para escrita fantasma | ⚠️ |
| CI-08 | `list()` emite `[]` antes dos dados | F1→F3 | Assinar o Signal de `list()` | Primeira leitura é `[]` (`initialValue`), dados chegam depois | A UI tem um estado inicial definido, não `undefined` | ✅ |

## Tipo B — Dados de teste (P-105)

| ID | Campo / caso | Fronteiras | Entrada | Resultado esperado | Status |
|----|--------------|-----------|---------|--------------------|--------|
| CI-09 | `title` nos limites | F1 | 120 chars / 121 chars | 120 aceito; 121 rejeitado com `too_big` | ✅ |
| CI-10 | `title` só com espaços | F1 | `'   '` | Rejeitado com `too_small` e mensagem `'Título é obrigatório'` — `.trim()` roda **antes** do `.min(1)` | ✅ |
| CI-11 | `priority: null` vs. `undefined` | F1 | `null` / `undefined` | `null` rejeitado com `invalid_value`; `undefined` resolve para `'medium'` via `.default()` | ✅ |
| CI-12 | Enum fora do domínio | F1 | `status: 'archived'` | Rejeitado com `invalid_value` | ✅ |
| CI-13 | `description` multibyte na fronteira | F1 | 1000 emojis (`length === 2000`) | **Aceito** — `max(2000)` conta unidades UTF-16, não caracteres percebidos. Usuário vê 1000 caracteres e um limite de 2000 "atingido" | ⚠️ |
| CI-14 | `update` vazio | F1 | `{}` | Rejeitado pelo `.refine()` com `code: 'custom'` e a mensagem de "pelo menos um campo" | ✅ |

## Tipo C — Casos de erro adversariais (P-107)

| ID | Gatilho | Fronteiras | Sintoma para o usuário | Tratado? | Status |
|----|---------|-----------|------------------------|----------|--------|
| CI-15 | `createdAt: null` durante latency compensation | F3 | Tarefa recém-criada recebe data 1970-01-01 e, com `orderBy desc`, aparece no fim da lista antes de saltar para o topo | **NÃO** — `?? new Date(0)` mascara o estado pendente | ⚠️ |
| CI-16 | Operação sem usuário autenticado | F2 | Erro ao agir após expiração de sessão | Sim — `NotAuthenticatedError` | ✅ |
| CI-17 | Deleção concorrente entre `getDoc` e `updateDoc` | F3 | Editar em uma aba o que outra aba deletou: a UI recebe um `FirebaseError` cru que não reconhece | **Parcial** — falha, mas não converte `not-found` em `TaskNotFoundError` | ⚠️ |
| CI-18 | `getById` de documento inexistente | F3 | Link direto para tarefa removida | Sim — `TaskNotFoundError` | ✅ |
| CI-19 | Documento do Firestore sem `description` | F3 | Dado legado gravado antes do campo existir | Sim — `raw.description ?? ''` | ✅ |
| CI-20 | Documento com `priority` fora do enum no banco | F3 | **Toda a listagem falha**, não só a tarefa ruim: `mapSnapshot` roda `TaskOutSchema.parse` por documento | Parcial — lança, mas derruba a lista inteira | ⚠️ |
| CI-21 | Callable devolve `priority` fora do enum | F4 | Valor inválido entra no app sem erro e é gravado | **NÃO** — `httpsCallable` só faz cast de TS | ⚠️ |
| CI-22 | Callable rejeita (função indisponível) | F4 | Botão de sugestão falha | Parcial — propaga o erro, UI precisa tratar | ✅ |
| CI-23 | `orderBy('createdAt')` com campo ausente | F3 | Tarefa **desaparece** da lista enquanto `createdAt` está pendente | **NÃO** tratado | ⚠️📋 — campo ausente é testado; campo presente com `null` (o caso real) não é reproduzível no fake |

## Tipo D — Contrato da callable (P-109)

| ID | Divergência | Onde estoura | Onde foi causado | Cliente detecta? | Status |
|----|-------------|--------------|------------------|------------------|--------|
| CI-24 | `priority: 'Alta'` (LLM responde em português) | `TaskOutSchema.parse` no `mapSnapshot`, em outra operação | Cloud Function | **Não** | ⚠️ |
| CI-25 | Campo `source` ausente na resposta | Em nenhum lugar — vira `undefined` silenciosamente | Cloud Function | **Não** | ⚠️ |
| CI-26 | Campo extra na resposta (servidor evoluiu) | Em nenhum lugar — **tolerado por design** | Cloud Function | Não, e está correto: permite evolução do servidor | ✅ |
| CI-27 | Resposta é `null` | `TypeError` ao acessar `.priority`, no componente | Cloud Function | **Não** | ⚠️ |
| CI-28 | *(verificação da correção)* — schema zod na borda detecta CI-24, CI-25 e CI-27 na origem, e mantém CI-26 tolerado | — | — | Passaria a detectar | ✅ |

O CI-28 não é um caso de divergência: é o teste que **prova** que a correção
proposta no backlog item 1 resolve três das quatro divergências sem quebrar a
tolerância a campos extras. Serve como especificação executável da correção.

---

## Os seis achados que viraram itens de backlog

Os casos marcados ⚠️ passam na suíte: eles **documentam** o comportamento
atual, que é indesejado. Essa distinção é deliberada — um teste que falha por
bug conhecido polui o sinal da suíte. Cada um gerou um item de backlog:

1. **CI-21/24/25/27 — validar a resposta da callable em runtime.** Declarar
   `SuggestPriorityOutputSchema` com zod no `PrioritySuggestionService` e
   trocar `return result.data` por `return Schema.parse(result.data)`.
   *Prioridade: média.*

   **Ressalva importante, apurada depois:** o servidor em
   `functions/src/suggest-priority/` **já é robusto** — o `claude-adapter`
   valida o retorno do LLM contra `PRIORITIES` e lança se divergir, e
   `suggestPriority` captura esse erro e cai no fallback heurístico, que
   sempre devolve enum válido. Então o cenário que o prompt Tipo D levantou
   (o Claude responder `'Alta'` e corromper o banco) **não ocorre hoje** por
   esse caminho. O que permanece real é a falta de defesa no cliente: o
   `SuggestPriorityOutputSchema` existe em
   `functions/src/suggest-priority/schema.ts` mas **não** é aplicado à
   resposta do handler, a DEC-005 duplica o schema manualmente entre os dois
   lados, e o cliente aceitaria qualquer payload de uma versão divergente.
   A correção é barata e vale como defesa em profundidade — mas não é o bug
   ativo que a análise original sugeria. Ver
   [a nota sobre isso na análise](./analise-prompts.md#4-o-erro-que-a-revisão-pegou).
2. **CI-15/23 — tratar `createdAt` pendente.** Em vez de `?? new Date(0)`,
   expor o estado pendente (ex.: `createdAt: Date | null`) e deixar a UI
   decidir, ou usar data local otimista. *Prioridade: média.*
3. **CI-20 — isolar documento corrompido na listagem.** Trocar o `parse` por
   `safeParse` no `mapSnapshot` e descartar (com log) apenas o documento
   inválido, em vez de derrubar a lista toda. *Prioridade: média.*
4. **CI-13 — contar caracteres percebidos.** Validar `description` por
   `[...str].length` em vez de `.length`, ou ajustar a mensagem de erro.
   *Prioridade: baixa.*
5. **Firebase Emulator Suite.** Habilitaria CI-23 e tornaria os testes de F3
   fiéis ao Firestore real. *Prioridade: média* — ver limitações abaixo.
6. **CI-07/CI-17 — reclassificar o `not-found` da escrita.** Envolver o
   `updateDoc` em `try/catch` e converter `FirebaseError` com
   `code === 'not-found'` em `TaskNotFoundError`, para que a UI trate a
   deleção concorrente como trata os demais erros de domínio. (Só o
   `updateDoc`: `deleteDoc` em documento inexistente resolve sem erro no SDK,
   então não há `not-found` a reclassificar ali.)
   *Prioridade: média.* Este achado **não** veio dos prompts: apareceu ao
   conferir a fidelidade do harness contra o serviço real — ver
   [evidências](./evidencias/execucao-testes.md#correção-de-fidelidade-durante-a-execução).

## Limitações conhecidas

A suíte roda contra fakes in-memory de Firestore e Auth. **Não há duplo de
`Functions`**: os testes da fronteira F4 reproduzem o cast que o
`PrioritySuggestionService` faz na resposta da callable, porque `httpsCallable`
é um import ESM não interceptável. O que a suíte cobre de verdade e o que não
cobre:

**Cobre** — a integração entre a lógica de fronteira do `TaskService` e os
schemas zod: validação de entrada e saída, checagem de ownership, conversão
`Timestamp → Date` e propagação de erros entre camadas. A paridade entre o
harness e o serviço real é verificada por `npm run test:parity`, que compara
a sequência de operações de cada método lendo os dois fontes.

**Não cobre:**

- **Firestore Security Rules.** O fake não as avalia, embora o projeto tenha
  `firestore.rules`. A verificação de ownership em CI-04/CI-05 testa a defesa
  em profundidade do cliente, não a regra do servidor. As rules precisam de
  teste próprio (`@firebase/rules-unit-testing`), que exige o emulador.
- **Semântica de query do Firestore — parcialmente.** O fake **reproduz** a
  exclusão de documentos que não contêm o campo do `orderBy`
  (`queryWhereOrderByDesc` filtra por existência), e CI-23 testa isso. O
  comportamento está confirmado na
  [documentação oficial](https://firebase.google.com/docs/firestore/query-data/order-limit-data)
  ("O conjunto de resultados não incluirá documentos que não contenham os
  campos fornecidos"). O que **não** é reproduzido é o campo presente com
  valor `null` — que é justamente o caso real da latency compensation, ligando
  CI-15 a CI-23. Isso exigiria o emulador.
- **O lado servidor da callable.** O repositório tem `functions/`, com suíte
  Jest própria (`npm test` lá dentro). Os casos CI-24 a CI-27 testam como o
  **cliente** reage a respostas divergentes; o comportamento do servidor é
  verificado nos testes dele, não aqui.
- **Latency compensation real.** CI-15 simula o snapshot com `createdAt: null`
  em vez de reproduzir o ciclo completo de emissão otimista → confirmação.
- **Fluxo pela UI.** Coberto parcialmente pelo E2E Playwright já existente em
  `e2e/tasks-flow.spec.ts`, que roda contra o Firebase real.
