# fed-catalogo-tarefas

SPA pessoal de **gestão de tarefas** com persistência no Firebase Firestore,
construída como entrega final da disciplina de pós-graduação em IA aplicada
ao desenvolvimento de software. O projeto evolui em três releases — Core,
Qualidade e Final — e na entrega final inclui uma sugestão de prioridade
assistida por IA via Cloud Function (OpenAI com fallback heurístico local).

## Stack

| Camada           | Tecnologia                                    |
|------------------|-----------------------------------------------|
| Frontend         | Angular 19+ (standalone, Signals, SCSS)       |
| Persistência     | Firebase Firestore via AngularFire (`inject`) |
| Autenticação     | Firebase Auth *(Release 2)*                   |
| Backend serverless | Cloud Functions Node 20 *(Release 3)*       |
| Validação runtime| zod                                           |
| Hospedagem       | Firebase Hosting                              |
| Smoke E2E        | Playwright (Chromium)                         |

## Como rodar (máquina limpa)

> ℹ️ Pré-requisitos: Node 20+, npm 10+, Firebase CLI (`npm i -g firebase-tools`).

```bash
# 1. Clone e entre no app
cd fed-catalogo-tarefas-app

# 2. Instale dependências
npm install

# 3. (opcional) Suba o emulator de Firestore em outro terminal,
#    a partir da raiz do repo (onde está firebase.json):
cd ..
firebase emulators:start --only firestore

# 4. De volta no app, rode o dev server
cd fed-catalogo-tarefas-app
npm start              # ng serve em http://localhost:4200

# 5. Smoke test (em outro terminal, com o ng serve no ar)
npm run e2e
```

> Em modo `development` o app conecta automaticamente em
> `127.0.0.1:8080` (Firestore Emulator). Para deploy real, ajuste
> `src/environments/firebase-config.ts` com a config do seu projeto Firebase.

## Documentação

- [Escopo do MVP](./docs/escopo-MVP.md) — objetivo, RFs, RNFs e fora-de-escopo
- [Backlog](./docs/backlog.md) — releases Core / Qualidade / Final
- [Arquitetura](./docs/arquitetura.mmd) — diagrama Mermaid da topologia
- [Decisões arquiteturais](./docs/decisoes.md) — DEC-001 (Firestore), DEC-002 (zod), DEC-003 (Signals)
- [Prompts usados](./docs/prompts/) — registro de cada prompt enviado a IA

## Roadmap

Acompanhe o progresso no [backlog](./docs/backlog.md):

- **Release 1 — Core (v0.1.0)**: CRUD básico de tarefas em Signals + zod, Playwright smoke.
- **Release 2 — Qualidade (v0.2.0)**: Auth, regras de segurança, AuthGuard, testes, acessibilidade.
- **Release 3 — Final (v1.0.0)**: Cloud Function `suggestPriority` (OpenAI + fallback) e deploy.

## Segurança

A `apiKey` do Firebase Web em [`firebase-config.ts`](./fed-catalogo-tarefas-app/src/environments/firebase-config.ts)
**é pública por design** — o SDK precisa dela em runtime no navegador, então
ela aparece no JS de qualquer visitante do app independente de estar no Git
ou em variáveis de ambiente. A doc oficial confirma:
[Are Firebase API keys safe to expose?](https://firebase.google.com/docs/projects/api-keys)

A segurança real do app é construída em camadas — veja
[DEC-004](./docs/decisoes.md) para o raciocínio completo.

### Checklist OBRIGATÓRIO antes do primeiro `firebase deploy`

Sem cumprir este checklist, **não faça deploy** — o app ficaria aberto a
abuso (escritas anônimas no Firestore, consumo da cota grátis etc.).

- [ ] **1. Restringir a `apiKey` por domínio HTTP referrer** no Google Cloud Console:
  1. Abra https://console.cloud.google.com/apis/credentials?project=fed-catalogo-tarefas
  2. Edite a chave `Browser key (auto created by Firebase)`
  3. Em *Application restrictions* escolha *HTTP referrers (web sites)*
  4. Em *Website restrictions* adicione:
     - `http://localhost:*/*`
     - `http://127.0.0.1:*/*`
     - `https://fed-catalogo-tarefas.web.app/*`
     - `https://fed-catalogo-tarefas.firebaseapp.com/*`
     - (eventual domínio próprio quando configurar)
  5. Em *API restrictions* deixe restrita aos serviços que o app usa
     (Cloud Firestore, Identity Toolkit, Cloud Functions).
  6. Salve.

- [ ] **2. Trocar as `firestore.rules` para regras autenticadas.**
  As regras atuais (Release 1) liberam tudo — adequadas apenas para o
  Firestore Emulator local. Antes de deploy, ou:
  - **(opção segura)** entregar a Release 2 com Auth + rules
    `request.auth != null && request.auth.uid == resource.data.userId`; ou
  - **(opção temporária)** trocar manualmente as rules para
    `allow read, write: if false;` para deploy intermediário.

- [ ] **3. Configurar Firebase App Check** com reCAPTCHA v3 *(Release 2/3)*:
  https://console.firebase.google.com/project/fed-catalogo-tarefas/appcheck

- [ ] **4. (Opcional) Configurar alertas de orçamento** no Google Cloud
  para não ser surpreendido caso algum abuso passe pelas camadas anteriores:
  https://console.cloud.google.com/billing/budgets?project=fed-catalogo-tarefas

### O que NÃO funcionaria como segurança

- ❌ Esconder a `apiKey` em `.env.local` — ela acaba no bundle de qualquer jeito.
- ❌ Ofuscar/minificar o JavaScript — DevTools mostra tudo.
- ❌ Rotacionar a chave periodicamente — não há mecanismo automático e
  cada rotação exige redeploy.

## Como a IA foi usada neste projeto

> *Esta seção será expandida na Release 3 com prints, métricas e reflexões.*

A construção do projeto foi conduzida com IA assistente (Claude Code, modelo
Claude Opus 4.7 1M) seguindo o processo da disciplina:

1. **Cada prompt é registrado** em [`docs/prompts/`](./docs/prompts/) com
   modelo, data, release, prompt enviado, resultado, ajustes manuais
   necessários e lições aprendidas.
2. **A IA pergunta antes de gravar arquivos sensíveis** (ex.: `firebase.json`,
   `firestore.rules`), reproduzindo a prática da Unidade 4.2 do material
   (não fazer suposições silenciosas).
3. **Alertas explícitos de duplicação** quando a IA identifica risco do
   *anti-padrão PriorityAdvisor* (Unidade 3.2): mesma lógica em duas camadas.
4. **Decisões arquiteturais** ficam em `docs/decisoes.md`, sempre com
   contexto, motivo e alternativas consideradas.

## Licença

Projeto acadêmico — uso pessoal e educacional.
