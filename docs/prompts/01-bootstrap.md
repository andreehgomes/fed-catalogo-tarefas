## [P-001] Bootstrap completo da Release 1
- Modelo: Claude (via Claude Code) — Claude Opus 4.7 (1M context)
- Data: 2026-05-03
- Release: 1 — Core
- Camada: Bootstrap completo (estrutura, Angular, Firebase, docs, models, service, UI, e2e, commits)

### Prompt enviado

> Vou iniciar um projeto novo chamado `fed-catalogo-tarefas` — uma SPA Angular 19
> com integração Firebase para gestão pessoal de tarefas, com sugestão de
> prioridade assistida por IA (Cloud Function chamando OpenAI com fallback local).
>
> Esse projeto é a entrega final de uma disciplina de pós-graduação em IA aplicada
> ao desenvolvimento de software. Os princípios que precisam ser seguidos:
> - Conventional Commits em todos os commits
> - Documentação obrigatória em `docs/` com escopo, backlog, arquitetura, decisões
> - Registrar cada prompt usado em `docs/prompts/`
> - Standalone components Angular (sem NgModules)
> - Signals para estado, RxJS apenas para streams do Firestore
> - AngularFire v17+ (API funcional moderna com `inject(Firestore)`)
> - zod para validação runtime de modelos
> - Firebase: Firestore + Auth + Hosting + Cloud Functions
> - Tudo deve rodar em máquina limpa via `make install` e `make serve`
>
> A entrega é em 3 releases: Core (v0.1.0), Qualidade (v0.2.0) e Final (v1.0.0).
> Vou pedir uma release por vez. Hoje é só a RELEASE 1 — CORE.
>
> [OBJETIVO]
> Crie a pasta fed-catalogo-tarefas e dentro dela execute toda a Release 1:
>
> 1. ESTRUTURA E VERSIONAMENTO — git init, .gitignore Angular+Firebase+Node,
>    `core.autocrlf` se Windows.
> 2. BOOTSTRAP DO PROJETO ANGULAR — `ng new fed-catalogo-tarefas-app
>    --standalone --routing --style=scss --skip-git --skip-install` na subpasta;
>    `npm install`; `@angular/fire firebase zod`.
> 3. INICIALIZE FIREBASE OFFLINE — `firebase.json` (Hosting apontando para
>    `dist/fed-catalogo-tarefas-app/browser`, Firestore e Functions Node 20),
>    `.firebaserc` com `TODO-firebase-project-id`, `firestore.rules` permissivo
>    apenas no emulator com aviso grande, `firestore.indexes.json` vazio,
>    pasta `functions/` com `package.json` e `tsconfig.json` mínimos.
> 4. DOCUMENTAÇÃO — `docs/escopo-MVP.md` (RF-001..RF-007, RNF-001..RNF-005,
>    fora-de-escopo com bullets ❌); `docs/backlog.md` em 3 releases; diagrama
>    Mermaid `docs/arquitetura.mmd`; `docs/decisoes.md` com DEC-001 (Firestore),
>    DEC-002 (zod), DEC-003 (Signals); `docs/prompts/README.md` + `01-bootstrap.md`
>    registrando este prompt.
> 5. MODELS zod — `src/app/models/task.ts` com `TaskCreateSchema`,
>    `TaskUpdateSchema`, `TaskOutSchema`; tipos inferidos; enums
>    `TaskPriority` e `TaskStatus`; JSDoc.
> 6. REPOSITORY/SERVICE — `src/app/services/task.service.ts` standalone com
>    `inject(Firestore)`, métodos `list/getById/create/update/delete`,
>    `createdAt`/`updatedAt` automáticos, validação zod, `TaskNotFoundError`
>    customizado em `src/app/errors/`.
> 7. UI — `src/app/pages/tasks/tasks.component.ts` (lista Signal + form
>    title/description/priority + delete), rota `/` em `app.routes.ts`.
> 8. SMOKE E2E — Playwright + `npx playwright install chromium`;
>    `e2e/smoke.spec.ts` abre `http://localhost:4200/` e verifica render;
>    `playwright.config.ts` mínimo.
> 9. main.ts AngularFire — `provideFirebaseApp` + `provideFirestore` com
>    `connectFirestoreEmulator` em dev; placeholder em
>    `src/environments/firebase-config.ts`.
> 10. README INICIAL — título, parágrafo, stack, como rodar, links para
>     docs, "Como a IA foi usada neste projeto".
> 11. COMMITS Conventional separados por camada (12 commits — chore/init,
>     chore/angular, chore(deps), chore(firebase), docs, feat(models),
>     feat(errors), feat(services), feat(pages), feat(config), test, docs(readme)).
> 12. TAG `v0.1.0` com `git tag -a v0.1.0 -m "Release 1 — Core: CRUD básico
>     de tarefas"`.
>
> [ESTILO]
> - Standalone, sem NgModules
> - Signals, RxJS só para Firestore
> - inject() em vez de constructor injection
> - TypeScript estrito, no any solto, no `as unknown as`
> - JSDoc em métodos públicos
> - Mensagens de erro claras com classes customizadas
>
> [TONALIDADE]
> - Liste o que vai fazer ANTES de mexer em arquivos sensíveis
> - Mostre flags de `ng new` e conteúdo de `firebase.json` / `firestore.rules`
>   antes de gravar
> - Pare e pergunte se algo for ambíguo (Unidade 4.2 — não fazer suposições
>   silenciosas)
> - No fim: `git log --oneline`, árvore de arquivos, próximas ações manuais
> - Alertar se houver código duplicado em camadas diferentes (Unidade 3.2 —
>   caso PriorityAdvisor)
> - Conventional Commits sempre

### Resultado obtido

A IA executou o bootstrap completo da Release 1:
- Estrutura criada em `C:/Users/Oem/Documents/Projetos/2 - Particular/fed-catalogo-tarefas`.
- Angular CLI 20.3.4 instalado localmente (mais recente que a v19 pedida); a IA
  alinhou explicitamente que usaria a versão mais recente disponível, com aval
  do usuário.
- AngularFire instalado na versão mais recente disponível.
- Firebase configurado em modo offline, com `firestore.rules` permissivo e aviso
  grande indicando que será trocado na Release 2.
- Documentação completa em `docs/`, incluindo este registro de prompt.
- Camada de models com zod (schemas + tipos inferidos + enums).
- `TaskService` com `inject(Firestore)` e validação via zod, mais
  `TaskNotFoundError`.
- Página `/tasks` com listagem reativa via Signals e formulário de criação.
- AngularFire ligado em `main.ts` com `connectFirestoreEmulator` em modo dev.
- Playwright instalado (sem `--with-deps`, por estar no Windows) e smoke test
  apontando para `localhost:4200`.
- 12 commits Conventional, com a ordem ajustada para que cada commit deixe o
  repo num estado verde (commit `feat(config)` movido para antes de `feat(services)`).
- Tag `v0.1.0` aplicada.

### Ajustes manuais necessários

(Preencher após revisão humana — esperar pelo menos os seguintes itens:)
- Trocar `TODO-firebase-project-id` em `.firebaserc` pelo ID real do projeto
  Firebase.
- Preencher `src/environments/firebase-config.ts` com a config do projeto
  Firebase real (apiKey, authDomain etc.) antes de qualquer deploy.
- Decidir se a versão mais recente do Angular (20+) deve ser fixada (engines
  no `package.json`) ou se o time aceita rolling.

### Lições aprendidas

(Preencher após reflexão — esperar capturar pelo menos:)
- O quão útil foi a IA pedir confirmação antes de gravar arquivos sensíveis
  (`firebase.json`, `firestore.rules`).
- Se a ordem dos commits ajustada (commit que mantém o repo verde a cada passo)
  foi melhor do que a sequência original do prompt.
- Como a presença explícita de "fora-de-escopo" no escopo do MVP corta supostas
  sugestões de feature creep da IA mais adiante.
