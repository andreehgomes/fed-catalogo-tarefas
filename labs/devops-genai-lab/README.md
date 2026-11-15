# DevOps GenAI Lab — OrderService

Laboratório da Unidade 5 do Curso 14 (Manutenção, DevOps e Operações com GenAI),
adaptado de GitLab CI/CD para **GitHub Actions**.

## Objetivo

Demonstrar um pipeline de CI que detecta uma falha e aciona um agente de IA
generativa para diagnosticar a causa-raiz e sugerir a correção, mantendo a
decisão final com o humano (*human-in-the-loop*).

## Arquivos

| Arquivo | Papel |
|---|---|
| `app.py` | Microsserviço `OrderService` com defeito intencional |
| `tests/test_app.py` | Testes unitários que expõem o defeito |
| `genai_analyst.py` | Agente que monta o prompt (trace + diff) e consulta o LLM |
| `requirements.txt` | Dependências (`pytest`, `requests`) |
| `pytest.ini` | Configuração do pytest |
| `../../.github/workflows/devops-genai-lab.yml` | Pipeline de CI |

## O defeito intencional

Em `app.py`, a alíquota está declarada como string:

```python
TAX_RATE = "0.07"   # deveria ser 0.07 (float)
```

Resultado: `calculate_tax()` executa `float + str` e levanta
`TypeError: unsupported operand type(s) for +: 'float' and 'str'`.
O módulo importa normalmente — o erro só aparece em tempo de execução,
capturado pelos testes.

## Fluxo do pipeline

1. **`unit_test`** (stage `test`) — instala dependências e roda `pytest -v`.
   Falha ❌ e publica `pytest-output.log` como artefato.
2. **`ai_debugger`** (stage `genai_analysis`) — roda com `if: failure()`
   (equivalente ao `when: on_failure` do GitLab). Baixa o trace, coleta o diff
   do PR, envia ao modelo e publica a análise como comentário no PR e no
   *step summary*.

## Executar localmente

```bash
cd labs/devops-genai-lab
pip install -r requirements.txt
pytest -v
```

Para simular o agente sem chave de API:

```bash
pytest -v > pytest-output.log 2>&1
python genai_analyst.py
```

## Segredos

A chave nunca fica no código. Configure em
**Settings → Secrets and variables → Actions** do repositório:

- `ANTHROPIC_API_KEY` **ou** `OPENAI_API_KEY`

Sem chave, o job monta e imprime o prompt, mas não chama o modelo — o pipeline
continua funcionando.
