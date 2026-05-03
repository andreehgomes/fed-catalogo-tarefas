## [P-003] Release 3 — Final (Cloud Function com Claude + App Check + deploy)
- Modelo: Claude (via Claude Code) — Claude Opus 4.7 (1M context)
- Data: 2026-05-03
- Release: 3 — Final
- Camada: Cloud Functions + cliente Angular + App Check + documentação final

### Prompt enviado

> Mensagem do usuário inicial: "está tudo funcionando agora, pode seguir
> para a release 3" (após validação completa da Release 2 deployada).
>
> Resposta da IA: oferta de 8 decisões para alinhamento — plano Firebase
> (Blaze ou Spark + adaptação client-side), gestão da chave de IA
> (defineSecret v2 vs config legacy), comportamento do fallback
> heurístico (keywords vs tamanho vs sempre medium), onde colocar o
> botão de sugestão (criação, edição, ambos), App Check sim/não,
> deploy automático ou manual, Lighthouse manual ou automatizado,
> formato da seção "IA" no README.
>
> Em troca, o usuário interrompeu para pedir reflexão sobre **por que
> usar OpenAI** — momento de pausa importante onde a IA explicou o
> propósito da função (RF-007) dentro do projeto, e ofereceu Claude
> como alternativa equivalente. O usuário escolheu Claude.
>
> Confirmações finais: modelo `claude-haiku-4-5-20251001`, plano
> Blaze já ativo, chave Anthropic em mãos. A IA executou então:
>
> - **Functions:** schema zod compartilhado (DEC-005), heurística
>   determinística com palavras-chave pt-BR, adapter Claude usando
>   `tool_use` para forçar saída válida, callable v2 com `defineSecret`.
> - **Cliente Angular:** `provideFunctions` em app.config.ts,
>   `PrioritySuggestionService` via `httpsCallable`, botões "Sugerir
>   com IA" no formulário de criação e na edição inline, selo da
>   fonte da sugestão (Claude vs heurística).
> - **App Check:** estrutura opt-in via `recaptchaSiteKey` em
>   `firebase-config.ts`. Sem site key, app continua funcionando.
>   Enforcement faseado (DEC-006).
> - **Testes:** 11 testes Jest na heurística (case-insensitive,
>   determinismo, prioridade entre keywords, edge cases).
> - **Docs:** DEC-005 (Claude + duplicação de schema é OK), DEC-006
>   (App Check faseado), README final com seção IA expandida,
>   métricas, placeholders para prints, checklist completo de deploy.

### Resultado obtido

Implementação completa da Release 3:

- 6 arquivos novos em `functions/src/suggest-priority/` (schema,
  heuristic, claude-adapter, index, heuristic.spec, e o glue
  `functions/src/index.ts`).
- 4 arquivos novos no app Angular: `priority-suggestion.service.ts`,
  ajustes em `app.config.ts`, `tasks.component.ts/html/scss`,
  `firebase-config.ts` com `recaptchaSiteKey`.
- 2 ADRs novas em `docs/decisoes.md`.
- README reescrito com seção "Como a IA foi usada" detalhada,
  separando IA-de-desenvolvimento (Claude Code/Opus) de IA-de-runtime
  (Claude Haiku via Function).
- Build Angular verde (sanity check em `ng build`).
- Build Functions verde (`tsc`).
- 11 testes Jest da heurística passando em ~5s.
- Backlog marcado: RF-007, App Check e Documentação final ✅.
  Deploy e Lighthouse permanecem para o usuário rodar manualmente.

### Ajustes manuais necessários

(A serem feitos pelo usuário antes da entrega final:)

- **Firebase App Check:** registrar reCAPTCHA v3 em
  `console.firebase.google.com/project/fed-catalogo-tarefas/appcheck`,
  copiar a SITE KEY e colar em `firebase-config.ts → recaptchaSiteKey`.
- **Anthropic secret:** rodar `firebase functions:secrets:set
  ANTHROPIC_API_KEY` na raiz do repo e colar a chave.
- **Deploy:** `firebase deploy` (após confirmar build local verde).
- **Lighthouse manual:** abrir o app deployado em
  `https://fed-catalogo-tarefas.web.app/`, rodar Lighthouse no
  Chrome DevTools (modo Performance + Mobile, throttling 3G), copiar
  o número de TTI no README. Tirar print da página com o botão
  "Sugerir com IA" funcionando. Tirar print de
  `firebase functions:log` mostrando `source: claude` e
  `source: heuristic` em chamadas distintas.
- **Enforcement App Check (Fase B):** após 24-48h monitorando
  métricas no console, ligar enforcement em Authentication, Firestore
  e Functions.

### Lições aprendidas

(A preencher após reflexão. Pontos importantes capturados:)

- **A pausa estratégica do usuário ("para que vamos usar a OpenAI?")
  foi a melhor ação da release.** Não era resistência — era oportunidade
  de a IA explicar com clareza o PROPÓSITO da função no projeto, e em
  troca ofereceu Claude como alternativa coerente. Em projetos
  acadêmicos, manter consistência narrativa (todo o stack de IA é
  Claude) é tão importante quanto fidelidade ao briefing.
- **A lição da Unidade 3.2 é mais sutil do que parece.** O perigo NÃO
  é "duplicação superficial" — é duplicação de LÓGICA de classificação.
  O schema zod do servidor é deliberadamente duplicado no cliente, mas
  isso é contrato em fronteira de processo, não a duplicação proibida.
  A documentação dessa distinção em DEC-005 é o que evita confusão
  para o próximo dev (ou o próximo "eu" daqui a 6 meses).
- **App Check é complexo o bastante para merecer faseamento.** Ligar
  enforcement antes de validar que tokens chegam corretamente é
  receita pra app quebrado em produção. O esquema opt-in via
  `recaptchaSiteKey` permite que o repo funcione localmente sem
  setup extra — bom para reprodutibilidade acadêmica.
- **Defesa em profundidade ganha clareza quando explicada em
  camadas.** O README lista 5 camadas distintas, cada uma protegendo
  contra um vetor diferente. É mais educativo do que listar "todas as
  proteções de segurança" sem hierarquia.
