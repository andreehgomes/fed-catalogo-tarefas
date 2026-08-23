# Histórias de Usuário — fed-catalogo-tarefas

Artefato de especificação escolhido na atividade 4 do exercício prático da
Unidade III. A justificativa da escolha está no
[README desta pasta](../README.md).

**Formato:** `Como <tipo de usuário>, quero <funcionalidade>, para <benefício>.`

**Personas do sistema:**

- **Visitante** — pessoa sem sessão ativa.
- **Usuário** — pessoa autenticada, proprietária de suas tarefas.

Não há perfil administrativo: o sistema é de uso pessoal e todo usuário tem
exatamente as mesmas capacidades sobre o próprio conjunto de dados.

---

## Acesso

### HU-01 — Criar conta
> **Como** visitante, **quero** criar uma conta com meu e-mail e uma senha,
> **para** guardar minhas tarefas e reencontrá-las em qualquer dispositivo.

`RF-011` · Critérios: [AC-01](./criterios-de-aceitacao.md#hu-01--criar-conta)

### HU-02 — Entrar no sistema
> **Como** visitante já cadastrado, **quero** entrar com meu e-mail e senha ou
> com minha conta Google, **para** acessar minhas tarefas sem precisar lembrar
> de mais uma senha.

`RF-005` · Caso de uso: [UC-01](./casos-de-uso.md#uc-01--autenticar-se) ·
Critérios: [AC-02](./criterios-de-aceitacao.md#hu-02--entrar-no-sistema)

### HU-03 — Sair do sistema
> **Como** usuário, **quero** encerrar minha sessão, **para** que ninguém que
> use este dispositivo depois de mim veja minhas tarefas.

`RF-010` · Critérios: [AC-03](./criterios-de-aceitacao.md#hu-03--sair-do-sistema)

---

## Gestão de tarefas

### HU-04 — Registrar uma tarefa
> **Como** usuário, **quero** registrar uma tarefa com título, descrição e
> prioridade, **para** tirar da cabeça o que preciso fazer.

`RF-001` · Critérios: [AC-04](./criterios-de-aceitacao.md#hu-04--registrar-uma-tarefa)

### HU-05 — Ver minhas tarefas
> **Como** usuário, **quero** ver minhas tarefas com as mais recentes primeiro,
> **para** retomar rapidamente de onde parei.

`RF-002`, `RF-012` · Critérios: [AC-05](./criterios-de-aceitacao.md#hu-05--ver-minhas-tarefas)

### HU-06 — Atualizar uma tarefa
> **Como** usuário, **quero** alterar o título, a descrição, a prioridade e o
> status de uma tarefa minha, **para** manter a lista fiel ao que realmente
> está acontecendo.

`RF-003` · Caso de uso: [UC-02](./casos-de-uso.md#uc-02--atualizar-uma-tarefa) ·
Critérios: [AC-06](./criterios-de-aceitacao.md#hu-06--atualizar-uma-tarefa)

### HU-07 — Excluir uma tarefa
> **Como** usuário, **quero** excluir uma tarefa minha, **para** que a lista não
> acumule coisas que perderam o sentido.

`RF-004` · Critérios: [AC-07](./criterios-de-aceitacao.md#hu-07--excluir-uma-tarefa)

### HU-08 — Manter minhas tarefas privadas
> **Como** usuário, **quero** que apenas eu veja e altere minhas tarefas,
> **para** poder registrar assuntos pessoais sem receio.

`RF-006`, `RNF-006` · Regras: `RN-01`, `RN-02` ·
Critérios: [AC-08](./criterios-de-aceitacao.md#hu-08--manter-minhas-tarefas-privadas)

---

## Sugestão de prioridade assistida por IA

### HU-09 — Pedir uma sugestão de prioridade
> **Como** usuário, **quero** pedir uma sugestão de prioridade a partir do que
> escrevi no título e na descrição, **para** não travar decidindo a importância
> de cada tarefa.

`RF-007` · Caso de uso: [UC-03](./casos-de-uso.md#uc-03--obter-sugestão-de-prioridade) ·
Critérios: [AC-09](./criterios-de-aceitacao.md#hu-09--pedir-uma-sugestão-de-prioridade)

### HU-10 — Saber de onde veio a sugestão
> **Como** usuário, **quero** saber se a sugestão veio do modelo de IA ou do
> mecanismo interno, **para** calibrar quanta confiança deposito nela.

`RF-008` · Regra: `RN-09` ·
Critérios: [AC-10](./criterios-de-aceitacao.md#hu-10--saber-de-onde-veio-a-sugestão)

### HU-11 — Ter a palavra final
> **Como** usuário, **quero** poder ignorar a sugestão e escolher outra
> prioridade, **para** que a ferramenta me ajude sem decidir por mim.

`RF-009` · Regra: `RN-07` ·
Critérios: [AC-11](./criterios-de-aceitacao.md#hu-11--ter-a-palavra-final)

### HU-12 — Receber sugestão mesmo com a IA fora do ar
> **Como** usuário, **quero** continuar recebendo uma sugestão quando o serviço
> de IA estiver indisponível, **para** que minha rotina não dependa da
> estabilidade de um serviço externo.

`RNF-009` · Regras: `RN-08`, `RN-11` ·
Caso de uso: [UC-03, fluxo alternativo A2](./casos-de-uso.md#uc-03--obter-sugestão-de-prioridade) ·
Critérios: [AC-12](./criterios-de-aceitacao.md#hu-12--receber-sugestão-mesmo-com-a-ia-fora-do-ar)

---

## Rastreabilidade — história × requisito

| História | Requisito(s) | Regra(s) | Caso de uso |
|---|---|---|---|
| HU-01 | RF-011 | — | — |
| HU-02 | RF-005 | — | UC-01 |
| HU-03 | RF-010 | — | — |
| HU-04 | RF-001 | RN-01, RN-03, RN-04 | — |
| HU-05 | RF-002, RF-012 | RN-06 | — |
| HU-06 | RF-003 | RN-02, RN-05 | UC-02 |
| HU-07 | RF-004 | RN-02 | — |
| HU-08 | RF-006, RNF-006 | RN-01, RN-02 | — |
| HU-09 | RF-007 | RN-04, RN-10 | UC-03 |
| HU-10 | RF-008 | RN-09 | UC-03 |
| HU-11 | RF-009 | RN-07 | UC-03 |
| HU-12 | RNF-009 | RN-08, RN-11 | UC-03 |

Todos os doze requisitos funcionais de
[`analise/requisitos-funcionais.md`](../analise/requisitos-funcionais.md)
estão cobertos por ao menos uma história.
