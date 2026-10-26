# Fórum — Unidade IV: uso ético da GenAI em testes

> Reflexão crítica, sem entregável de código. Copiar daqui para baixo.

---

Olá, pessoal!

Vou usar como contexto a atividade da Unidade III, em que gerei casos de teste
de integração com apoio de uma LLM para a aplicação que venho construindo na
pós — um catálogo de tarefas em Angular com Firebase. Sendo um caso real, os
riscos apareceram de forma concreta.

**Riscos.** Para a IA gerar casos úteis, colei **código-fonte real** nos
prompts: inofensivo num projeto pessoal, mas num contexto corporativo seria
enviar propriedade intelectual do empregador a um terceiro, possivelmente
contra contrato ou política interna. Há também **dados pessoais**: minha
aplicação tem uma Cloud Function que envia o título e a descrição digitados
pelo usuário para a API da Anthropic, a fim de sugerir prioridade — conteúdo
do usuário saindo da minha infraestrutura. A interface informa a origem
*depois* de aplicar a sugestão ("via Claude (Anthropic)"), mas não avisa
*antes* do envio, que é o momento em que o consentimento importaria. Pela
LGPD, é transferência a um operador terceiro, e exigiria transparência e base
legal. E há **rastreabilidade**: se a suíte foi gerada por IA e ninguém
registra quais prompts a produziram, perde-se a capacidade de auditar por que
um teste existe e o que ele protege.

**O risco que mais me marcou foi a alucinação que passa despercebida.** A LLM
propôs um cenário de concorrência legítimo e escreveu a asserção **errada**
para ele — e o teste passou, porque o apoio de teste que eu também gerei com
ela compartilhava a mesma concepção equivocada do sistema. Um teste verde que
afirma o contrário do comportamento real é pior que teste nenhum: dá falsa
confiança e falha justamente quando alguém corrige o código.

**Mitigações que considero essenciais.** Em política: definir o que pode e o
que nunca pode ser colado num prompt, e registrar os prompts usados — mantenho
uma pasta `docs/prompts/` no repositório por isso. Em controle técnico:
minimizar o rastro (na minha função, os logs gravam o *tamanho* do título, não
o título), exigir autenticação antes de chamar o modelo e validar a resposta
da IA em runtime, em vez de confiar no tipo declarado. Em revisão humana:
tratar toda asserção gerada por IA como hipótese até ser executada contra o
código de produção, e manter a IA assistiva — na minha aplicação a sugestão
preenche o campo, mas o usuário revisa e sobrescreve.

No fim, acho que o equilíbrio não está em usar menos IA, mas em assumir que a
verificação é trabalho humano **não delegável**. O ganho real que tive foi
ampliar o espaço de casos considerados, não digitar mais rápido — e esse ganho
só se sustenta se a conferência de fato acontecer.

Abraço!
