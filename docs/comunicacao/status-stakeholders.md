# Comunicação de Status aos Stakeholders — fed-catalogo-tarefas

> **Stakeholders deste projeto:** o autor/desenvolvedor, o professor/avaliador
> da disciplina e usuários finais (uso pessoal). A comunicação abaixo é uma
> narrativa de status pensada para o avaliador — contexto, riscos e próximos
> passos, sem jargão desnecessário.

---

## Onde o projeto está

O **fed-catalogo-tarefas** está entregue nas três releases planejadas: CRUD de
tarefas (Release 1), autenticação e isolamento por usuário (Release 2) e a
sugestão de prioridade assistida por IA em produção (Release 3), com deploy no
Firebase Hosting. A aplicação está no ar e funcional.

## Contexto de riscos — o que monitoramos

A gestão de riscos concentrou-se em três frentes que, juntas, formam o cenário
de maior atenção do projeto:

1. **Custo e abuso da IA em runtime.** A função que chama o Claude consome
   crédito pago. O risco de maior exposição é alguém abusar dessa chamada
   (R-01) combinado com a ausência de um teto rígido de gastos no plano Blaze
   (R-08). **O que já está feito:** a função exige login e valida App Check;
   o modelo Haiku mantém o custo unitário em ~US$ 0,0001/sugestão. **O que
   falta:** ligar o *enforcement* do App Check (Fase B) e configurar o alerta
   de orçamento.

2. **Segurança e isolamento de dados.** Um deploy com regras permissivas
   quebraria o isolamento entre usuários (R-03). **Situação:** evitado — as
   regras autenticadas por `userId` já estão em produção e o deploy tem
   checklist obrigatório. A segurança é feita em 5 camadas (referrer, Auth,
   Rules, App Check, validação na função), não por ofuscação.

3. **Resiliência da IA.** Se a API da Anthropic cair ou mudar (R-05), o produto
   **não para**: há um fallback heurístico determinístico, e o app mostra
   honestamente ao usuário se a sugestão veio do Claude ou do fallback.

## Limitação assumida conscientemente

O requisito de desempenho **RNF-004 (TTI < 3s em 3G) não foi cumprido**
(Lighthouse Performance ~53, bundle inicial ~638 kb). Isso é uma **decisão
consciente**: o foco da disciplina é IA aplicada ao desenvolvimento, não
performance web. A causa raiz e o plano de otimização estão documentados. A
acessibilidade, por outro lado, atingiu **100** no Lighthouse (RNF-005
superado).

## Próximos passos

| Prioridade | Ação                                                        | Risco tratado |
|:----------:|-------------------------------------------------------------|:-------------:|
| Alta       | Ligar enforcement do App Check (Fase B) após validação      | R-01          |
| Alta       | Configurar budget alert (~US$ 5/mês) no Cloud Billing       | R-08          |
| Média      | Otimizar carregamento (lazy-load, `defer`, `getDocs`)       | R-04          |
| Média      | Automatizar passos manuais de deploy (reduzir bus factor)   | R-07          |
| Baixa      | Aviso ao usuário sobre uso de IA de terceiros               | R-09          |

## Resumo executivo em uma linha

O projeto está entregue e no ar; os riscos de maior exposição são de **custo/
abuso da IA**, com mitigações já ativas e duas ações pontuais pendentes de
enforcement e orçamento; a única limitação técnica assumida (desempenho) é
consciente e documentada.
