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
