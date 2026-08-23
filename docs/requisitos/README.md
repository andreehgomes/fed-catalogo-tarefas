# Análise e Especificação de Requisitos com IA Generativa — fed-catalogo-tarefas

Artefatos produzidos como exercício prático da **Unidade III** do curso
*Engenharia de Requisitos com Inteligência Artificial Generativa* (AKCIT/UFG —
ESP T1 ES C10), usando o projeto real
[fed-catalogo-tarefas](../../README.md) como cenário — mesmo critério adotado
na unidade de [gestão de riscos](../riscos/).

O material do curso oferece um documento de elicitação fictício (sistema de
gestão de eventos). Optou-se por aplicar o método ao projeto real porque ele
**já possui material de elicitação genuíno** — escopo, backlog, decisões
arquiteturais e código — o que permite exercitar a parte mais difícil da
análise: encontrar o que está implícito, ambíguo ou ausente em documentação de
verdade, e não em um enunciado construído para conter as lacunas certas.

---

## Estrutura

| Etapa | Artefato | Conteúdo |
|-------|----------|----------|
| Análise | [analise/requisitos-funcionais.md](./analise/requisitos-funcionais.md) | RF-001..RF-012, origem de cada um e candidatos rejeitados. |
| Análise | [analise/requisitos-nao-funcionais.md](./analise/requisitos-nao-funcionais.md) | RNF-001..RNF-012 classificados por característica da ISO/IEC 25010. |
| Análise | [analise/regras-de-negocio.md](./analise/regras-de-negocio.md) | RN-01..RN-11 e um conflito latente identificado entre regras. |
| Análise | [analise/duvidas-e-lacunas.md](./analise/duvidas-e-lacunas.md) | 4 ambiguidades e 8 lacunas, com a pergunta objetiva a fazer ao stakeholder e ordem de prioridade. |
| Especificação | [especificacao/historias-de-usuario.md](./especificacao/historias-de-usuario.md) | HU-01..HU-12 com rastreabilidade para requisito, regra e caso de uso. |
| Especificação | [especificacao/criterios-de-aceitacao.md](./especificacao/criterios-de-aceitacao.md) | AC-01..AC-12 em *dado–quando–então*. |
| Especificação | [especificacao/casos-de-uso.md](./especificacao/casos-de-uso.md) | UC-01..UC-03, só para os fluxos com alternativas reais. |

---

## Por que estes artefatos, e não outros

A atividade 3 do exercício pedia que a IA recomendasse artefatos; a atividade 4
pedia análise crítica dessa recomendação. As duas listas abaixo registram o
resultado.

### Escolhidos

**Histórias de usuário.** O projeto é conduzido por um backlog com releases, e
seus requisitos já estavam escritos em linguagem próxima à de história. As
histórias mantêm a leitura centrada no valor entregue e servem de ponte entre o
escopo do MVP e a especificação — sem introduzir um formalismo que o projeto não
pratica.

**Critérios de aceitação.** É o artefato que resolve a maior fraqueza do
projeto: os critérios existiam soltos dentro do backlog, misturados com decisões
de implementação ("`inject(Firestore)` em vez de constructor injection" não é
critério de aceite, é decisão técnica). Escrevê-los em *dado–quando–então*
separou o comportamento observável da escolha de tecnologia e produziu, de
graça, a base para os casos de teste. Foi o artefato de maior retorno.

**Casos de uso — apenas três.** A recomendação inicial da IA foi documentar
todas as funcionalidades em casos de uso. Isso foi **modificado**: escrever um
caso de uso para "excluir tarefa" produziria um documento com um fluxo principal
de dois passos e nenhuma alternativa — custo de manutenção sem ganho de
clareza. Casos de uso foram reservados aos três fluxos que têm alternativas
reais e regras densas: autenticação (dois provedores, cadastro, redirecionamentos),
atualização de tarefa (validação e verificação de propriedade) e sugestão de
prioridade (duas origens possíveis, dupla verificação de segurança, decisão final
do usuário). É a aplicação prática do que a Unidade III diz sobre casos de uso
custarem mais esforço e valerem conforme o nível de detalhamento necessário.

### Descartados

**Diagrama de casos de uso (UML).** Com um único perfil de ator e três casos de
uso, o diagrama seria um retângulo com três elipses. Não acrescenta informação
que a tabela de rastreabilidade já não carregue.

**Protótipos.** O sistema **já está construído e em produção**. Produzir
protótipos agora seria documentação retroativa de telas que existem; as capturas
em [`imagens_evidencias/`](../../imagens_evidencias/) cumprem o papel de
representação visual com fidelidade maior que qualquer wireframe. A Unidade III
apresenta o protótipo como apoio à validação *antes* do desenvolvimento — a
condição que o justifica não se aplica aqui.

**Matriz de perfis e permissões.** Foi o artefato recomendado no exemplo da
videoaula, e por isso a IA o sugeriu por analogia. Mas naquele exemplo havia
vários perfis com capacidades diferentes; aqui há **um único perfil**, e a regra
de acesso inteira cabe em duas linhas (RN-01 e RN-02). Uma matriz de uma coluna
seria cerimônia vazia. Este descarte é o exemplo mais claro, neste exercício, de
sugestão de IA que era boa no contexto de origem e ruim no contexto de destino.

**Especificação de requisitos não funcionais em documento próprio.** A IA
sugeriu separar os RNFs em um artefato de especificação, além do de análise.
Descartado por gerar duas fontes de verdade para a mesma informação — o oposto
do que a rastreabilidade busca. Os RNFs ficam apenas em `analise/`, referenciados
pelos demais artefatos.

---

## Reflexão sobre o uso da Inteligência Artificial

*(atividade 3.4.4 do material da Unidade III)*

### Qual ferramenta foi utilizada

**Claude (Anthropic)**, em sessão do Cowork com acesso de leitura ao repositório
e ao ambiente virtual do curso. É a mesma família de modelos que o projeto usa
em runtime na Cloud Function `suggestpriority` — o que torna esta unidade um
caso curioso de a mesma tecnologia aparecer nos dois lados: como ferramenta de
engenharia e como funcionalidade do produto.

### Como a IA apoiou cada etapa

| Etapa | Papel da IA | Papel humano |
|---|---|---|
| Análise do material | Leu escopo, backlog, ADRs, README e artefatos de risco e cruzou as quatro fontes procurando divergências. | Definiu que o cenário seria o projeto real e não o exemplo do curso. |
| Identificação de RFs e RNFs | Propôs os requisitos derivados (RF-008..RF-012, RNF-006..RNF-012) a partir de comportamentos que estavam escondidos dentro de critérios de aceite. | Aprovou a promoção de cada um e manteve a numeração original para não quebrar rastreabilidade. |
| Regras de negócio | Extraiu as regras que estavam dispersas em `firestore.rules`, nos schemas zod e nas ADRs. | Validou que RN-07 e RN-09 refletem a intenção real do produto. |
| Ambiguidades e lacunas | Levantou as 12 questões e propôs a ordem de resolução. | Decisão sobre o que vira requisito e o que continua pergunta — nenhuma lacuna foi "resolvida" pela IA por conta própria. |
| Escolha dos artefatos | Recomendou um conjunto amplo. | Cortou três recomendações e reduziu uma quarta; a justificativa está acima. |
| Redação dos artefatos | Produziu as versões iniciais de histórias, critérios e casos de uso. | Revisão e ajuste. |

### O que foi aceito

- A separação entre RF-007 (obter a sugestão) e RF-008 (declarar a origem) —
  a IA argumentou que são verificáveis de forma independente, e o argumento se
  sustenta: o sistema poderia sugerir corretamente e ainda assim mentir sobre a
  fonte.
- A promoção de critérios de aceite a requisitos próprios (RF-010, RF-011,
  RF-012), que estavam escondidos dentro de RF-002 e RF-005.
- O uso da ISO/IEC 25010 para classificar os RNFs por característica de
  qualidade, em vez de listá-los sem categoria.
- A identificação do conflito latente entre RN-08 e RNF-011, que só ficou
  visível quando as regras foram escritas lado a lado.

### O que foi modificado

- **Casos de uso para tudo → casos de uso para três fluxos.** Motivo acima.
- **RNF-012 (responsividade).** A IA propôs "deve ser responsivo em dispositivos
  móveis" — que repete exatamente o vício que a Unidade III critica em "o
  sistema deve responder rapidamente". Foi reescrito com um limiar verificável
  (360 px, sem rolagem horizontal) e, por o limiar ser uma proposta do analista
  e não uma decisão do stakeholder, foi **também** registrado como pergunta em
  aberto (A-01).
- **Critérios de aceitação de HU-09.** A IA escreveu um critério do tipo "então
  o sistema devolve a prioridade correta". Não é verificável enquanto não houver
  definição de negócio para os níveis de prioridade. Foi reescrito para verificar
  o contrato (domínio dos quatro valores) e a limitação foi declarada
  explicitamente no artefato, em vez de mascarada.

### O que foi descartado

- Matriz de perfis e permissões, diagrama UML, protótipos e documento separado
  de RNFs — motivos na seção anterior.
- Uma regra de negócio proposta pela IA, "a prioridade sugerida deve ser sempre
  maior ou igual à atual", que **contradiz RN-07** e não tinha origem em nenhuma
  fonte. É o exemplo mais direto, neste exercício, de sugestão plausível na
  forma e errada no conteúdo.
- Requisitos de "filtrar por status" e "notificar tarefas vencidas": plausíveis
  para um gestor de tarefas, ausentes do material. Em vez de virarem requisito
  por analogia, viraram pergunta ao stakeholder (L-05, L-06).

### O que essa experiência mostrou

A IA foi eficiente onde o trabalho é de **cobertura**: ler quatro documentos ao
mesmo tempo, cruzar `firestore.rules` com o backlog, notar que um comportamento
existe no código sem requisito correspondente. Esse é trabalho que consome
tempo e no qual o cansaço humano produz omissões.

Onde ela errou foi sempre no mesmo lugar: **transferir contexto de um projeto
para outro sem verificar se ele se aplica**. A matriz de permissões e o requisito
de responsividade vago vieram de padrões corretos em outros contextos. Nenhum dos
dois erros seria detectável por alguém que não conhecesse este projeto — que é
exatamente o argumento da Unidade V sobre a IA não possuir o contexto
organizacional e o julgamento de domínio permanecer humano.

O ganho real não foi velocidade de escrita. Foi que o cruzamento sistemático das
fontes produziu **12 perguntas que não existiam antes** — e nenhuma delas foi
respondida pela IA, porque nenhuma tem resposta no material. O produto mais
valioso desta análise é a lista de dúvidas, não a de requisitos.
