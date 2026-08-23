# Dúvidas, Ambiguidades e Lacunas — fed-catalogo-tarefas

Resultado da atividade 2 do exercício prático da Unidade III: pontos que a
análise **não** consegue resolver sozinha e que precisam de decisão do
stakeholder antes de virarem requisito.

Cada item traz o que está escrito hoje, por que isso é insuficiente e a pergunta
objetiva que precisa ser respondida.

---

## A — Ambiguidades no material existente

### A-01 · "Responsiva" não tem limiar

**Está escrito:** o fora-de-escopo do MVP diz "app mobile nativo (apenas web
responsiva)".
**Problema:** a frase define o que o produto *não é*, não o que ele precisa
entregar. Não é verificável — duas pessoas testariam telas diferentes.
**Pergunta:** qual a menor largura de viewport que precisa funcionar sem
rolagem horizontal, e em quais navegadores?
**Proposta do analista:** 360 px, Chrome e Safari mobile atuais → RNF-012.

### A-02 · "TTI < 3 s em rede 3G simulada" não fixa o método

**Está escrito:** RNF-004.
**Problema:** o resultado registrado no README foi medido com *Slow 4G* e
throttling simulado, e a própria medição emitiu aviso de timeout. O requisito
diz 3G. Requisito e evidência não falam da mesma coisa.
**Pergunta:** o critério é 3G ou Slow 4G? A medição vale como auditoria única
ou exige mediana de N execuções?

### A-03 · "Prioridade" não tem semântica definida

**Está escrito:** RN-04 fixa os quatro valores possíveis.
**Problema:** nada define o que distingue `high` de `urgent`. Sem isso, nem o
usuário nem o modelo de IA nem a heurística têm um critério comum — e a
sugestão não é auditável, porque não existe resposta "certa" contra a qual
compará-la.
**Pergunta:** existe uma definição de negócio para cada nível, ou a prioridade é
deliberadamente subjetiva e pessoal?
**Impacto se não resolvida:** RF-007 é implementável, mas não é plenamente
*verificável* — o que o coloca em desacordo com o critério de qualidade
"verificável" da ISO/IEC/IEEE 29148.

### A-04 · Escopo de "conta" versus "sessão"

**Está escrito:** RF-005 fala em autenticar por e-mail/senha ou Google.
**Problema:** não se sabe se as duas formas de entrada dão acesso à mesma conta
quando o e-mail é o mesmo, ou se produzem dois usuários distintos com dois
conjuntos de tarefas.
**Pergunta:** contas com o mesmo e-mail em provedores diferentes devem ser
vinculadas?

---

## B — Lacunas: comportamentos sem nenhuma definição

### L-01 · Recuperação de senha

Não há nenhuma menção a redefinição de senha em nenhuma fonte. Um sistema com
login por e-mail e senha sem recuperação deixa o usuário permanentemente fora
da própria conta.
**Pergunta:** entra no MVP ou é aceito como dívida conhecida?

### L-02 · Exclusão de conta e dos dados

Não há requisito de exclusão de conta nem de remoção das tarefas associadas.
Considerando que o sistema armazena dados pessoais vinculados a um `uid`, isso
tem implicação de LGPD.
**Pergunta:** o usuário precisa poder excluir a conta e seus dados? Em que prazo?

### L-03 · Comportamento na falha da sugestão

RN-08 cobre o caso "provedor indisponível → heurística". Não há definição para
"a própria função falhou" (erro de rede do cliente, timeout, App Check
inválido).
**Pergunta:** o formulário deve exibir erro, manter a prioridade atual em
silêncio, ou desabilitar o botão?

### L-04 · Limite de tamanho de título e descrição

RN-03 exige título não vazio. Nada define máximo. Descrições muito longas
afetam o custo por chamada ao modelo (RNF-011) e podem estourar o contexto.
**Pergunta:** qual o limite de caracteres de cada campo?

### L-05 · Prazo, vencimento e conclusão

O modelo `Task` tem `status`, mas nenhuma fonte define quais valores `status`
assume nem se existe conceito de prazo.
**Pergunta:** quais são os estados de uma tarefa e quais transições são válidas?

### L-06 · Filtro e busca na lista

Conforme registrado em [`requisitos-funcionais.md`](./requisitos-funcionais.md),
"filtrar por status" foi levantado como candidato e rejeitado por falta de
fonte.
**Pergunta:** a lista precisa de filtro, ordenação alternativa ou busca, ou a
ordenação fixa de RN-06 basta para o MVP?

### L-07 · Edição de tarefa concluída

Conforme registrado em [`regras-de-negocio.md`](./regras-de-negocio.md).
**Pergunta:** uma tarefa concluída permanece editável?

### L-08 · Retenção e volume

Não há definição de quanto tempo as tarefas são mantidas nem de volume esperado
por usuário — informação necessária para dimensionar índices e custo do
Firestore.
**Pergunta:** qual o volume esperado por usuário no primeiro ano?

---

## C — Inconsistências entre fontes

Divergências reais encontradas ao cruzar os documentos de elicitação. Ao
contrário das ambiguidades e lacunas, estas **não** dependem do stakeholder:
são erros de documentação e podem ser corrigidas diretamente.

### I-01 · O escopo do MVP cita o provedor de IA errado

**Onde:** [`docs/escopo-MVP.md`](../../escopo-MVP.md), seção Objetivo — "chama a
**OpenAI** quando há chave configurada".
**Contra:** o [README](../../../README.md), o
[backlog](../../backlog.md) (Release 3) e a decisão
[DEC-005](../../decisoes.md) dizem **Claude Haiku 4.5 (Anthropic)**, e o próprio
README registra a troca como decisão consciente ("em troca o usuário pediu
Claude em vez de OpenAI").
**Diagnóstico:** o escopo não foi atualizado quando a decisão mudou. É o
documento de nível mais alto do projeto apontando para o provedor errado.
**Ação:** corrigir `escopo-MVP.md`. Não requer decisão de stakeholder.

### I-02 · RF-007 no escopo não menciona a origem da sugestão

**Onde:** `escopo-MVP.md` descreve RF-007 apenas como "solicitar uma sugestão de
prioridade via IA".
**Contra:** o backlog exige que o cliente exiba `source` honestamente, e o README
trata isso como característica central do produto.
**Diagnóstico:** um requisito de transparência tratado como detalhe de
implementação. Resolvido nesta análise pela criação de
[RF-008](./requisitos-funcionais.md).

### I-03 · Métrica de desempenho medida em condição diferente da especificada

**Onde:** RNF-004 exige 3G; a auditoria registrada no README foi feita em
Slow 4G.
**Diagnóstico:** requisito e evidência não são comparáveis. Relacionado a A-02,
mas listado aqui porque a divergência é factual, não uma ambiguidade de redação.
**Ação:** refazer a medição na condição especificada, ou corrigir o requisito
para a condição efetivamente adotada — e registrar qual das duas.

---

## D — Prioridade de resolução

| Ordem | Item | Por quê |
|---|---|---|
| 1 | A-03 | Bloqueia a verificabilidade de RF-007, que é a funcionalidade central do projeto. |
| 2 | L-05 | `status` já existe no código sem definição de domínio — divergência entre implementação e especificação. |
| 3 | L-01 e L-02 | Risco de aprisionamento do usuário e exposição a LGPD. |
| 4 | L-03 e L-04 | Afetam robustez e custo, ambos com risco já mapeado (R-01, R-08). |
| 5 | A-01, A-02 | Tornam RNF-004 e RNF-012 verificáveis. |
| 6 | A-04, L-06, L-07, L-08 | Podem aguardar sem bloquear a evolução atual. |
