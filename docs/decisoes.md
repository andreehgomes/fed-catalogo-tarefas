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
