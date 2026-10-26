# Análise: como cada tipo de prompt influenciou qualidade e diversidade

Resposta às duas perguntas do fórum, com base nos 27 casos gerados, nas 9
iterações de prompt registradas e na execução real da suíte.

---

## 1. Como cada tipo de prompt influenciou a qualidade e a diversidade

### Visão geral

| Tipo de prompt | Casos | Caminho feliz | Falha | Fronteiras | Achados novos¹ | Alucinações² |
|----------------|------:|--------------:|------:|------------|---------------:|-------------:|
| A — Cenários | 8 | 7 | 1 | F1, F2, F3 | 1 | 0 |
| B — Dados de teste | 6 | 4 | 2 | F1, F3 | 3 | 1 |
| C — Casos de erro | 9 | 1 | 8 | F2, F3, F4 | 4 | 1 |
| D — Contrato | 4 | 2 | 2 | F4 | 2 | 1 |

¹ Comportamento que eu não conhecia antes e que se confirmou ao executar.
² Afirmações falsas sobre o sistema, detectadas na revisão ou na execução.

### A diferença mais clara: cada tipo achou uma *classe* distinta de problema

Esse foi o resultado mais nítido do exercício, e não era o que eu esperava.
Supunha que prompts diferentes gerariam variações do mesmo conjunto de casos,
com qualidade variável. O que aconteceu foi outra coisa: **cada tipo de prompt
encontrou uma categoria de defeito que os outros não encontraram**, mesmo com
o mesmo modelo e o mesmo código colado.

- **Tipo A (cenários)** produziu o mapa de fluxos e um achado de concorrência
  (CI-07). Sua força é cobertura estrutural: garante que nenhum fluxo principal
  fique sem teste. Sua fraqueza é o viés sistemático para o caminho feliz —
  7 de 8 casos, mesmo com o código inteiro colado.
- **Tipo B (dados)** achou os defeitos de **validação na borda**: `.trim()`
  antes de `.min()` (CI-10), `null` escapando do `.default()` (CI-11), limite
  UTF-16 (CI-13). Nenhum deles apareceria em um prompt de cenários, porque não
  são fluxos — são valores.
- **Tipo C (casos de erro)** achou os defeitos de **tempo e estado**: timestamp
  pendente (CI-15), concorrência (CI-17), corrupção derrubando a lista inteira
  (CI-20). Foi o tipo mais produtivo em achados reais.
- **Tipo D (contrato)** achou a fragilidade **arquitetural**: a ausência de
  validação em runtime na fronteira F4 faz com que qualquer divergência da
  callable atravesse o cliente em silêncio. É o único achado que aponta uma
  mudança de design, não um ajuste — mas é também onde a LLM (e eu, ao
  aceitá-la) exagerou a severidade: o servidor já valida a resposta do LLM,
  então o cenário dramático que o prompt produziu não ocorre hoje. Ver
  [a seção 4](#4-o-erro-que-a-revisão-pegou).

**A implicação prática:** a pergunta "qual prompt é melhor para testes de
integração" está mal formulada. Os tipos não competem, se complementam. Usar
só o Tipo A — que é o que a maioria faria ao pedir "gere testes de integração"
— produziria uma suíte que passa, parece completa, e não detecta nenhum dos
quatro defeitos que os outros três tipos encontraram (nem o quinto, que
apareceu na conferência de fidelidade do harness).

### Qualidade: o que a mediu de fato

Contar casos gerados não mede qualidade — os 34 dados de teste do Tipo B
viraram 6 casos depois de remover redundância. Três critérios se mostraram
úteis:

**a) Quantos casos sobreviveram à revisão.** Taxa de aproveitamento por tipo:

| Tipo | Gerados | Aproveitados | Taxa |
|------|--------:|-------------:|-----:|
| A (v3) | 8 | 8 | 100% |
| B (v2) | 34 linhas | 6 casos | ~18% |
| C (v2) | 11 | 9 | 82% |
| D (v2) | 6 | 4 | 67% |

A taxa baixa do Tipo B não indica prompt ruim: indica que ele super-gera por
simetria (se três campos têm limites, ele produz a matriz completa dos três,
mesmo quando dois são o mesmo teste). O custo de descartar é baixo; o custo de
não ter gerado seria perder CI-13.

**b) Quantos achados reais produziu.** Aqui o Tipo C ganha com folga: 4 dos 10
achados do exercício. A razão é o enquadramento adversarial — pedir "o que
quebra" em vez de "teste isto" muda a classe de resposta.

**c) Se as asserções estavam certas.** O critério mais importante, e o único
que a execução mediu. Resultado: **uma asserção errada em cada tipo de prompt,
exceto o A.** E a do Tipo A, que escapou da revisão dos prompts, foi pega
depois, na conferência de fidelidade (CI-07 esperava `TaskNotFoundError` e o
comportamento real é `not-found` cru do SDK).

Esse último ponto merece destaque, porque é contraintuitivo: **o teste estava
verde e a asserção estava errada.** Verde porque o harness, também escrito com
apoio da LLM, tinha a mesma concepção equivocada do sistema que o teste.
A LLM foi internamente consistente e externamente errada. Nenhuma quantidade
de revisão do *output* pegaria isso; só a comparação contra o código de
produção pegou.

### Diversidade: o que a aumentou e o que não

**Aumentou muito:**

1. **Variar o papel atribuído** (QA → engenheiro de caos → especialista em
   contrato). Maior ganho de diversidade de todo o exercício, e o mais barato:
   uma frase. O mesmo modelo e o mesmo código geram classes de caso diferentes
   conforme o papel.
2. **Dar fatos sobre o runtime que não estão no código.** O achado CI-15 só
   existiu porque colei no prompt que `serverTimestamp()` emite `null`
   localmente. Esse fato está na documentação do Firebase e na minha
   experiência, não no código-fonte. A LLM soube o que fazer com ele; não o
   inferiu sozinha.
3. **Proibir explicitamente o óbvio.** "Não liste os `throw` que já estão no
   código" transformou o Tipo C de cobertura de linha (v1) em descoberta de
   bugs (v2).

**Não aumentou:**

1. **Pedir mais casos.** "Gere 20 cenários" em vez de 8 produziu variações
   triviais de dados sobre os mesmos invariantes. Quantidade não é diversidade.
2. **Colar mais código.** Entre a v2 e a v3 do Tipo A acrescentei o
   `auth.service.ts` inteiro, e os casos novos vieram das *restrições*, não do
   código adicional. Contexto tem retorno decrescente rápido; restrição, não.

---

## 2. Quais ajustes de prompt foram necessários

Nove iterações, das quais quatro versões iniciais foram descartadas. Os
ajustes que funcionaram, em ordem de impacto:

### Ajuste 1 — Colar o código real em vez de descrever o sistema

**Problema:** o Tipo A v1 ("gere testes para um app Angular que usa Firebase")
gerou 5 testes unitários disfarçados e 2 chamadas a métodos inexistentes
(`taskService.findAll()`), além de supor uma API REST que o projeto não tem.

**Ajuste:** colar `task.ts`, `task.service.ts` e `auth.service.ts` integrais.

**Efeito:** eliminou 100% das alucinações de API. É pré-requisito, não
refinamento — sem isso nada mais importa, porque a LLM preenche as lacunas com
o app Angular "médio" da internet.

### Ajuste 2 — Exigir que cada caso atravesse ≥2 fronteiras

**Problema:** mesmo com o código colado, ~40% da saída eram testes unitários.

**Ajuste:** "Cada cenário deve atravessar no mínimo duas fronteiras. Se
exercita apenas um componente isolado, é teste unitário — não o inclua."

**Efeito:** é o ajuste que define o que "teste de integração" significa para o
modelo. Sem ele, a LLM usa a definição mais frouxa possível.

### Ajuste 3 — Pedir o invariante protegido

**Problema:** casos redundantes testando a mesma regra com dados diferentes.

**Ajuste:** uma coluna a mais — "indique o invariante que este teste protege".

**Efeito:** a LLM passou a deduplicar sozinha, descartando dois cenários que a
versão anterior havia gerado. Melhor relação custo-benefício do exercício:
uma coluna na tabela.

### Ajuste 4 — Proibir o ferramental errado, não só indicar o certo

**Problema:** o Tipo D v1 gerou tudo com `HttpTestingController`, que não
intercepta Firebase callables. Os testes não compilariam.

**Ajuste:** não bastou dizer qual é o mecanismo correto. Foi preciso: "**NÃO**
use `HttpTestingController`, `provideHttpClientTesting` ou qualquer coisa de
`@angular/common/http/testing`. Nada disso intercepta uma callable."

**Efeito:** resolveu. A lição é que o viés para o padrão mais comum é forte o
suficiente para sobrepor o código colado — o serviço "parecia" um serviço HTTP,
então virou um. Proibição explícita vence contexto implícito.

### Ajuste 5 — Mudar o papel para mudar a classe de achado

**Problema:** o Tipo C v1 enumerou mecanicamente os `throw` existentes —
cobertura de linha, zero descoberta.

**Ajuste:** papel de "engenheiro de caos contratado para quebrar a
integração", mais a proibição de listar os `throw` conhecidos, mais exigência
de incluir pelo menos uma falha silenciosa.

**Efeito:** dois bugs reais não tratados (CI-15, CI-21). Mesmo modelo, mesmo
código, enquadramento diferente.

### Ajuste 6 — Pedir "onde estoura vs. onde foi causado"

**Problema:** o Tipo D gerava testes de contrato convencionais, sem conclusão.

**Ajuste:** duas colunas separadas na tabela de saída.

**Efeito:** produziu o insight sistêmico de que todas as divergências da
callable estouram em outro componente. Foi o que transformou quatro casos de
teste em um item de backlog com correção de três linhas.

### Ajustes que **não** funcionaram

- **Pedir mais casos** — gera variação trivial, não diversidade.
- **"Seja criativo" / "pense fora da caixa"** — produziu cenários exóticos e
  irrelevantes (ex.: "e se o usuário tiver 10 milhões de tarefas"), sem relação
  com as fronteiras do sistema. Restrição concreta funciona; exortação à
  criatividade, não.
- **Pedir o teste já em código na primeira passada** — a LLM escrevia TypeScript
  plausível sobre uma concepção errada da arquitetura, e o erro ficava
  escondido no meio de 80 linhas de código. Pedir **tabela primeiro, código
  depois** mantém o raciocínio inspecionável, e foi assim que encontrei a maior
  parte das divergências.

---

## 3. Onde a LLM errou (e o padrão dos erros)

Quatro erros, com um padrão legível:

| Erro | Tipo | Como foi pego |
|------|------|---------------|
| `invalid_enum_value` em vez de `invalid_value` | Nomenclatura de versão (zod 3 vs. 4) | Executando |
| "`getById` não trata documento inexistente" | Afirmação falsa de **ausência** | Lendo o código |
| "Campo extra quebraria o parse" | Severidade superestimada | Executando |
| CI-07 espera `TaskNotFoundError` | Modelo mental do sistema | Comparando com o código de produção |

**O padrão:** a LLM acerta a **estrutura** (que fronteiras existem, que
cenários importam, como organizar o teste) e erra os **fatos verificáveis**
(código de erro da biblioteca, o que o código trata, o que o SDK faz). E erra
com a mesma confiança com que acerta — não há sinal no texto que distinga as
duas coisas.

Isso define a divisão de trabalho que o exercício sugere:

- **LLM:** gerar o espaço de casos, propor cenários que o humano não pensou,
  organizar a saída, escrever o boilerplate.
- **Humano:** verificar toda afirmação sobre comportamento de terceiros
  (executando), toda afirmação sobre ausência de tratamento (lendo o código) e
  toda asserção contra o código de produção (comparando).

O caso CI-07 é o mais instrutivo: a LLM **propôs o cenário certo** (um achado
genuíno que eu não tinha considerado) e **escreveu a asserção errada**. Aceitar
o pacote inteiro teria incorporado um teste verde que afirma o oposto do
comportamento real — pior que não ter o teste, porque passa a falhar quando o
código for corrigido.

---

## 4. O erro que a revisão pegou

Esta seção existe porque o exercício teria ficado incompleto sem ela, e porque
o erro é do mesmo tipo que a análise acima descreve — só que cometido por mim,
não pela LLM.

Depois de fechar a entrega, submeti os documentos a uma revisão cética contra
o código. Ela encontrou treze discrepâncias. A maioria era desatualização
(contagens, um arquivo de evidência com a saída antiga). Três eram
substantivas:

**a) Eu afirmei que o projeto não tem `firebase.json`.** Escrevi, em três
lugares, que o Emulator Suite exigiria "um `firebase.json` que o projeto ainda
não tem". O arquivo existe na raiz, com os emuladores de auth, firestore e
functions já configurados. A limitação real é outra: não há JDK instalado
nesta máquina. Eu justifiquei uma decisão técnica com um fato que não
verifiquei — exatamente o comportamento que critico na LLM na seção 3.

**b) Eu apontei para um arquivo que não existia.** O docblock do harness
dizia que a divergência entre réplica e serviço real era mitigada por um
`task-service-parity.integration.spec.ts`. Esse arquivo nunca foi escrito. A
mitigação da limitação mais séria da suíte era fictícia — e isso num
documento cujo argumento central é "verifique tudo". Corrigi escrevendo a
ferramenta de verdade (`npm run test:parity`), que compara a sequência de
operações dos dois arquivos lendo os fontes. Na primeira execução ela
acusou uma divergência em `getById` que era falso positivo do meu próprio
regex — o que é, em si, uma boa demonstração de por que a ferramenta precisa
existir e ser executada, não apenas citada.

**c) O achado "de maior valor" estava exagerado.** O prompt Tipo D produziu o
cenário de o Claude devolver `'Alta'` em vez de `'high'`, corrompendo a
listagem do usuário. Eu o apresentei como o achado mais importante da entrega.
Ao conferir o código do servidor — que eu não havia lido, porque o prompt
tratava só do cliente — descobri que o `claude-adapter` valida o retorno do
LLM contra o enum e lança se divergir, e que o fallback heurístico sempre
devolve valor válido. **O cenário não ocorre.** O que permanece real é mais
modesto: o cliente não tem defesa própria, o schema do servidor existe mas não
é aplicado na resposta, e a DEC-005 duplica o contrato manualmente — então uma
divergência futura passaria sem detecção. Vale corrigir como defesa em
profundidade, não como bug ativo.

O padrão dos três é o mesmo, e é o oposto do que eu esperava encontrar em mim:
**não verifiquei afirmações convenientes.** A ausência do `firebase.json`
justificava minha escolha de fakes; o arquivo de paridade fechava uma
limitação incômoda; o cenário dramático da callable dava à entrega um achado
de destaque. Nos três casos, a afirmação servia ao texto, e eu não a conferi.

A LLM erra os fatos verificáveis com confiança (seção 3). Eu errei os fatos
que me convinham. A diferença é que os erros dela eu procurei ativamente — e
os meus só apareceram quando pedi a alguém que procurasse.

---

## 5. Conclusão: a GenAI como copiloto na suíte de integração

O fórum pergunta se a GenAI pode atuar como copiloto na construção de suítes
de integração mais robustas. Pelo que este exercício mostrou: **sim, e o ganho
está num lugar diferente do esperado.**

O ganho não está em escrever os testes mais rápido — a redação de 34 `it()` não
era o gargalo. Está em **ampliar o espaço de casos considerados**. Dos seis itens de
backlog, quatro vieram de cenários que eu não teria levantado: o timestamp
pendente, o limite UTF-16, a corrupção derrubando a listagem inteira e a
falta de validação na borda da callable. O código é meu, escrito há semanas, e
eu não os tinha visto.

Mas o papel é estritamente de copiloto, e a metáfora é exata em um ponto
específico: **o copiloto sugere a rota e o piloto confirma os instrumentos.**
Quatro dos 27 casos gerados continham afirmações falsas, e uma delas estava verde na
suíte. A verificação não é opcional nem delegável — é o trabalho.

Três práticas que levo deste exercício:

1. **Sempre mais de um tipo de prompt.** Um só produz uma suíte que parece
   completa e tem um ponto cego sistemático. A diversidade vem de variar o
   papel e as restrições, não de pedir mais casos.
2. **Tabela antes de código.** Mantém o raciocínio da LLM inspecionável. Todas
   as divergências que encontrei estavam visíveis na tabela e ficariam
   escondidas no meio do TypeScript.
3. **Toda asserção gerada por LLM é hipótese até ser executada contra o código
   de produção.** Teste verde não é evidência de que o sistema funciona —
   quando o teste e o harness vêm da mesma LLM, é evidência de que os dois
   concordam com o modelo que ela tem do sistema. Que pode estar errado, como
   estava.
