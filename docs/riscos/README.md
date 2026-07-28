# Gestão de Riscos e Comunicação — fed-catalogo-tarefas

Artefatos de gestão de riscos produzidos como exercício prático da unidade de
**IA Generativa aplicada à gestão de riscos e comunicação em projetos de
software**, usando o projeto real [fed-catalogo-tarefas](../../README.md) como
cenário.

## Estrutura

| Etapa | Artefato | Conteúdo |
|-------|----------|----------|
| 01 — Identificação | [identificacao.md](./identificacao.md) | Lista de 10 riscos (R-01..R-10) com categoria, descrição e contexto de ocorrência. |
| 02 — Análise | [analise.md](./analise.md) | Matriz probabilidade × impacto, mapa de calor e fatores condicionantes. |
| 03 — Resposta | [respostas.md](./respostas.md) | Estratégia (evitar / mitigar / transferir / aceitar) e ações por risco. |
| 04 — Comunicação | [../comunicacao/status-stakeholders.md](../comunicacao/status-stakeholders.md) | Narrativa de status para stakeholders. |

## Riscos de maior exposição

- **R-01** — Abuso da Cloud Function queimando crédito Anthropic → *mitigar*
- **R-03** — Rules permissivas em produção → *evitar*
- **R-07** — Bus factor = 1 → *mitigar*
- **R-08** — Sem teto de gastos no Blaze → *transferir / mitigar*

## Como a IA apoiou

Os artefatos foram elaborados em conversa com **Claude (Claude Code)**, que leu
o código e a documentação real do projeto (README, ADRs `DEC-001..006`, escopo)
e ajudou a **ancorar cada risco em fatos concretos da arquitetura** — não em
riscos genéricos de software. O autor revisou, ajustou probabilidades/impactos
e validou as estratégias. A IA acelerou o levantamento e a redação; o
julgamento de contexto e a decisão final permaneceram humanos.
