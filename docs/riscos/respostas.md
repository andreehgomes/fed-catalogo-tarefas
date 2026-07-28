# Estratégias de Resposta aos Riscos — fed-catalogo-tarefas

Para cada risco de [analise.md](./analise.md), a estratégia adotada — **evitar,
mitigar, transferir ou aceitar** — com justificativa e ações concretas. As
ações refletem o que já está implementado no projeto e o que fica como
continuidade.

| ID   | Risco                              | Estratégia | Situação                    |
|------|------------------------------------|------------|-----------------------------|
| R-01 | Abuso da Cloud Function             | Mitigar    | Parcial — Fase B pendente   |
| R-02 | Vazamento do `ANTHROPIC_API_KEY`    | Mitigar    | Implementado                |
| R-03 | Rules permissivas em produção       | Evitar     | Implementado (Release 2)    |
| R-04 | RNF-004 desempenho                  | Aceitar    | Aceito + roadmap            |
| R-05 | API Anthropic indisponível          | Mitigar    | Implementado (fallback)     |
| R-06 | Sugestão de IA incorreta            | Mitigar    | Implementado                |
| R-07 | Bus factor = 1                      | Mitigar    | Parcial (documentação)      |
| R-08 | Sem teto de gastos no Blaze         | Transferir/Mitigar | Pendente (budget alert) |
| R-09 | Privacidade das tarefas             | Mitigar    | Parcial                     |
| R-10 | Duplicação de contrato zod          | Aceitar    | Aceito + roadmap            |

---

## R-01 — Abuso da Cloud Function → **MITIGAR**

- **Justificativa:** não dá para "evitar" mantendo a feature de IA; a resposta
  é reduzir a superfície de abuso em camadas.
- **Ações:**
  - ✅ Cloud Function valida `request.auth` e App Check antes de chamar Claude.
  - ✅ App Check com reCAPTCHA v3 anexando token (Fase A / monitor).
  - ⏳ **Ligar enforcement (Fase B)** em Authentication, Firestore e Functions
    após 24-48h monitorando métricas no console (DEC-006).
  - ⏳ Rate-limit por usuário na função (continuidade).

## R-02 — Vazamento do `ANTHROPIC_API_KEY` → **MITIGAR**

- **Justificativa:** o segredo é inevitável para a feature; minimiza-se a
  chance de exposição.
- **Ações:**
  - ✅ Chave no Google Secret Manager via `defineSecret`, **nunca** no bundle
    nem versionada.
  - ✅ Logs registram só `source`/`priority`, sem eco do segredo.
  - ⏳ Rotação de chave documentada como procedimento de resposta a incidente.

## R-03 — Rules permissivas em produção → **EVITAR**

- **Justificativa:** é um risco de impacto alto e 100% evitável; não se aceita
  nem se mitiga — elimina-se a condição.
- **Ações:**
  - ✅ Firestore Rules autenticadas com isolamento por `request.auth.uid`
    entregues na Release 2.
  - ✅ Checklist de deploy no README com "publicar rules + indexes" como passo
    obrigatório antes do deploy da app.

## R-04 — RNF-004 (desempenho) → **ACEITAR**

- **Justificativa:** aceite **consciente e documentado**. O foco da disciplina
  é IA aplicada ao desenvolvimento, não engenharia de performance web.
  Reconhecer a limitação é mais didático que mascará-la.
- **Ações:**
  - ✅ Limitação registrada no README com score Lighthouse e causa raiz.
  - 📋 Roadmap de correção documentado: `loadChildren`, lazy-load do
    AngularFire, `defer` blocks, `getDocs` na primeira carga.

## R-05 — API Anthropic indisponível → **MITIGAR**

- **Justificativa:** dependência externa é inerente; garante-se continuidade
  do serviço mesmo sem a IA.
- **Ações:**
  - ✅ **Fallback heurístico determinístico** — a interface pública é uma só e
    a decisão IA-vs-heurística acontece num único `if` (lição da Unidade 3.2).
  - ✅ Campo `source` devolvido ao cliente torna a degradação **visível**, não
    silenciosa.

## R-06 — Sugestão de IA incorreta → **MITIGAR**

- **Justificativa:** não se elimina erro de julgamento de um LLM; reduz-se o
  dano mantendo o humano no controle.
- **Ações:**
  - ✅ Sugestão é **assistiva**: preenche o select, o usuário revisa e
    sobrescreve.
  - ✅ Saída forçada via `tool_use` para 4 valores válidos (sem saída
    malformada).
  - ✅ Selo honesto "via Claude" / "via heurística" evita confiança cega.

## R-07 — Bus factor = 1 → **MITIGAR**

- **Justificativa:** num projeto individual não se transfere o risco, mas
  reduz-se a dependência tácita convertendo conhecimento em documentação.
- **Ações:**
  - ✅ ADRs (DEC-001..006), escopo, backlog, prompts e checklist de deploy
    versionados.
  - ⏳ Automatizar passos manuais de console (script/IaC) como continuidade.

## R-08 — Sem teto de gastos no Blaze → **TRANSFERIR / MITIGAR**

- **Justificativa:** o risco financeiro é transferido em parte ao provedor via
  alertas e mitigado por controle de custo.
- **Ações:**
  - ⏳ **Configurar budget alert (~US$ 5/mês)** no Cloud Billing (checklist do
    README).
  - ✅ Modelo Haiku 4.5 com prompt curto (~US$ 0,0001/sugestão) mantém custo
    unitário baixo.
  - 🔗 Combinar com R-01 (enforcement) para cortar a fonte de abuso.

## R-09 — Privacidade das tarefas → **MITIGAR**

- **Justificativa:** a feature exige enviar texto ao LLM; minimiza-se o rastro.
- **Ações:**
  - ✅ Logs **não** registram o conteúdo da tarefa (só `source`/`priority`).
  - ⏳ Aviso ao usuário de que a sugestão usa um serviço de IA de terceiros
    (transparência / continuidade).

## R-10 — Duplicação de contrato zod → **ACEITAR**

- **Justificativa:** é duplicação de **contrato** em fronteira de processo, não
  de **lógica** (Unidade 3.2). O custo de sincronizar manualmente é menor que
  acoplar deps Angular ao bundle das Functions.
- **Ações:**
  - ✅ Trade-off documentado na DEC-005.
  - 📋 Pacote `shared/` num monorepo como evolução natural se o projeto crescer.
