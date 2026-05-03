# Registro de Decisões Arquiteturais (ADR-lite)

Cada entrada documenta uma decisão tomada, seu contexto e as alternativas
consideradas. Decisões revistas em releases posteriores ganham um bloco
"Status" indicando supersessão.

---

## DEC-001 — Persistência: Firestore

- **Status:** aceita (Release 1)
- **Contexto:** SPA pessoal, multi-device, com necessidade de sincronização em
  tempo real e baixa fricção operacional.
- **Decisão:** usar Cloud Firestore (modo nativo) como banco principal.
- **Motivos:**
  - Sincronização multi-device sem servidor próprio.
  - Integração nativa com Firebase Auth (regras `request.auth.uid`).
  - SDK web reativo, casa bem com Signals/RxJS.
  - Free tier suficiente para o escopo pessoal do projeto.
- **Alternativas consideradas:** Supabase, IndexedDB local, REST + Postgres.
- **Consequências:** dependência do ecossistema Google; consultas têm limites
  de índice composto; modelagem precisa pensar em desnormalização.

---

## DEC-002 — Validação runtime: zod

- **Status:** aceita (Release 1)
- **Contexto:** TypeScript fornece tipos em compile-time, mas dados vindos do
  Firestore (snapshots, payloads de Functions) podem chegar com formato
  inesperado em runtime. O material da pós-graduação usa Pydantic em Python
  com a mesma motivação.
- **Decisão:** validar entradas e saídas com schemas zod, e inferir os tipos
  TypeScript a partir dos schemas (`z.infer<typeof Schema>`), evitando
  duplicação `interface` × `schema`.
- **Motivos:**
  - Equivalente direto do Pydantic visto em aula.
  - Tipo e validação convivem numa única fonte da verdade.
  - Mensagens de erro descritivas no parsing.
- **Alternativas consideradas:** `io-ts`, validação manual, apenas tipos
  TypeScript (sem validação runtime).
- **Consequências:** todo dado lido do Firestore passa por `Schema.parse()`,
  com pequeno custo de CPU em troca de garantia de forma.

---

## DEC-003 — Estado: Signals

- **Status:** aceita (Release 1)
- **Contexto:** Angular 16+ introduziu Signals como primitiva oficial de
  reatividade fina; Angular 17–19 amadureceu a API. RxJS continua útil para
  *streams* (Firestore real-time, eventos), mas é verboso demais para estado
  local de componente.
- **Decisão:** estado local e derivado em Signals (`signal`, `computed`,
  `effect`); RxJS usado **apenas** para os Observables vindos do AngularFire
  (`collectionData`, `docData`), convertidos para Signal via `toSignal`.
- **Motivos:**
  - Padrão recomendado pelo Angular team.
  - Menos boilerplate, menos `async pipe` espalhado.
  - Reatividade fina = menos `ChangeDetectorRef.markForCheck`.
- **Alternativas consideradas:** RxJS puro com `BehaviorSubject`, NgRx, Akita.
- **Consequências:** desenvolvedores precisam entender quando converter entre
  Observable ↔ Signal; `effect()` exige cuidado para não criar loops.

---

## DEC-004 — Segurança da configuração Firebase: defesa em profundidade, não ofuscação

- **Status:** aceita (Release 1, revisada após decisão do usuário em 2026-05-03)
- **Contexto:** ao configurar o app para rodar online, surgiu a pergunta de
  como proteger a `apiKey` Firebase. Considerou-se inicialmente um caminho
  com `.env.local` para manter os valores fora do Git.
- **Decisão:** versionar `firebase-config.ts` no Git com os valores reais e
  proteger o app através de quatro camadas que efetivamente impedem o abuso,
  em vez de tentar esconder valores que o navegador inevitavelmente expõe.
- **Motivos:**
  - O Firebase Web SDK precisa destes valores em runtime no navegador.
    Independente de virem de `.env.local`, módulo TypeScript ou
    criptografia caseira, no final do build eles estão no JS público
    do app. A documentação oficial confirma:
    [Are Firebase API keys safe to expose?](https://firebase.google.com/docs/projects/api-keys).
  - `.env.local` daria **falsa sensação de segurança**: protegeria apenas
    o histórico Git, não o app online — que era o requisito real.
  - A estratégia de "esconder a apiKey" também aumenta atrito de setup
    (qualquer dev novo precisa criar `.env.local`) sem ganho concreto.
- **Camadas reais de proteção (defesa em profundidade):**
  1. **Restrição de domínio HTTP referrer** na Google Cloud Console
     (limita QUEM pode usar a apiKey — apenas requisições vindas dos
     domínios listados). Ação manual no console, documentada no README.
  2. **Firestore Security Rules autenticadas** (Release 2: limita O QUE
     cada usuário pode ler/escrever — só os próprios documentos via
     `request.auth.uid`).
  3. **Firebase App Check** com reCAPTCHA v3 (Release 2/3: garante que
     as chamadas vêm do SEU app, não de scripts terceiros).
  4. **Firebase Auth** como pré-requisito de qualquer escrita
     (Release 2: sem login, sem operação).
- **Alternativas consideradas e rejeitadas:**
  - `.env.local` + arquivo ignorado pelo Git → não impede a exposição
    no bundle final; só esconde no histórico do repo.
  - Backend proxy próprio chamando Firebase Admin SDK → mata o motivo
    de usar Firebase no cliente; ressuscita o backend que o serverless
    deveria evitar.
  - Ofuscar/minificar agressivo o JS → DevTools mostra tudo de qualquer
    jeito.
- **Consequências:**
  - O app só pode ser deployado depois que **todas** as ações da seção
    "Segurança" do README forem cumpridas (restrição de referrer + rules
    apertadas + App Check).
  - As `firestore.rules` permissivas atuais **não podem** ir para
    produção como estão. Antes do primeiro deploy, ou (a) entrega-se a
    Release 2 ou (b) trocam-se temporariamente as rules para
    `allow read, write: if false;`.
  - Usuários que clonem o repo conseguem rodar localmente sem setup
    extra — bom para reprodutibilidade acadêmica.

---

## DEC-005 — IA de runtime: Claude Haiku 4.5 com fallback heurístico determinístico

- **Status:** aceita (Release 3)
- **Contexto:** a disciplina exige uso de IA dentro do produto, não apenas
  durante o desenvolvimento. A função `suggestPriority` é o ponto onde a
  IA aparece em runtime: o usuário cadastra uma tarefa e pode pedir uma
  sugestão de prioridade automatizada. A definição da entrega original
  mencionava OpenAI; o usuário, contudo, optou por Claude para manter
  toda a stack de IA (desenvolvimento e runtime) na Anthropic.
- **Decisão:** Cloud Function callable `suggestpriority` que internamente
  decide UMA ÚNICA VEZ entre dois caminhos:
  1. Se o segredo `ANTHROPIC_API_KEY` está configurado, chama
     `claude-haiku-4-5-20251001` via SDK oficial, com `tool_use` para
     forçar a saída entre os 4 valores válidos (low/medium/high/urgent).
  2. Caso contrário (ou em caso de falha de rede/limite), cai num
     fallback heurístico determinístico baseado em palavras-chave em
     pt-BR.
  A interface pública é uma só:
  `suggestPriority(input, { anthropicApiKey }) → { priority, source }`.
  O cliente recebe o campo `source` para mostrar honestamente se a
  sugestão veio do Claude ou do fallback.
- **Motivos:**
  - **Lição da Unidade 3.2 (caso PriorityAdvisor)**: a duplicação de
    LÓGICA entre IA e heurística é o que se quer evitar. O ponto de
    decisão fica num único `if`, e a interface chamada pelo cliente é
    indistinguível.
  - **Defesa em profundidade no produto**: usuário sem internet ou em
    janela de rate-limit do Claude continua tendo sugestão útil.
  - **Custo controlado**: Haiku 4.5 com prompt curto cai em ~50 tokens
    de entrada e ~5 de saída — ordem de US$ 0,0001 por sugestão.
- **Alternativas consideradas:**
  - OpenAI GPT-4o-mini (briefing original) — equivalente técnico, mas o
    usuário já tinha conta Anthropic e preferiu manter coerência.
  - Apenas heurística — perderia a parte "IA viva no produto", que é
    objetivo da pós.
  - Vertex AI / Firebase AI Logic — adicionaria configuração nova; o
    usuário já tem ferramental Anthropic familiar.
- **Trade-off conhecido — duplicação de schema zod:** o contrato de
  entrada/saída da Function é declarado em zod tanto em
  `functions/src/suggest-priority/schema.ts` quanto no cliente Angular.
  Isso NÃO é a duplicação de lógica que a Unidade 3.2 alerta — é
  duplicação de CONTRATO em fronteira de processo (o servidor e o
  cliente são deploys diferentes, evoluem versões de zod
  independentemente). O preço é manter os schemas em sincronia
  manualmente; o ganho é não acoplar deps Angular ao bundle das
  Cloud Functions. Caso o projeto cresça, um pacote `shared/` num
  monorepo seria a próxima evolução natural.
- **Consequências:**
  - Segredo `ANTHROPIC_API_KEY` precisa ser provisionado via
    `firebase functions:secrets:set` antes do deploy real (instrução
    no README).
  - Logs da Cloud Function (`firebase functions:log`) registram
    `source` (claude/heuristic) e `priority` para análise posterior,
    sem registrar o conteúdo da tarefa (privacidade).
  - Função roda em `us-central1` por padrão (free tier mais generoso).

---

## DEC-006 — App Check com reCAPTCHA v3 em modo opt-in

- **Status:** aceita (Release 3, com enforcement faseado)
- **Contexto:** com Cloud Function chamando Claude, qualquer pessoa
  com a `apiKey` Firebase poderia teoricamente invocar a função e
  queimar crédito Anthropic. As Firestore Rules autenticadas (DEC-004)
  já exigem login, mas um atacante poderia criar conta e iterar.
- **Decisão:** integrar Firebase App Check com reCAPTCHA v3, **mas em
  duas fases**:
  1. **Fase A (esta release):** anexar tokens App Check em todas as
     chamadas (Firestore + Functions). Backend Firebase ainda **aceita**
     chamadas sem token. Modo "monitor" no console — visualiza-se
     quantas chamadas têm token válido vs. quantas não têm.
  2. **Fase B (depois do deploy validado):** ligar **enforcement** em
     Authentication, Firestore e Functions no console Firebase. Backend
     passa a **recusar** chamadas sem token válido.
- **Motivos:**
  - Faseamento reduz risco: se algo der errado com o reCAPTCHA (chave
    inválida, domínio não registrado), o app continua respondendo na
    fase A. Só ligamos enforcement quando o console confirma que 100%
    das chamadas legítimas estão com token.
  - O setup de App Check no Angular é **opt-in via constante**: enquanto
    `recaptchaSiteKey` for `null` em `firebase-config.ts`, o
    `provideAppCheck` é simplesmente pulado. Permite que o repo
    funcione localmente para qualquer dev sem setup extra.
- **Alternativas consideradas:**
  - Não usar App Check — solução simples mas deixa a Cloud Function
    aberta a abuso por contas-burras criadas via signup público.
  - App Check com debug provider em DEV / reCAPTCHA em PROD — mais
    complexo, exige configuração condicional no `app.config.ts`. Vale
    a pena se a Release 4 chegar.
- **Consequências:**
  - Necessário gerar um site key reCAPTCHA v3 no console Google e
    colá-la em `firebase-config.ts` (instrução detalhada no README).
  - Após deploy, monitorar métricas em
    `console.firebase.google.com/project/fed-catalogo-tarefas/appcheck`
    por 24-48h antes de ligar enforcement.
  - O bundle ganha ~50kb pelo reCAPTCHA — aceitável para o ganho de
    segurança.
