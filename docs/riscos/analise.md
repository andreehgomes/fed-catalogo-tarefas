# Análise dos Riscos — fed-catalogo-tarefas

Análise qualitativa de **probabilidade × impacto** dos riscos identificados em
[identificacao.md](./identificacao.md). Escala: Baixa / Média / Alta.

A **exposição** é a combinação de probabilidade e impacto e define a ordem de
tratamento. Riscos de exposição Alta entram como prioridade nas estratégias de
resposta ([respostas.md](./respostas.md)).

## Matriz de riscos

| ID   | Risco                                      | Probabilidade | Impacto | Exposição |
|------|--------------------------------------------|:-------------:|:-------:|:---------:|
| R-01 | Abuso da Cloud Function                     | Média         | Alto    | **Alta**  |
| R-02 | Vazamento do `ANTHROPIC_API_KEY`            | Baixa         | Alto    | **Média** |
| R-03 | Rules permissivas em produção               | Média         | Alto    | **Alta**  |
| R-04 | RNF-004 não cumprido (desempenho)           | Alta          | Baixo   | **Média** |
| R-05 | API Anthropic indisponível / muda contrato  | Média         | Baixo   | **Baixa** |
| R-06 | Sugestão de IA incorreta / enviesada        | Média         | Médio   | **Média** |
| R-07 | Bus factor = 1                              | Alta          | Médio   | **Alta**  |
| R-08 | Sem teto de gastos no Blaze                 | Média         | Alto    | **Alta**  |
| R-09 | Privacidade do conteúdo das tarefas         | Baixa         | Médio   | **Baixa** |
| R-10 | Duplicação de contrato zod                  | Baixa         | Baixo   | **Baixa** |

## Mapa de calor (probabilidade × impacto)

```
Impacto
 Alto  │  R-04(-)   │ R-01, R-03 │ R-08       │
       │            │ R-08       │            │
 Médio │ R-10       │ R-06, R-09 │ R-07       │
 Baixo │            │ R-05       │            │
       └────────────┴────────────┴────────────┘
         Baixa         Média         Alta      → Probabilidade
```

## Fatores condicionantes e impactos

### R-01 — Abuso da Cloud Function (Exposição Alta)
- **Fator condicionante:** signup público + App Check ainda em modo monitor
  (Fase A). Enquanto o enforcement (Fase B) não é ligado, o backend aceita
  chamadas sem token válido.
- **Impacto:** custo financeiro direto (crédito Anthropic + invocações de
  função) e potencial esgotamento de cota. Combina com R-08 (sem teto de
  gastos) para virar o cenário de pior caso do projeto.

### R-03 — Rules permissivas em produção (Exposição Alta)
- **Fator condicionante:** erro humano de deploy — subir sem apertar as rules.
  A própria DEC-004 marca isso como bloqueio de produção.
- **Impacto:** quebra do RF-006 (isolamento por usuário). Um usuário veria/
  escreveria tarefas de outro. Impacto de confiança e privacidade alto.

### R-07 — Bus factor = 1 (Exposição Alta)
- **Fator condicionante:** projeto individual; setup de produção com muitos
  passos manuais de console não automatizados.
- **Impacto:** continuidade. Sem o autor, ninguém opera deploy, rotação de
  segredo ou resposta a incidente. Alta probabilidade (é a estrutura do
  projeto), impacto médio (projeto acadêmico, não crítico de negócio).

### R-08 — Sem teto de gastos no Blaze (Exposição Alta)
- **Fator condicionante:** Blaze é pay-as-you-go; alerta de orçamento não é
  bloqueio. Amplifica R-01.
- **Impacto:** cobrança inesperada. Num projeto pessoal/acadêmico, uma fatura
  surpresa é um impacto real e sensível ao autor.

### R-04 — RNF-004 não cumprido (Exposição Média)
- **Fator condicionante:** decisões de arquitetura (import top-level do
  AngularFire, sem lazy-load). Probabilidade "Alta" porque **já ocorreu** e
  está medido (Lighthouse 53).
- **Impacto:** baixo — é requisito não-funcional de um app pessoal, com causa
  raiz e plano de correção já documentados. Aceito conscientemente nesta
  entrega.

### R-06 — Sugestão de IA incorreta (Exposição Média)
- **Fator condicionante:** julgamento de prioridade é subjetivo; o fallback
  heurístico é ainda mais raso.
- **Impacto:** médio — a sugestão é **assistiva**, não automática; o usuário
  revisa e pode sobrescrever o select. O selo "via Claude / via heurística"
  reduz o risco de confiança cega.
