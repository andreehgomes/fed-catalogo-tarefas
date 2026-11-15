# Histórico de execuções do workflow

| Run | Origem | Branch | Resultado | Duração |
|---|---|---|---|---|
| #1 | push (commit `9b88bef`) | `main` | ✅ sucesso | 11s |
| #2 | push (commit `b543b3b`) | `feature/nova-logica` | ❌ falha | 22s |
| #3 | abertura do PR #1 | `feature/nova-logica` | ❌ falha | 24s |

## Por que os três runs importam

O run **#1** estabelece a linha de base: com `TAX_RATE = 0.07` na `main`,
os 5 testes passam e o pipeline fica verde.

O run **#2** mostra a regressão no push da branch.

O run **#3** é o do Pull Request: `unit_test` ❌ → `ai_debugger` ✅, com o
diagnóstico publicado como comentário no PR.

A comparação entre #1 e #2/#3 isola a causa na mudança introduzida pela
branch, que é exatamente a correlação que o agente de GenAI recebe no prompt
(trace + diff).
