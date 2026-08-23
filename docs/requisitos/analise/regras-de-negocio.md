# Regras de Negócio — fed-catalogo-tarefas

Resultado da atividade 2 do exercício prático da Unidade III.

Uma **regra de negócio** é uma restrição sobre o domínio que existe
independentemente da tecnologia escolhida. Ela costuma se manifestar em vários
requisitos ao mesmo tempo — por isso é registrada aqui separadamente, e não
diluída dentro de cada RF.

Nenhuma das regras abaixo estava escrita como regra no material de elicitação:
todas foram **extraídas** de critérios de aceite, de decisões arquiteturais ou
do comportamento descrito no README.

---

| ID | Regra | Requisitos afetados | Onde vive hoje |
|---|---|---|---|
| RN-01 | Toda tarefa pertence a exatamente um usuário, definido no momento da criação e imutável depois disso. | RF-001, RF-003, RF-004, RF-006 | `firestore.rules`, `TaskService` |
| RN-02 | Um usuário só pode ler, alterar ou excluir tarefas das quais seja proprietário. Tentativas sobre tarefas alheias são recusadas, não ignoradas. | RF-002, RF-003, RF-004, RF-006 | `firestore.rules`, `UnauthorizedTaskAccessError` |
| RN-03 | O título de uma tarefa é obrigatório e não pode ser vazio nem composto apenas de espaços. | RF-001, RF-003 | `TaskCreateSchema` (zod) |
| RN-04 | A prioridade de uma tarefa assume exatamente um dos valores `low`, `medium`, `high` ou `urgent`. | RF-001, RF-003, RF-007 | `TaskCreateSchema`, contrato da Cloud Function |
| RN-05 | A data de última atualização de uma tarefa é definida pelo sistema a cada alteração, nunca informada pelo usuário. | RF-003 | `TaskService.update()` |
| RN-06 | A ordenação padrão da lista de tarefas é decrescente por data de criação. | RF-002 | `TaskService.list()`, índice composto `userId+createdAt` |
| RN-07 | A sugestão de prioridade é sempre uma proposta: o valor gravado na tarefa é o que estiver no formulário no momento do salvamento, tenha o usuário aceitado a sugestão ou não. | RF-007, RF-009 | Componente de formulário |
| RN-08 | Quando o provedor externo de IA não estiver disponível ou não estiver configurado, a sugestão é produzida pelo mecanismo heurístico determinístico — nunca é omitida. | RF-007, RNF-009 | `suggestPriority(input, options)` |
| RN-09 | A origem da sugestão é sempre declarada ao usuário, sem substituir uma fonte pela outra na comunicação. | RF-008 | Selo "via Claude" / "via heurística" |
| RN-10 | Uma sugestão de prioridade só é produzida para uma requisição que apresente simultaneamente contexto de autenticação válido e token de App Check válido. | RF-007, RNF-006, RNF-008 | Cloud Function `suggestpriority` |
| RN-11 | O mesmo par (título, descrição) submetido ao mecanismo heurístico produz sempre a mesma prioridade. | RNF-009 | Fallback determinístico |

---

## Regras candidatas que foram descartadas

| Candidata | Motivo |
|---|---|
| "Uma tarefa concluída não pode ser editada" | Não consta em nenhuma fonte. Seria uma regra inventada pelo analista. Levada a [`duvidas-e-lacunas.md`](./duvidas-e-lacunas.md). |
| "Um usuário não pode ter mais de N tarefas" | Sem origem no material. O risco R-08 (custo) trata de abuso da função de IA, não de volume de tarefas. |
| "A prioridade sugerida deve ser sempre maior ou igual à atual" | Contradiz RN-07 e não tem fonte. Descartada. |

---

## Conflito identificado entre regras

**RN-08 × RNF-011.** RN-08 garante que o usuário sempre recebe uma sugestão;
RNF-011 impõe um teto de custo. Se o mecanismo de contenção de custo for
implementado no futuro como bloqueio de chamadas acima de uma cota, ele
**não pode** simplesmente recusar a operação: teria de cair no caminho
heurístico, sob pena de violar RN-08.

O conflito não existe hoje (não há cota implementada), mas está registrado
porque é exatamente o tipo de inconsistência que só aparece quando as regras
são escritas lado a lado — que é o propósito desta etapa da análise.
