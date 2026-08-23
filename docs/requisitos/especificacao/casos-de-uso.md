# Casos de Uso — fed-catalogo-tarefas

Artefato de especificação escolhido na atividade 4 do exercício prático da
Unidade III. A justificativa da escolha — inclusive por que **apenas três**
casos de uso foram escritos — está no [README desta pasta](../README.md).

Casos de uso foram reservados para os fluxos em que existem **fluxos
alternativos reais e regras de negócio densas**. Os demais requisitos ficam
suficientemente especificados pelo par história + critérios de aceitação.

---

## UC-01 — Autenticar-se

| Campo | Descrição |
|---|---|
| **Nome** | Autenticar-se |
| **Objetivo** | Permitir que uma pessoa cadastrada obtenha acesso ao seu conjunto de tarefas. |
| **Ator principal** | Visitante |
| **Atores secundários** | Provedor de identidade (e-mail/senha e Google) |
| **Pré-condição** | O visitante não possui sessão ativa. |
| **Requisitos** | RF-005, RF-011 |
| **História** | [HU-02](./historias-de-usuario.md#hu-02--entrar-no-sistema) |

**Fluxo principal**

1. O visitante acessa a tela de acesso.
2. O sistema apresenta o formulário de entrada, com alternância para cadastro e a opção de entrar com conta Google.
3. O visitante informa e-mail e senha e confirma.
4. O sistema submete as credenciais ao provedor de identidade.
5. O provedor confirma a identidade e devolve o identificador do usuário.
6. O sistema estabelece a sessão e encaminha o visitante à lista de tarefas.

**Fluxos alternativos**

- **A1 — Entrada por conta Google.** No passo 3, o visitante escolhe entrar com Google. O sistema abre o fluxo de consentimento do provedor; concluído o consentimento, segue do passo 5.
- **A2 — Cadastro de nova conta.** No passo 3, o visitante alterna para o modo de cadastro e informa e-mail e senha. O sistema solicita a criação da conta ao provedor e, criada a conta, segue do passo 5. A lista de tarefas se apresenta vazia (RF-012).
- **A3 — Visitante já autenticado.** Se o visitante possuir sessão ativa ao acessar a tela do passo 1, o sistema o encaminha diretamente à lista de tarefas, sem apresentar o formulário.

**Fluxos de exceção**

- **E1 — Credenciais incorretas.** No passo 5, o provedor recusa. O sistema mantém o visitante na tela de acesso e informa que as credenciais não conferem, sem revelar se o e-mail existe. Retorna ao passo 3.
- **E2 — E-mail já cadastrado.** Em A2, o provedor recusa por e-mail em uso. O sistema informa e mantém o visitante no modo de cadastro.
- **E3 — Consentimento cancelado.** Em A1, o visitante cancela o consentimento. O sistema retorna ao passo 2 sem mensagem de erro.
- **E4 — Acesso direto a rota protegida.** Um visitante sem sessão que tente alcançar a lista de tarefas é encaminhado a este caso de uso a partir do passo 1.

**Pós-condição**

Existe uma sessão ativa associada a um identificador de usuário, e esse identificador passa a delimitar todo acesso a tarefas (RN-01, RN-02).

**Questões em aberto**

A-04 de [`duvidas-e-lacunas.md`](../analise/duvidas-e-lacunas.md): não está definido se e-mail e Google com o mesmo endereço devem convergir para a mesma conta. Enquanto isso não for decidido, o fluxo A1 pode produzir um segundo usuário com um conjunto de tarefas separado.

---

## UC-02 — Atualizar uma tarefa

| Campo | Descrição |
|---|---|
| **Nome** | Atualizar uma tarefa |
| **Objetivo** | Permitir que o usuário mantenha os dados de uma tarefa fiéis à situação atual. |
| **Ator principal** | Usuário |
| **Pré-condição** | O usuário possui sessão ativa e é proprietário da tarefa a alterar. |
| **Requisitos** | RF-003, RF-006 |
| **Regras** | RN-02, RN-03, RN-04, RN-05 |
| **História** | [HU-06](./historias-de-usuario.md#hu-06--atualizar-uma-tarefa) |

**Fluxo principal**

1. O usuário seleciona uma tarefa da lista.
2. O sistema apresenta os dados atuais da tarefa em modo de edição.
3. O usuário altera um ou mais entre título, descrição, prioridade e status.
4. O usuário confirma a alteração.
5. O sistema valida os dados informados.
6. O sistema verifica que o usuário é o proprietário da tarefa.
7. O sistema grava a alteração e define o instante de atualização.
8. O sistema atualiza a apresentação da tarefa na lista.

**Fluxos alternativos**

- **A1 — Alteração apenas de status.** O usuário altera o status diretamente na lista, sem abrir o modo de edição. O fluxo segue do passo 4.
- **A2 — Desistência.** No passo 3, o usuário descarta a edição. O sistema mantém os dados anteriores e nada é gravado.

**Fluxos de exceção**

- **E1 — Título inválido.** No passo 5, o título está vazio ou apenas com espaços. O sistema recusa a gravação, sinaliza o campo e retorna ao passo 3.
- **E2 — Prioridade fora do domínio.** No passo 5, a prioridade não corresponde a nenhum dos quatro valores admitidos. O sistema recusa a gravação.
- **E3 — Tarefa de outro usuário.** No passo 6, a tarefa não pertence ao usuário. O sistema recusa a operação com erro explícito de acesso não autorizado. A recusa é **ativa**, não silenciosa: a operação não pode simplesmente não surtir efeito.
- **E4 — Tarefa inexistente.** A tarefa foi excluída em outro dispositivo entre os passos 1 e 4. O sistema informa que a tarefa não está mais disponível e atualiza a lista.

**Pós-condição**

A tarefa reflete os novos valores e carrega o instante da última atualização definido pelo sistema.

**Questões em aberto**

L-05 e L-07 de [`duvidas-e-lacunas.md`](../analise/duvidas-e-lacunas.md): não estão definidos os valores válidos de `status` nem se uma tarefa concluída permanece editável. Enquanto isso, o passo 3 admite qualquer transição de status.

---

## UC-03 — Obter sugestão de prioridade

| Campo | Descrição |
|---|---|
| **Nome** | Obter sugestão de prioridade |
| **Objetivo** | Oferecer ao usuário uma proposta de prioridade a partir do título e da descrição que ele escreveu, preservando-lhe a decisão final. |
| **Ator principal** | Usuário |
| **Atores secundários** | Serviço de verificação de aplicativo; provedor externo de IA |
| **Pré-condição** | O usuário possui sessão ativa e há um formulário de tarefa aberto com título preenchido. |
| **Requisitos** | RF-007, RF-008, RF-009, RNF-008, RNF-009 |
| **Regras** | RN-04, RN-07, RN-08, RN-09, RN-10, RN-11 |
| **Histórias** | [HU-09](./historias-de-usuario.md#hu-09--pedir-uma-sugestão-de-prioridade), [HU-10](./historias-de-usuario.md#hu-10--saber-de-onde-veio-a-sugestão), [HU-11](./historias-de-usuario.md#hu-11--ter-a-palavra-final), [HU-12](./historias-de-usuario.md#hu-12--receber-sugestão-mesmo-com-a-ia-fora-do-ar) |

**Fluxo principal**

1. O usuário aciona a sugestão de prioridade no formulário.
2. O sistema reúne o título e a descrição correntes e submete a solicitação ao serviço de sugestão.
3. O serviço verifica o contexto de autenticação da requisição.
4. O serviço verifica o token de verificação de aplicativo da requisição.
5. O serviço identifica que o provedor externo de IA está disponível e o consulta.
6. O provedor devolve uma prioridade entre os quatro valores admitidos.
7. O serviço devolve ao formulário a prioridade e a indicação de que a origem é o modelo de IA.
8. O sistema preenche o campo de prioridade e apresenta a indicação de origem.
9. O usuário mantém ou altera o valor e salva a tarefa.

**Fluxos alternativos**

- **A1 — Provedor não configurado.** No passo 5, não há credencial do provedor externo. O serviço produz a prioridade pelo mecanismo heurístico determinístico e segue do passo 7, indicando a heurística como origem.
- **A2 — Provedor indisponível.** No passo 6, o provedor não responde ou responde com erro. O serviço produz a prioridade pela heurística e segue do passo 7, indicando a heurística como origem. O usuário nunca fica sem sugestão (RN-08).
- **A3 — Usuário ignora a sugestão.** No passo 9, o usuário escolhe outra prioridade. O valor gravado é o do formulário, não o sugerido (RN-07).

**Fluxos de exceção**

- **E1 — Sem autenticação válida.** No passo 3, a verificação falha. O serviço recusa a requisição e **não** consulta o provedor externo. O formulário mantém a prioridade corrente.
- **E2 — Sem verificação de aplicativo válida.** No passo 4, a verificação falha. Mesmo tratamento de E1.
- **E3 — Resposta fora do domínio.** No passo 6, o provedor devolve um valor que não corresponde a nenhuma das quatro prioridades. O serviço descarta a resposta e segue por A2.

**Pós-condição**

O campo de prioridade do formulário contém um dos quatro valores admitidos, acompanhado da indicação de sua origem. Nenhuma tarefa é gravada por este caso de uso — a gravação pertence a UC-02 ou ao registro de nova tarefa.

**Observações**

- Os passos 3 e 4 precedem a consulta ao provedor por decisão de custo e não apenas de segurança: o objetivo é impedir que requisições não autorizadas consumam crédito da API (RNF-007, RNF-008, risco R-01).
- A escolha entre provedor externo e heurística acontece em **um único ponto de decisão** dentro do serviço, e ambos os caminhos são alcançados pela mesma interface — é o que RNF-010 exige e o que o material da Unidade 3.2 do projeto discute sobre não duplicar lógica entre IA e fallback.

**Questões em aberto**

- A-03 de [`duvidas-e-lacunas.md`](../analise/duvidas-e-lacunas.md): sem definição de negócio para cada nível de prioridade, o passo 6 não tem critério de correção — apenas de domínio.
- L-03: o tratamento de erro do passo 6 está proposto em A2, mas ainda não foi confirmado com o stakeholder.
