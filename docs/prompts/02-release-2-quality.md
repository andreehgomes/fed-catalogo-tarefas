## [P-002] Release 2 — Qualidade (Auth, regras, testes, Makefile)
- Modelo: Claude (via Claude Code) — Claude Opus 4.7 (1M context)
- Data: 2026-05-03
- Release: 2 — Qualidade
- Camada: Auth + Firestore Rules + testes + a11y + Makefile

### Prompt enviado

> "eu quero fazer já o certo.....quero que funcione sem gambiarra"
>
> Resposta da IA: oferta de fazer a Release 2 inteira em vez de apontar pro
> Firestore real com rules permissivas. Apresentadas 8 decisões para o usuário
> escolher (provedor de Auth, escopo de edição, framework de testes, a11y
> automatizada, escopo do Makefile, presença de Material UI, página de login
> dedicada, tratamento de tarefas pré-existentes).
>
> Resposta do usuário: "pode continuar" — aceitando todas as recomendações.
>
> A IA executou então:
> - Auth provider em `app.config.ts`, `AuthService` standalone com
>   email/password + Google + signOut e `currentUser` Signal.
> - Página `/login` com modos sign-in/sign-up + botão Google + tradução de
>   códigos de erro do Firebase para mensagens amigáveis.
> - `authGuard` (rotas privadas) e `publicOnlyGuard` (rotas públicas).
> - `userId` obrigatório no `TaskOutSchema`; `TaskService` reescrito com
>   `requireUserId()`, query `where + orderBy`, validação de ownership em
>   `update`/`delete`/`getById`. Erros customizados:
>   `NotAuthenticatedError`, `UnauthorizedTaskAccessError`.
> - Edição inline na página de tarefas (toggle entre view e form), header
>   global com nome do usuário e botão "Sair".
> - `firestore.rules` autenticadas por `request.auth.uid`, com bloqueio de
>   transferência de `userId` em update.
> - `firestore.indexes.json` com índice composto `userId asc + createdAt desc`.
> - Testes unitários: schemas zod (Karma+Jasmine) e `TaskService` na
>   fronteira de auth (lança `NotAuthenticatedError` sem usuário).
> - E2E Playwright: smoke (redireciona / → /login) + fluxo completo
>   login → criar → editar → excluir + check de acessibilidade com
>   `@axe-core/playwright`.
> - Makefile na raiz com 6 alvos: install, serve, test, lint, build,
>   rules-deploy.
> - Backlog marcado como concluído para a Release 2.

### Resultado obtido

Implementação completa da Release 2 em uma sessão. Build verde com
`ng build --configuration=development`. 16 testes unitários passando.
E2E configurado mas pendente de execução até o usuário habilitar os
provedores Auth no Firebase Console e fazer o deploy das rules
(`firebase deploy --only firestore:rules,firestore:indexes`).

### Ajustes manuais necessários

(A preencher após revisão humana e primeiro deploy. Itens esperados:)
- Habilitar Email/Password e Google como provedores no Firebase Console.
- Apagar manualmente quaisquer tarefas pré-existentes no Firestore (Release 1
  criava docs sem `userId` que serão recusadas pelas novas rules).
- Rodar `make rules-deploy` para publicar `firestore.rules` e
  `firestore.indexes.json` no projeto online.
- Aguardar a criação do índice composto (1–5 minutos) antes do primeiro
  uso do app autenticado.
- Rodar `make test` localmente para confirmar Karma + Playwright verdes
  contra o projeto online.

### Lições aprendidas

(Preencher após reflexão. Pontos para capturar:)
- Como a pergunta do usuário "sem gambiarra" mudou o desenho da entrega: em
  vez de apontar pro Firestore real com rules permissivas (que era o caminho
  rápido), foi melhor fazer a Release 2 inteira para chegar ao app online seguro.
- O valor de oferecer ao usuário um conjunto de pequenas decisões com
  recomendações em vez de tomar tudo silenciosamente.
- A linha entre defesa em profundidade (cliente checa ownership) e
  redundância (rules já fariam o mesmo): a IA optou pelo cliente checar
  também, com erros explícitos, para que a UX seja melhor durante janelas
  em que as rules estejam desatualizadas (ex.: durante deploy).
