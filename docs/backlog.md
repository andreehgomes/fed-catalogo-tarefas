# Backlog — fed-catalogo-tarefas

Itens organizados em três releases. Cada item carrega o ID do requisito (RF-NNN
ou RNF-NNN) e os critérios de aceite mínimos.

---

## Release 1 — Core (v0.1.0)

Objetivo: CRUD básico de tarefas, sem autenticação, rodando contra o Firestore
Emulator local.

- [ ] **RF-001** — Criar tarefa
  - Critério: formulário com `title`, `description` e `priority` grava no Firestore.
  - Critério: validação zod recusa título vazio.

- [ ] **RF-002** — Listar tarefas
  - Critério: lista carregada via `Signal<Task[]>` reativa ao Firestore.
  - Critério: lista vazia exibe estado de "nenhuma tarefa".

- [ ] **RF-003** — Atualizar tarefa
  - Critério: método `update(id, partial)` no `TaskService` grava `updatedAt` automaticamente.

- [ ] **RF-004** — Excluir tarefa
  - Critério: botão "Excluir" em cada item da lista remove do Firestore.

- [ ] **RNF-001** — Angular standalone + Signals
  - Critério: nenhum NgModule criado; estado local gerido com `signal()`/`computed()`.

- [ ] **RNF-002** — AngularFire funcional
  - Critério: `inject(Firestore)` em vez de constructor injection.

- [ ] **RNF-003** — Validação zod
  - Critério: `TaskCreateSchema`, `TaskUpdateSchema`, `TaskOutSchema` com tipos inferidos.

---

## Release 2 — Qualidade (v0.2.0)

Objetivo: autenticação, regras de segurança, isolamento por usuário e elevação
da qualidade (testes, lint, accessibility).

- [ ] **RF-005** — Login com e-mail/senha
  - Critério: tela de login funcional, AuthGuard protege a rota `/`.

- [ ] **RF-006** — Isolamento por usuário
  - Critério: `firestore.rules` restritivas; cada query inclui `where('userId', '==', auth.uid)`.

- [ ] **RNF-005** — Acessibilidade WCAG AA básica
  - Critério: lighthouse ≥ 90 em accessibility na página de tarefas.

- [ ] **Qualidade — Testes unitários** do `TaskService` e dos schemas zod.
- [ ] **Qualidade — Cobertura E2E** do fluxo login → criar → editar → excluir.
- [ ] **Qualidade — Makefile** com `make install` e `make serve` reproduzindo o ambiente em máquina limpa.

---

## Release 3 — Final (v1.0.0)

Objetivo: sugestão de prioridade por IA, deploy real e documentação final.

- [ ] **RF-007** — Sugestão de prioridade via IA
  - Critério: Cloud Function `suggestPriority` retorna `low|medium|high|urgent` para um par `(title, description)`.
  - Critério: quando `OPENAI_API_KEY` está presente, chama OpenAI; senão usa fallback heurístico determinístico.
  - Critério: a heurística e a chamada externa convivem sem código duplicado (lição da Unidade 3.2).

- [ ] **RNF-004** — Performance
  - Critério: TTI < 3 s em throttling 3G no Lighthouse.

- [ ] **Deploy** — Hosting + Functions em projeto Firebase real.
- [ ] **Documentação final** — README expandido com seção "Como a IA foi usada neste projeto" e prints.
