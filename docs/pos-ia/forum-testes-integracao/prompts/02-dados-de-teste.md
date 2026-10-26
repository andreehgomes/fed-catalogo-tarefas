# Tipo B — Prompt de geração de dados de teste

## [P-104] Dados de teste — v1

- **Modelo:** Claude Opus 5 via Claude Code
- **Data:** 2026-10-23
- **Fronteira alvo:** F1, F3
- **Veredito:** descartada

### Prompt enviado

> Gere dados de teste para o schema de tarefa abaixo.
>
> ```typescript
> [TaskCreateSchema colado]
> ```

### Resultado obtido

Dez objetos de tarefa, todos válidos, com títulos realistas ("Revisar
relatório trimestral", "Agendar dentista"). Zero valores de fronteira, zero
inválidos.

Úteis como *fixtures* de demonstração; inúteis como dados de teste.

### Ajustes manuais necessários

Nenhum — descartada. "Gere dados de teste" é interpretado como "gere dados
plausíveis", não "gere dados que estressem os limites".

### Lições aprendidas

- A palavra "teste" não comunica "adversarial" para a LLM. É preciso nomear as
  classes de valor desejadas.

---

## [P-105] Dados de teste — v2 (final, usada na suíte)

- **Modelo:** Claude Opus 5 via Claude Code
- **Data:** 2026-10-23
- **Fronteira alvo:** F1, F3
- **Veredito:** aceita — origem dos casos CI-09 a CI-14

### Prompt enviado

> Você é um engenheiro de QA especializado em **análise de valor-limite** e
> particionamento por equivalência.
>
> ## Schemas reais do sistema
>
> ```typescript
> [src/app/models/task.ts colado integralmente]
> ```
>
> ## Comportamento relevante do serviço
>
> O `TaskService.create()` faz `TaskCreateSchema.parse(input)` **antes** de
> tocar o Firestore, e preenche `userId`, `createdAt` e `updatedAt` por conta
> própria. O `update()` usa `TaskUpdateSchema`, que é `.partial()` com um
> `.refine()` exigindo ao menos uma chave.
>
> ## Tarefa
>
> Para **cada campo** dos schemas, gere uma matriz de dados de teste com estas
> três classes, explicitamente separadas:
>
> | Classe | O que quero |
> |--------|-------------|
> | **Válido típico** | 1 valor no centro da partição válida |
> | **Fronteira** | os valores exatamente **no** limite e **um além** dele (ex.: para `max(120)`: 119, 120, 121 caracteres) |
> | **Inválido** | valores que o schema deve rejeitar, com o erro zod esperado |
>
> ## Restrições obrigatórias
>
> 1. Considere os efeitos de `.trim()`: um título de 3 espaços tem
>    `length === 3` antes do trim e `0` depois. Qual vence?
> 2. Considere os `.default()`: o que acontece quando o campo é `undefined` vs.
>    `null` vs. ausente?
> 3. Para os enums, inclua um valor de string que **não** pertence ao enum.
> 4. Para `description`, considere o caso `max(2000)` com caracteres
>    multibyte (emoji, acentos) — `length` em JS conta unidades UTF-16.
> 5. Indique, para cada linha, se o dado é destinado a `create` ou `update`
>    (ou ambos).
>
> ## Formato de saída
>
> Tabela: `Campo | Classe | Valor (ou expressão JS) | Operação | Resultado esperado`.
> Depois da tabela, liste os dados como constantes TypeScript prontas para
> importar em um `*.spec.ts`.

### Resultado obtido

Matriz com 34 linhas de dados, que condensei nos casos CI-09 a CI-14. Os
achados mais relevantes vieram das restrições 1 e 4:

- **Restrição 1 (`.trim()`)** revelou que `'   '` (três espaços) **é
  rejeitado** por `TaskCreateSchema`, porque o zod aplica `.trim()` antes do
  `.min(1)`. Eu supunha o contrário. Isso virou o caso **CI-10**, que passa e
  documenta o comportamento correto.
- **Restrição 4 (multibyte)** gerou o caso mais sutil: uma `description` de
  1000 emojis tem `length === 2000` em JS (cada emoji é um par surrogate),
  passando raspando no `max(2000)` — enquanto o usuário vê 1000 caracteres.
  O comportamento é tecnicamente correto, mas a mensagem de erro para o
  usuário seria confusa. Registrado como **CI-13** e anotado no backlog do
  projeto.
- **Restrição 2 (`default`)** mostrou que `priority: null` **falha**
  (`.default()` só cobre `undefined`), enquanto `priority: undefined` resolve
  para `'medium'`. Virou **CI-11**, relevante porque formulários Angular
  frequentemente emitem `null` em campos não preenchidos.

### Ajustes manuais necessários

- **Removi 20 das 34 linhas** por redundância: a LLM gerou fronteiras para
  `title` (`min(1)`/`max(120)`) e repetiu a mesma estrutura para
  `description` (`max(2000)`) sem acrescentar informação. Mantive uma fronteira
  por *tipo* de limite, não por campo.
- **Corrigi o erro zod esperado** em quatro linhas: a LLM escreveu
  `ZodError: invalid_enum_value`, mas o zod 4 (versão do projeto) emite
  `invalid_value` para `z.enum`. Tive de conferir na prática — a LLM usou a
  nomenclatura do zod 3.
- **Descartei duas linhas sobre `id`**: a LLM gerou dados de teste para o
  campo `id` do `TaskOutSchema`, mas `id` nunca vem do cliente — é o
  `ref.id` do Firestore. Dado de teste para campo que o cliente não controla
  é ruído.

### Lições aprendidas

- Nomear as **classes de valor** ("válido típico / fronteira / inválido") é o
  que transforma "gere dados" em "gere dados de teste". É o ajuste de maior
  impacto neste tipo de prompt.
- Pedir à LLM para considerar **interações entre validadores** (`.trim()`
  antes de `.min()`, `.default()` vs. `null`) produz achados que eu não teria
  encontrado lendo o schema. Aqui a LLM foi genuinamente melhor que eu.
- Mas ela erra **versões de biblioteca** com confiança total. O nome do código
  de erro do zod 4 saiu errado e soou plausível. Toda asserção sobre mensagem
  ou código de erro de terceiros precisa ser executada, nunca aceita.
- A LLM super-gera por simetria: se há três campos com limites, ela produz a
  matriz completa dos três, mesmo quando dois são o mesmo teste. Deduplicar é
  trabalho humano.
