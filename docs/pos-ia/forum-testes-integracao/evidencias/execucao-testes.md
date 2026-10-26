# Evidência de execução da suíte

Execução real em 2026-10-23, no repositório, após os ajustes manuais
descritos nos arquivos de prompt e as correções apontadas pela revisão
(ver [análise, seção 4](../analise-prompts.md#4-o-erro-que-a-revisão-pegou)).

## Comandos

```bash
cd fed-catalogo-tarefas-app && npm run test:integration
```

Esse script roda as duas verificações em sequência: a paridade do harness
contra o serviço real e, depois, a suíte Karma.

### 1. Paridade harness ↔ `TaskService` de produção

```
> node scripts/check-harness-parity.mjs

  ok  create()  [requireUserId → parseCreate → write]
  ok  getById()  [requireUserId → read → checkMissing → checkOwnership → mapOut]
  ok  update()  [requireUserId → parseUpdate → read → checkMissing → checkOwnership → write]
  ok  delete()  [requireUserId → read → checkMissing → checkOwnership → write]
  ok  update() mantém a janela de concorrência de CI-07/CI-17
  ok  update() ainda não converte not-found (backlog item 6 pendente)

Paridade OK: o harness reflete a sequência de operações do serviço real.
```

### 2. Suíte Karma

```
23 10 2026 18:28:35.851:INFO [Chrome Headless 155.0.0.0 (Windows 10)]: Connected on socket r7b-RfZAm7hXmBiuAAAB with id 22233989
Chrome Headless 155.0.0.0 (Windows 10): Executed 50 of 50 SUCCESS (0.195 secs / 0.153 secs)
TOTAL: 50 SUCCESS
```

## Composição dos 50 testes

| Arquivo | `it()` | Tipo de prompt de origem |
|---------|--------:|--------------------------|
| `integration/cenarios.integration.spec.ts` | 7 | A — cenários (P-103) |
| `integration/dados-de-teste.integration.spec.ts` | 11 | B — dados de teste (P-105) |
| `integration/casos-de-erro.integration.spec.ts` | 7 | C — casos de erro (P-107) |
| `integration/contrato-callable.integration.spec.ts` | 7 | D — contrato (P-109) |
| `integration/signal-reativo.integration.spec.ts` | 2 | A — CI-08, com `toSignal` real |
| **Subtotal — testes de integração desta entrega** | **34** | |
| `app.spec.ts`, `models/task.spec.ts`, `services/task.service.spec.ts` | 16 | pré-existentes no projeto |
| **Total** | **50** | |

Mais as 6 verificações do `check-harness-parity.mjs`, que rodam fora do Karma
(precisam de acesso ao filesystem).

O número de `it()` (34) é maior que o de casos `CI-nn` (27 gerados pelos
prompts) porque alguns casos viraram vários `it` — CI-09, CI-11, CI-13 e CI-14
têm um `it` por classe de valor (aceito / rejeitado), o que mantém cada
asserção isolada — e porque CI-28 testa a correção proposta para a fronteira
F4.

## Verificações complementares

```bash
npx tsc -p tsconfig.spec.json --noEmit    # exit 0 — sem erro de tipo
npx ng build                               # sucesso
```

O build de produção emite um aviso de budget de bundle
(`637.88 kB` contra os `500 kB` configurados). Ele é **pré-existente** e não
tem relação com esta entrega: os arquivos `*.spec.ts`, os fakes e o script de
paridade não entram no bundle de produção.

## Nota sobre os casos ⚠️

Nove casos estão marcados ⚠️ na [tabela de casos](../casos-de-teste.md) —
CI-07, 13, 15, 17, 20, 21, 24, 25 e 27. Eles **passam**, e o que asseguram é
o comportamento atual, que é indesejado. Estão registrados como itens de
backlog. Oito trazem a marca no título do `it()` ou do `describe`; CI-07 a
traz no comentário interno, por ser o mesmo defeito de CI-17 visto de outro
ângulo.

A escolha de deixá-los verdes é deliberada: um teste em vermelho por bug
conhecido dessensibiliza a suíte — depois de algumas semanas ninguém distingue
o vermelho esperado do vermelho novo. Um teste que documenta o comportamento
errado, com comentário apontando o item de backlog, mantém a suíte verde e
**falha no dia em que alguém corrigir o bug** — momento em que o teste deve
ser invertido junto com a correção.

## Correção de fidelidade durante a execução

Vale registrar, porque foi o único erro que a execução pegou e os prompts não.

CI-07 e CI-17 originalmente esperavam `TaskNotFoundError` na deleção
concorrente. Ao comparar linha a linha a sequência de operações do harness com
a do `TaskService` real, encontrei uma divergência: o harness fazia uma
**segunda leitura** antes de escrever, que o serviço real não faz.

Com isso, os dois testes estavam verificando um comportamento do harness, não
do sistema. Corrigido: o fake agora espelha o SDK, cujo `updateDoc` em
documento inexistente rejeita com `not-found`.

A correção revelou um achado que nenhum dos quatro prompts havia produzido:
**o `TaskService` não converte esse `not-found` em `TaskNotFoundError`**, então
a UI — que trata as classes de erro do domínio — recebe um `FirebaseError` cru
que não reconhece. Virou o backlog item 6.

A lição é a mais importante do exercício: a LLM gerou o cenário de
concorrência certo (CI-07 foi um achado dela) mas a asserção errada, e a
asserção errada passava. Só a comparação manual contra o código de produção
revelou isso. Teste verde gerado por LLM não é evidência de que o sistema
funciona — é evidência de que o teste concorda com o modelo que a LLM tem do
sistema.

Foi essa experiência que motivou escrever o `check-harness-parity.mjs`: a
conferência que pegou o erro era manual e não se repetiria sozinha. Agora ela
roda a cada `npm run test:integration` e falha se o harness divergir do
serviço real.
