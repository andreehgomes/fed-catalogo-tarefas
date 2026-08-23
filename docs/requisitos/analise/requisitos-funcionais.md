# Requisitos Funcionais — fed-catalogo-tarefas

Resultado da atividade 2 do exercício prático da Unidade III (identificação de
requisitos funcionais a partir do material de elicitação).

**Fontes de elicitação analisadas:** [`docs/escopo-MVP.md`](../../escopo-MVP.md),
[`docs/backlog.md`](../../backlog.md), [`docs/decisoes.md`](../../decisoes.md) e
o [README do projeto](../../../README.md).

> **Nota sobre a numeração.** O projeto já possuía os identificadores RF-001..RF-007
> definidos no escopo do MVP. Eles foram **mantidos** para preservar a
> rastreabilidade com o backlog, o código e os testes existentes. Os RFs a partir
> de RF-008 são **novos**: emergiram da análise, ao explicitar comportamentos que
> estavam implícitos no material de elicitação.

---

## Requisitos consolidados

| ID | Requisito | Origem | Estado |
|---|---|---|---|
| RF-001 | O sistema deve permitir que o usuário autenticado crie uma tarefa informando título, descrição e prioridade. | escopo-MVP | Implementado |
| RF-002 | O sistema deve apresentar ao usuário autenticado a lista de suas próprias tarefas, ordenada da mais recente para a mais antiga. | escopo-MVP + backlog | Implementado |
| RF-003 | O sistema deve permitir que o usuário altere título, descrição, prioridade e status de uma tarefa da qual seja proprietário. | escopo-MVP | Implementado |
| RF-004 | O sistema deve permitir que o usuário exclua uma tarefa da qual seja proprietário. | escopo-MVP | Implementado |
| RF-005 | O sistema deve permitir que o usuário se autentique por e-mail e senha ou por conta Google. | escopo-MVP + backlog R2 | Implementado |
| RF-006 | O sistema deve garantir que cada tarefa seja visível e editável apenas pelo usuário que a criou. | escopo-MVP + backlog R2 | Implementado |
| RF-007 | O sistema deve permitir que o usuário solicite uma sugestão de prioridade para a tarefa em edição, a partir do título e da descrição informados. | escopo-MVP + backlog R3 | Implementado |
| RF-008 | O sistema deve informar ao usuário a origem da sugestão de prioridade recebida, distinguindo a sugestão gerada pelo modelo de IA da gerada pelo mecanismo heurístico. | Derivado — backlog R3 e DEC-005 | Implementado |
| RF-009 | O sistema deve permitir que o usuário aceite ou ignore a sugestão de prioridade, mantendo-lhe a decisão final sobre o valor gravado. | Derivado — README ("a IA propõe, o autor decide") | Implementado |
| RF-010 | O sistema deve permitir que o usuário autenticado encerre sua sessão. | Derivado — backlog R2 (header com botão "Sair") | Implementado |
| RF-011 | O sistema deve permitir que um visitante não cadastrado crie uma conta por e-mail e senha. | Derivado — backlog R2 (toggle entrar/cadastrar) | Implementado |
| RF-012 | O sistema deve exibir um estado explícito de lista vazia quando o usuário não possuir nenhuma tarefa. | Derivado — backlog R1 | Implementado |

---

## Detalhamento dos requisitos derivados

Os requisitos abaixo não estavam escritos como requisitos no material de
elicitação; foram **explicitados durante a análise** por descreverem
comportamentos que o sistema já precisa ter e que não estavam sob nenhum
identificador rastreável.

### RF-008 — Transparência da origem da sugestão

O material de elicitação tratava a exibição da origem (`source: 'claude' |
'heuristic'`) como critério de aceite de RF-007. A análise separou os dois:
RF-007 descreve *obter* a sugestão; RF-008 descreve *comunicar de onde ela veio*.
São verificáveis de forma independente — o sistema pode sugerir corretamente e
ainda assim mentir sobre a fonte — e por isso constituem requisitos distintos.

### RF-009 — Decisão final do usuário

Implícito em todo o material, nunca escrito. Sem ele, "aplicar a sugestão"
poderia ser interpretado como gravação automática da prioridade sugerida. O
requisito fixa que a sugestão preenche o campo, mas não o trava.

### RF-010 / RF-011 — Ciclo de vida da sessão e da conta

Apareciam apenas como critérios de aceite de RF-005 ("header mostra usuário
corrente e botão Sair", "toggle entre entrar e cadastrar"). Como são operações
que o usuário executa, e não propriedades do login, foram promovidos a
requisitos próprios.

### RF-012 — Estado vazio

Aparecia como critério de aceite de RF-002. Foi promovido porque descreve um
comportamento observável do sistema em um cenário específico, e é o tipo de
requisito que costuma ser esquecido na implementação quando fica escondido
dentro de outro.

---

## Requisitos considerados e rejeitados

| Candidato | Motivo da rejeição |
|---|---|
| "O sistema deve permitir compartilhar tarefas entre usuários" | Declarado fora-de-escopo no MVP. Registrado aqui apenas para deixar a decisão rastreável. |
| "O sistema deve enviar notificações push de tarefas vencidas" | Fora-de-escopo do MVP. Depende de um conceito de prazo que o modelo `Task` não possui. |
| "O sistema deve funcionar offline" | Fora-de-escopo do MVP. |
| "O sistema deve permitir filtrar tarefas por status" | Não consta em nenhuma fonte de elicitação. Seria invenção do analista, não requisito do negócio. Levado para [`duvidas-e-lacunas.md`](./duvidas-e-lacunas.md) como pergunta ao stakeholder. |
