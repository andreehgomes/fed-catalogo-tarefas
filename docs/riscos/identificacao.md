# Identificação de Riscos — fed-catalogo-tarefas

Lista de riscos levantados para o projeto **fed-catalogo-tarefas**: uma SPA
pessoal de gestão de tarefas (Angular 20 + Firebase) com sugestão de prioridade
assistida por IA (Cloud Function chamando Claude Haiku 4.5, com fallback
heurístico). Contexto: projeto acadêmico de pós-graduação, desenvolvido por
**um único autor**, hospedado em Firebase no plano **Blaze** (pay-as-you-go).

Cada risco tem ID, categoria, descrição e o contexto concreto em que ele pode
ocorrer neste projeto — não riscos genéricos de "software", mas os que essa
arquitetura específica traz.

| ID     | Categoria        | Risco                                                                  |
|--------|------------------|-----------------------------------------------------------------------|
| R-01   | Custo / Abuso    | Abuso da Cloud Function `suggestpriority` queimando crédito Anthropic  |
| R-02   | Segurança        | Vazamento do segredo `ANTHROPIC_API_KEY`                              |
| R-03   | Segurança        | Regras do Firestore permissivas indo para produção                    |
| R-04   | Desempenho       | RNF-004 (TTI < 3s em 3G) não cumprido — bundle inicial de ~638 kb     |
| R-05   | Dependência 3ª   | Indisponibilidade / mudança de contrato da API da Anthropic           |
| R-06   | Qualidade da IA  | Sugestão de prioridade incorreta ou enviesada minando a confiança     |
| R-07   | Operacional      | Fator único de conhecimento (bus factor = 1)                          |
| R-08   | Custo            | Ausência de teto de gastos no Firebase Blaze / cobrança inesperada    |
| R-09   | Privacidade      | Conteúdo de tarefas do usuário trafegando para um LLM de terceiros    |
| R-10   | Manutenção       | Duplicação do contrato zod entre cliente e Cloud Function             |

---

## R-01 — Abuso da Cloud Function `suggestpriority`

- **Categoria:** Custo / Abuso
- **Descrição:** a função callable `suggestpriority` invoca o Claude Haiku 4.5,
  consumindo crédito da Anthropic a cada chamada.
- **Contexto de ocorrência:** o signup é público (Firebase Auth com
  e-mail/senha e Google). Um atacante poderia criar uma conta e iterar a
  chamada em loop, gerando custo. App Check (reCAPTCHA v3) ainda está em
  **Fase A (monitor)** — o backend aceita chamadas sem token válido até o
  enforcement ser ligado (Fase B). Ver DEC-006.

## R-02 — Vazamento do segredo `ANTHROPIC_API_KEY`

- **Categoria:** Segurança
- **Descrição:** a chave da Anthropic é um segredo real (diferente da apiKey
  Firebase, que é pública por design). Se vazar, terceiros usam crédito pago.
- **Contexto de ocorrência:** a chave vive no Google Secret Manager e é
  exposta à função via `defineSecret('ANTHROPIC_API_KEY')`. O risco aparece
  se alguém a colar por engano em código versionado, em log, ou num `.env`
  commitado.

## R-03 — Regras do Firestore permissivas em produção

- **Categoria:** Segurança
- **Descrição:** rules permissivas expõem/permitem escrita nas tarefas de
  qualquer usuário.
- **Contexto de ocorrência:** a DEC-004 registra explicitamente que "as
  `firestore.rules` permissivas atuais não podem ir para produção como estão".
  O risco é humano: esquecer de apertar as rules (isolamento por
  `request.auth.uid`) antes do deploy.

## R-04 — RNF-004 não cumprido (desempenho de carregamento)

- **Categoria:** Desempenho
- **Descrição:** TTI < 3s em 3G não é atingido; Lighthouse Performance = 53
  (parcial). Bundle inicial ~638 kb (acima do limite default de 500 kb do
  Angular CLI).
- **Contexto de ocorrência:** import top-level do AngularFire em
  `app.config.ts`, ausência de `loadChildren`/`defer`, e estratégia de
  Firestore real-time na primeira carga. Já documentado como limitação
  conhecida no README.

## R-05 — Indisponibilidade / mudança da API Anthropic

- **Categoria:** Dependência de terceiros
- **Descrição:** a API da Anthropic pode ficar indisponível, sofrer
  rate-limit, ou mudar contrato/modelo (`claude-haiku-4-5-20251001`).
- **Contexto de ocorrência:** dependência externa em runtime. **Mitigado por
  design** pelo fallback heurístico determinístico — mas o risco de degradação
  silenciosa da qualidade permanece se o fallback for acionado sem o usuário
  perceber.

## R-06 — Sugestão de prioridade incorreta ou enviesada

- **Categoria:** Qualidade da IA
- **Descrição:** o Claude pode sugerir uma prioridade inadequada; o fallback
  heurístico por palavras-chave em pt-BR é ainda mais limitado.
- **Contexto de ocorrência:** a saída é forçada via `tool_use` para um dos 4
  valores (low/medium/high/urgent), o que evita saída malformada, mas não
  garante acerto de julgamento. Se o usuário confiar cegamente, prioriza
  errado.

## R-07 — Fator único de conhecimento (bus factor = 1)

- **Categoria:** Operacional
- **Descrição:** todo o conhecimento de arquitetura, deploy e segredos está
  com um único autor.
- **Contexto de ocorrência:** projeto acadêmico individual. Setup de produção
  envolve passos manuais no console (restrição de referrer, providers de Auth,
  segredo Anthropic, reCAPTCHA, enforcement). Se o autor sair, o
  conhecimento operacional se perde.

## R-08 — Ausência de teto de gastos no Firebase Blaze

- **Categoria:** Custo
- **Descrição:** o plano Blaze é pay-as-you-go sem hard cap nativo; um pico de
  uso (legítimo ou abusivo — ver R-01) vira cobrança.
- **Contexto de ocorrência:** o checklist do README recomenda alertas de
  orçamento (~US$ 5/mês), mas alerta **não é bloqueio**. Sem budget alert
  configurado, a primeira sinalização de custo vem na fatura.

## R-09 — Privacidade do conteúdo das tarefas

- **Categoria:** Privacidade
- **Descrição:** título e descrição da tarefa são enviados a um LLM de
  terceiros (Anthropic) para gerar a sugestão de prioridade.
- **Contexto de ocorrência:** o produto é pessoal, mas o dado do usuário
  trafega para fora do Firebase. **Parcialmente mitigado:** os logs da função
  registram apenas `source` e `priority`, **não** o conteúdo da tarefa
  (DEC-005). Ainda assim, o texto vai à Anthropic no momento da chamada.

## R-10 — Duplicação do contrato zod cliente ↔ função

- **Categoria:** Manutenção
- **Descrição:** o schema zod de entrada/saída é declarado duas vezes (cliente
  Angular e Cloud Function).
- **Contexto de ocorrência:** DEC-005 registra que isto é duplicação de
  **contrato** em fronteira de processo (não a duplicação de **lógica** que a
  Unidade 3.2 alerta). O risco é os schemas saírem de sincronia numa evolução
  futura, causando erro de parsing em runtime.
