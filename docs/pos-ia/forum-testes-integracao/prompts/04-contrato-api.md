# Tipo D — Prompt de teste de contrato de API

Este é o tipo de prompt mais específico dos quatro, e o mais relevante neste
projeto por um motivo estrutural: a [DEC-005](../../../decisoes.md) decidiu
**duplicar deliberadamente** o schema entre o cliente Angular e a Cloud
Function `suggestpriority`. Duplicação declarada é onde contratos se rompem em
silêncio — o cliente continua compilando, o servidor continua respondendo, e
ninguém percebe até o dado errado chegar ao banco.

## [P-108] Contrato da callable — v1

- **Modelo:** Claude Opus 5 via Claude Code
- **Data:** 2026-10-23
- **Fronteira alvo:** F4
- **Veredito:** descartada

### Prompt enviado

> Gere testes de contrato de API para este serviço:
>
> ```typescript
> [priority-suggestion.service.ts colado]
> ```

### Resultado obtido

Quatro testes, todos escritos com `HttpTestingController` do
`@angular/common/http/testing`, verificando `GET`/`POST` em uma URL
`/api/suggest-priority`.

Nada disso existe. O serviço usa `httpsCallable` do Firebase Functions, que
não passa por `HttpClient` e portanto é invisível ao `HttpTestingController`.
A LLM reconheceu o padrão "serviço Angular que chama backend" e aplicou o
ferramental canônico desse padrão, ignorando o import que estava na segunda
linha do arquivo colado.

### Ajustes manuais necessários

Descartada integralmente. O erro não era de detalhe, era de mecanismo: os
testes não compilariam nem rodariam.

### Lições aprendidas

- A LLM tem viés forte para o **stack mais comum** daquele formato de
  problema. Colar o código não impede isso se o código ainda "parece" o
  padrão familiar — é preciso nomear o mecanismo e **proibir** a alternativa
  esperada.

---

## [P-109] Contrato da callable — v2 (final, usada na suíte)

- **Modelo:** Claude Opus 5 via Claude Code
- **Data:** 2026-10-23
- **Fronteira alvo:** F4
- **Veredito:** aceita — origem dos casos CI-24 a CI-27

### Prompt enviado

> Você é um engenheiro de QA especializado em **testes de contrato** entre
> cliente e serviço remoto.
>
> ## Mecanismo de comunicação (leia antes de tudo)
>
> Este sistema **não usa `HttpClient` nem REST**. A comunicação é via
> **Firebase Callable Functions** (`httpsCallable` de
> `@angular/fire/functions`). Portanto:
>
> - **NÃO** use `HttpTestingController`, `provideHttpClientTesting`, `HttpMock`
>   ou qualquer coisa de `@angular/common/http/testing`. Nada disso intercepta
>   uma callable.
> - A forma de testar é **injetar um duplo de `Functions`** e controlar o que
>   a callable resolve ou rejeita.
>
> ## Código do cliente
>
> ```typescript
> [priority-suggestion.service.ts colado integralmente]
> ```
>
> ## O contrato, conforme o cliente o declara
>
> ```typescript
> interface SuggestPriorityInput  { title: string; description: string; }
> interface SuggestPriorityOutput { priority: TaskPriority; source: 'claude' | 'heuristic'; }
> // TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
> ```
>
> ## Fato crítico sobre este contrato
>
> `httpsCallable<I, O>` é **genérico de TypeScript apenas**. Não há validação
> em runtime: `result.data` é devolvido com um cast, sem verificação. O
> servidor é uma Cloud Function que consulta o Claude Haiku e, em caso de
> falha, cai num fallback heurístico — ou seja, a resposta é parcialmente
> gerada por um LLM, e **o schema do servidor é uma cópia manual deste**
> (decisão arquitetural DEC-005), não uma fonte compartilhada.
>
> ## Tarefa
>
> Pense passo a passo antes de responder:
>
> 1. Enumere as maneiras pelas quais a resposta real do servidor pode divergir
>    do tipo `SuggestPriorityOutput` declarado aqui.
> 2. Para cada divergência, determine **onde** no app ela se manifesta: no
>    ponto da chamada, ou mais tarde, em outro componente?
> 3. Só então escreva os casos de teste de contrato.
>
> ## Restrições obrigatórias
>
> 1. Para cada caso, informe **onde o erro aparece** vs. **onde o erro foi
>    causado**. Divergência de contrato que estoura longe da origem é a mais
>    cara de depurar, e quero esses casos identificados.
> 2. Inclua o caso de campo **extra** na resposta (servidor evoluiu, cliente
>    não) e o de campo **ausente**.
> 3. Inclua o caso em que `priority` é uma string válida de prioridade **mas
>    fora do enum** (ex.: `'critical'`, `'CRITICAL'`, `'Alta'`) — plausível
>    porque o valor vem de um LLM.
> 4. Diga, para cada caso, se o cliente atual **detecta** a divergência. Se
>    não detecta, proponha a correção mínima.
>
> ## Formato de saída
>
> Tabela: `ID | Divergência | Onde estoura | Onde foi causado | Cliente
> detecta? | Correção mínima`.

### Resultado obtido

Seis divergências, condensadas em quatro casos (CI-24 a CI-27). O raciocínio
passo a passo exigido (itens 1–3) produziu a conclusão central do exercício:

> **Nenhuma das seis divergências é detectada no ponto da chamada.** Todas
> atravessam o `PrioritySuggestionService` sem resistência, porque não há
> validação em runtime. Quatro delas só se manifestam depois, no
> `TaskOutSchema.parse()` do `TaskService.mapSnapshot` — ou seja, numa
> operação diferente, num componente diferente, com stack trace apontando
> para o Firestore e não para a Cloud Function.

A restrição 3 gerou o caso mais concreto: se a callable devolvesse `'Alta'` em
vez de `'high'`, o valor seria gravado no Firestore e **toda leitura
subsequente da lista falharia**, porque `mapSnapshot` roda
`TaskOutSchema.parse` em cada documento — um único valor ruim corromperia a
listagem inteira, de forma persistente.

> **Correção posterior, importante.** Apresentei isso como bug ativo e estava
> errado. Ao conferir `functions/src/suggest-priority/` — que eu não havia
> lido, porque o prompt tratava só do cliente — o `claude-adapter` valida o
> retorno do LLM contra `PRIORITIES` e lança se divergir, e `suggestPriority`
> captura esse erro e cai no fallback heurístico, que sempre devolve enum
> válido. **O servidor não produz esse valor.** O que permanece real é a falta
> de defesa no cliente: `SuggestPriorityOutputSchema` existe no servidor mas
> não é aplicado à resposta do handler, e a DEC-005 duplica o contrato
> manualmente — então uma divergência futura passaria sem detecção. A lição
> está na [análise, seção 4](../analise-prompts.md#4-o-erro-que-a-revisão-pegou):
> um prompt que define o escopo como "o cliente" produz conclusões sobre o
> cliente, e eu as generalizei para o sistema sem ler o outro lado.

A correção mínima proposta pela LLM é correta e cabe em três linhas: declarar
um `SuggestPriorityOutputSchema` com zod no cliente e trocar
`return result.data` por `return SuggestPriorityOutputSchema.parse(result.data)`.
Isso move a falha para a borda, onde ela pertence. Registrado no backlog.

### Ajustes manuais necessários

- **Removi duas divergências** que eram variações da mesma classe
  (`priority: null` e `priority: undefined` — ambas caem no mesmo teste de
  "valor fora do enum").
- **Corrigi a afirmação sobre campo extra.** A LLM escreveu que um campo extra
  na resposta "quebraria o parse". Não quebra: `z.object` sem `.strict()`
  ignora campos desconhecidos, e o cast de TypeScript também. Então **CI-26
  documenta tolerância, não falha** — é o caso que prova que o contrato é
  deliberadamente permissivo nessa direção, o que é bom (permite evolução do
  servidor sem romper clientes antigos).
- **Abandonei o duplo de `Functions`.** A LLM propôs mockar `httpsCallable`
  via `spyOn` no módulo, o que não funciona com imports ESM nativos. Tentei a
  injeção de um `Functions` falso no `TestBed` (o padrão que o projeto usa em
  `task.service.spec.ts` para `Auth` e `Firestore`), mas isso não resolve: o
  `httpsCallable` é chamado como função importada, não como método do objeto
  injetado, então substituir o provider não intercepta nada. O que ficou é
  mais modesto e está declarado no spec: uma função local que reproduz
  exatamente o cast do serviço (`payload as SuggestPriorityOutput`). **Não há
  duplo de `Functions` na suíte** — o que está sob teste é a consequência da
  ausência de validação, não a mecânica da callable.

### Lições aprendidas

- **Proibir explicitamente o ferramental errado** (`HttpTestingController`) foi
  o único ajuste que resolveu a v1. Dizer qual é o mecanismo correto não bastou
  na primeira tentativa; foi preciso nomear o que **não** usar. O viés para o
  padrão comum é forte o suficiente para sobrepor o código colado.
- **Pedir "onde estoura vs. onde foi causado"** (restrição 1) transformou o
  output. Sem essa coluna, a LLM gerava testes de contrato convencionais;
  com ela, produziu o insight de que a ausência de validação na borda desloca
  todas as falhas para outro componente. Esse é o achado de maior valor
  arquitetural de todo o exercício.
- **Chain-of-thought explícito ("pense passo a passo antes de responder")**
  importa mais aqui que nos outros tipos. Contrato é raciocínio sobre
  divergência entre duas representações; pedir a resposta direta produz a
  lista óbvia, pedir o raciocínio produz a conclusão sistêmica.
- **A LLM erra para o lado da severidade.** Afirmou que campo extra quebraria
  o parse, quando na verdade é tolerado. Esse viés é mais seguro que o
  inverso (dizer que algo é seguro quando não é), mas ainda produz testes que
  asseguram o comportamento errado — e um teste que afirma o contrário da
  realidade é pior que teste nenhum, porque falha quando o código está certo.
