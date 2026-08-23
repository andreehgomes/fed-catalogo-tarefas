# Critérios de Aceitação — fed-catalogo-tarefas

Artefato de especificação escolhido na atividade 4 do exercício prático da
Unidade III. A justificativa da escolha está no
[README desta pasta](../README.md).

**Formato:** `Dado <contexto> · Quando <ação> · Então <resultado esperado>`
(estrutura *given–when–then*, conforme a Unidade 3.2.3).

Cada bloco complementa a história de usuário de mesmo número em
[`historias-de-usuario.md`](./historias-de-usuario.md) e serve de base direta
para os casos de teste.

---

## HU-01 — Criar conta

**AC-01**

| # | Dado | Quando | Então |
|---|---|---|---|
| 1 | Um visitante na tela de acesso, no modo de cadastro | Informa um e-mail ainda não cadastrado e uma senha válida e confirma | O sistema cria a conta, inicia a sessão e leva o visitante à lista de tarefas, que se apresenta vazia |
| 2 | Um visitante no modo de cadastro | Informa um e-mail já cadastrado | O sistema não cria a conta e informa que o e-mail já está em uso |
| 3 | Um visitante no modo de cadastro | Informa uma senha abaixo do mínimo exigido pelo provedor de autenticação | O sistema não cria a conta e informa o requisito de senha não atendido |

---

## HU-02 — Entrar no sistema

**AC-02**

| # | Dado | Quando | Então |
|---|---|---|---|
| 1 | Um visitante cadastrado na tela de acesso | Informa e-mail e senha corretos | O sistema inicia a sessão e apresenta a lista de tarefas do usuário |
| 2 | Um visitante cadastrado na tela de acesso | Informa senha incorreta | O sistema mantém o visitante na tela de acesso e informa que as credenciais não conferem, sem revelar se o e-mail existe |
| 3 | Um visitante na tela de acesso | Escolhe entrar com a conta Google e conclui o consentimento | O sistema inicia a sessão e apresenta a lista de tarefas do usuário |
| 4 | Um visitante sem sessão | Tenta acessar diretamente a rota da lista de tarefas | O sistema redireciona para a tela de acesso |
| 5 | Um usuário com sessão ativa | Tenta acessar a tela de acesso | O sistema redireciona para a lista de tarefas |

---

## HU-03 — Sair do sistema

**AC-03**

| # | Dado | Quando | Então |
|---|---|---|---|
| 1 | Um usuário com sessão ativa | Aciona "Sair" no cabeçalho | O sistema encerra a sessão e apresenta a tela de acesso |
| 2 | Um usuário que acabou de sair | Aciona o botão "voltar" do navegador | O sistema não reapresenta a lista de tarefas e mantém a tela de acesso |

---

## HU-04 — Registrar uma tarefa

**AC-04**

| # | Dado | Quando | Então |
|---|---|---|---|
| 1 | Um usuário no formulário de nova tarefa | Informa título, descrição e prioridade e confirma | O sistema registra a tarefa vinculada ao usuário e ela passa a figurar no topo da lista |
| 2 | Um usuário no formulário de nova tarefa | Deixa o título vazio ou apenas com espaços e confirma | O sistema não registra a tarefa e sinaliza o título como obrigatório |
| 3 | Um usuário no formulário de nova tarefa | Confirma sem escolher prioridade | O sistema registra a tarefa com a prioridade padrão do formulário, dentro dos quatro valores admitidos |

---

## HU-05 — Ver minhas tarefas

**AC-05**

| # | Dado | Quando | Então |
|---|---|---|---|
| 1 | Um usuário com tarefas registradas | Acessa a lista de tarefas | O sistema apresenta apenas as tarefas do próprio usuário, da criação mais recente para a mais antiga |
| 2 | Um usuário sem nenhuma tarefa | Acessa a lista de tarefas | O sistema apresenta uma mensagem explícita de lista vazia, e não uma área em branco |
| 3 | Um usuário com a lista aberta | Registra uma nova tarefa | A lista passa a exibir a nova tarefa sem que o usuário precise recarregar a página |

---

## HU-06 — Atualizar uma tarefa

**AC-06**

| # | Dado | Quando | Então |
|---|---|---|---|
| 1 | Um usuário e uma tarefa sua | Altera título, descrição, prioridade ou status e confirma | O sistema grava a alteração e registra o instante da atualização |
| 2 | Um usuário e uma tarefa sua | Apaga o título e confirma | O sistema recusa a alteração e mantém o valor anterior |
| 3 | Um usuário | Tenta alterar uma tarefa que pertence a outro usuário | O sistema recusa a operação com erro explícito de acesso não autorizado |

---

## HU-07 — Excluir uma tarefa

**AC-07**

| # | Dado | Quando | Então |
|---|---|---|---|
| 1 | Um usuário e uma tarefa sua | Aciona a exclusão da tarefa | O sistema remove a tarefa e ela deixa de figurar na lista |
| 2 | Um usuário | Tenta excluir uma tarefa que pertence a outro usuário | O sistema recusa a operação com erro explícito de acesso não autorizado |
| 3 | Um usuário que acabou de excluir sua única tarefa | Observa a lista | O sistema apresenta o estado de lista vazia |

---

## HU-08 — Manter minhas tarefas privadas

**AC-08**

| # | Dado | Quando | Então |
|---|---|---|---|
| 1 | Dois usuários distintos, cada um com tarefas próprias | Um deles acessa a lista | O sistema apresenta somente as tarefas daquele usuário |
| 2 | Uma requisição de leitura em `/tasks` sem contexto de autenticação | É submetida diretamente ao banco | O banco recusa a leitura |
| 3 | Uma requisição de escrita cujo `userId` difere do usuário autenticado | É submetida diretamente ao banco | O banco recusa a escrita |

---

## HU-09 — Pedir uma sugestão de prioridade

**AC-09**

| # | Dado | Quando | Então |
|---|---|---|---|
| 1 | Um usuário com título e descrição preenchidos | Aciona "Sugerir com IA" | O sistema devolve uma prioridade entre os quatro valores admitidos e preenche o campo de prioridade do formulário |
| 2 | Uma requisição de sugestão sem contexto de autenticação válido | Chega à função de sugestão | A função recusa a requisição e não consulta o provedor externo |
| 3 | Uma requisição de sugestão sem token de App Check válido | Chega à função de sugestão | A função recusa a requisição e não consulta o provedor externo |

> **Pendência conhecida.** A verificação de que a prioridade devolvida é a
> *correta* não é especificável enquanto A-03 de
> [`duvidas-e-lacunas.md`](../analise/duvidas-e-lacunas.md) não for resolvida —
> não há definição de negócio que distinga `high` de `urgent`. Os critérios
> acima verificam o contrato, não o acerto do julgamento.

---

## HU-10 — Saber de onde veio a sugestão

**AC-10**

| # | Dado | Quando | Então |
|---|---|---|---|
| 1 | Uma sugestão produzida pelo modelo de IA | É apresentada ao usuário | A interface identifica a sugestão como proveniente do modelo, nomeando-o |
| 2 | Uma sugestão produzida pelo mecanismo heurístico | É apresentada ao usuário | A interface identifica a sugestão como proveniente da heurística, sem atribuí-la ao modelo |

---

## HU-11 — Ter a palavra final

**AC-11**

| # | Dado | Quando | Então |
|---|---|---|---|
| 1 | Um usuário que recebeu uma sugestão de prioridade | Altera manualmente o campo de prioridade e salva | O sistema grava o valor escolhido pelo usuário, não o sugerido |
| 2 | Um usuário que recebeu uma sugestão de prioridade | Descarta o formulário sem salvar | Nenhuma tarefa é criada ou alterada |

---

## HU-12 — Receber sugestão mesmo com a IA fora do ar

**AC-12**

| # | Dado | Quando | Então |
|---|---|---|---|
| 1 | O provedor externo de IA sem credencial configurada | O usuário pede uma sugestão | O sistema devolve uma prioridade produzida pela heurística e a identifica como tal |
| 2 | O mesmo par de título e descrição | É submetido duas vezes à heurística | O sistema devolve a mesma prioridade nas duas vezes |
| 3 | O provedor externo de IA respondendo com erro | O usuário pede uma sugestão | O sistema devolve uma sugestão pela heurística em vez de deixar o usuário sem resposta |

> **Pendência conhecida.** O critério 3 depende de L-03 de
> [`duvidas-e-lacunas.md`](../analise/duvidas-e-lacunas.md): a queda para
> heurística está definida para "provedor não configurado", mas o comportamento
> diante de erro ou timeout do provedor ainda não foi decidido com o
> stakeholder. O critério está escrito como a expectativa proposta, não como
> comportamento confirmado.
