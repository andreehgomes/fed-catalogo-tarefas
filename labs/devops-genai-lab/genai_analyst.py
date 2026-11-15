#!/usr/bin/env python3
"""Agente de analise de falhas de pipeline com IA generativa.

Executado pelo GitHub Actions apenas quando o job de testes falha.
Fluxo:
  1. le o trace do pytest e o diff do Pull Request;
  2. monta um prompt estruturado (causa-raiz, correcao, riscos);
  3. consulta um LLM (Anthropic ou OpenAI, conforme o segredo disponivel);
  4. grava a analise em analise-genai.md para ser publicada no PR.

A chave NUNCA aparece no codigo: vem de secret do repositorio.
Sem chave configurada, o script imprime o prompt e encerra sem falhar.
"""

from __future__ import annotations

import json
import os
import pathlib
import sys
import urllib.error
import urllib.request

MAX_TRACE_CHARS = 6000
MAX_DIFF_CHARS = 6000
OUTPUT_FILE = pathlib.Path("analise-genai.md")

PROMPT_TEMPLATE = """Voce e um engenheiro de confiabilidade (SRE) apoiando um time de desenvolvimento.
O pipeline de CI falhou. Analise as evidencias abaixo e responda em portugues do Brasil.

Responda exatamente nestas quatro secoes, em markdown:

## Causa-raiz
Explique o motivo tecnico da falha, citando o arquivo e a linha.

## Correcao sugerida
Mostre o trecho de codigo corrigido em um bloco ```python.

## Riscos e efeitos colaterais
Aponte o que pode quebrar se a correcao for aplicada sem analise.

## Como validar
Liste os passos para confirmar que a correcao resolveu o problema.

Nao invente arquivos ou funcoes que nao aparecam nas evidencias.
Se a evidencia for insuficiente, diga o que falta.

### Trace do job de testes
```
{trace}
```

### Diff das mudancas do Pull Request
```diff
{diff}
```
"""


def read_truncated(path: str, limit: int, label: str) -> str:
    """Le um arquivo e corta no limite, preservando o final (onde esta o erro)."""
    file = pathlib.Path(path)
    if not file.exists():
        return f"({label} indisponivel: arquivo {path} nao encontrado)"
    content = file.read_text(encoding="utf-8", errors="replace").strip()
    if not content:
        return f"({label} vazio)"
    if len(content) > limit:
        content = "[...trecho inicial omitido...]\n" + content[-limit:]
    return content


def build_prompt(trace: str, diff: str) -> str:
    return PROMPT_TEMPLATE.format(trace=trace, diff=diff)


def post_json(url: str, payload: dict, headers: dict) -> dict:
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def call_anthropic(api_key: str, prompt: str) -> str:
    body = post_json(
        "https://api.anthropic.com/v1/messages",
        {
            "model": os.getenv("GENAI_MODEL", "claude-sonnet-4-5"),
            "max_tokens": 1500,
            "messages": [{"role": "user", "content": prompt}],
        },
        {
            "content-type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
    )
    return "".join(
        block.get("text", "") for block in body.get("content", []) if block.get("type") == "text"
    ).strip()


def call_openai(api_key: str, prompt: str) -> str:
    body = post_json(
        "https://api.openai.com/v1/chat/completions",
        {
            "model": os.getenv("GENAI_MODEL", "gpt-4o-mini"),
            "max_tokens": 1500,
            "messages": [{"role": "user", "content": prompt}],
        },
        {
            "content-type": "application/json",
            "authorization": f"Bearer {api_key}",
        },
    )
    return body["choices"][0]["message"]["content"].strip()


def write_output(analysis: str, provider: str) -> None:
    OUTPUT_FILE.write_text(
        "## Analise automatizada da falha (IA generativa)\n\n"
        f"{analysis}\n\n"
        "---\n"
        f"*Gerado automaticamente pelo job `ai_debugger` usando {provider}. "
        "**Revise antes de aplicar** — a recomendacao precisa de validacao humana "
        "(human-in-the-loop).*\n",
        encoding="utf-8",
    )
    print(f"Analise gravada em {OUTPUT_FILE}")


def main() -> int:
    trace_path = os.getenv("TRACE_FILE", "pytest-output.log")
    diff_path = os.getenv("DIFF_FILE", "pr.diff")

    trace = read_truncated(trace_path, MAX_TRACE_CHARS, "Trace")
    diff = read_truncated(diff_path, MAX_DIFF_CHARS, "Diff")
    prompt = build_prompt(trace, diff)

    print("=" * 72)
    print("PROMPT ENVIADO AO MODELO")
    print("=" * 72)
    print(prompt)
    print("=" * 72)

    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()

    try:
        if anthropic_key:
            provider = "Anthropic Claude"
            analysis = call_anthropic(anthropic_key, prompt)
        elif openai_key:
            provider = "OpenAI"
            analysis = call_openai(openai_key, prompt)
        else:
            print(
                "Nenhuma chave de API configurada (ANTHROPIC_API_KEY / OPENAI_API_KEY).\n"
                "O prompt acima e o que seria enviado ao modelo.",
                file=sys.stderr,
            )
            write_output(
                "_Chave de API nao configurada neste repositorio._\n\n"
                "O job montou o prompt com o trace do pytest e o diff do PR, "
                "mas nao realizou a chamada ao modelo. O conteudo do prompt "
                "esta disponivel no log do job.",
                "modo sem chave",
            )
            return 0
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:500]
        print(f"Falha HTTP {error.code} ao consultar o modelo: {detail}", file=sys.stderr)
        write_output(
            f"_A chamada ao modelo falhou (HTTP {error.code})._\n\n"
            "O prompt montado esta no log do job `ai_debugger`.",
            "chamada com erro",
        )
        return 0
    except Exception as error:  # nao derrubar o pipeline por causa do agente
        print(f"Erro inesperado ao consultar o modelo: {error}", file=sys.stderr)
        write_output(
            "_Erro inesperado na consulta ao modelo._\n\n"
            "O prompt montado esta no log do job `ai_debugger`.",
            "chamada com erro",
        )
        return 0

    print("-" * 72)
    print("RESPOSTA DO MODELO")
    print("-" * 72)
    print(analysis)
    write_output(analysis, provider)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
