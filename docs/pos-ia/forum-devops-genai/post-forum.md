# Miniprojeto de DevOps com IA Generativa — postagem do fórum

> Rascunho para publicação em https://ava.akcit.ufg.br/mod/forum/discuss.php?d=3859

---

Olá, pessoal!

Segue meu relato do miniprojeto. Adaptei o laboratório para **GitHub Actions**,
por não ter conta no GitLab, mantendo a mesma arquitetura: um estágio de teste e
um estágio de análise que só roda quando o teste falha.

## 1. Repositório

**https://github.com/andreehgomes/fed-catalogo-tarefas**

- Lab: [`labs/devops-genai-lab/`](https://github.com/andreehgomes/fed-catalogo-tarefas/tree/main/labs/devops-genai-lab)
- Pipeline: [`.github/workflows/devops-genai-lab.yml`](https://github.com/andreehgomes/fed-catalogo-tarefas/blob/main/.github/workflows/devops-genai-lab.yml)
- Pull Request com o diagnóstico: [PR #1](https://github.com/andreehgomes/fed-catalogo-tarefas/pull/1)

Os arquivos seguem o roteiro da Unidade 5: `app.py` (OrderService),
`tests/test_app.py`, `genai_analyst.py` (agente), `requirements.txt` e o
workflow no lugar do `.gitlab-ci.yml`.

## 2. Execução do projeto

Montei o cenário de forma um pouco diferente do roteiro, e isso acabou sendo o
ponto mais interessante do exercício.

Em vez de subir o código já quebrado, subi o **laboratório funcionando** na
`main` — pipeline verde, 5 testes passando. Só então criei a branch
`feature/nova-logica` introduzindo o defeito e abri o PR. O resultado foram três
execuções que contam a história inteira:

| Run | Origem | Resultado |
|---|---|---|
| #1 | push na `main` (código correto) | ✅ sucesso em 11s |
| #2 | push da `feature/nova-logica` | ❌ falha em 22s |
| #3 | abertura do PR #1 | ❌ `unit_test` / ✅ `ai_debugger` |

A diferença entre o run #1 e o #2 isola a regressão na mudança da branch, que é
justamente a correlação que o agente recebe no prompt (trace + diff).

No PR, o `unit_test` falhou em 9s e o `ai_debugger` foi disparado logo em
seguida pela condição `if: failure()` — o equivalente ao `when: on_failure` do
GitLab. O diagnóstico apareceu como comentário no próprio PR e no resumo da
execução.

Trecho do log do `unit_test`:

```
tests/test_app.py::test_calculate_tax_aplica_aliquota_sobre_subtotal FAILED [ 80%]
tests/test_app.py::test_calculate_order_total_sudeste FAILED             [100%]

subtotal = 100.0

    def calculate_tax(subtotal: float) -> float:
>       return subtotal + TAX_RATE
E       TypeError: unsupported operand type(s) for +: 'float' and 'str'

app.py:41: TypeError
========================= 2 failed, 3 passed in 0.03s ==========================
Error: Process completed with exit code 1.
```

## 3. Análise com IA generativa

**O erro:** um `TypeError` em `calculate_tax()`. A alíquota de imposto passou a
ser declarada como texto (`TAX_RATE = "0.07"`) e o código a soma a um `float`.

O que torna o caso representativo é **como** o defeito entrou. O diff do PR tem
três linhas e se apresenta como uma refatoração plausível:

```diff
-# Versao correta: aliquota como numero decimal.
-TAX_RATE = 0.07
+# Alterado nesta branch: aliquota passou a ser lida como texto de configuracao.
+TAX_RATE = "0.07"

-    return subtotal * (1 + TAX_RATE)
+    return subtotal + TAX_RATE
```

É sintaticamente válido, o módulo importa sem reclamar, e passa fácil numa
revisão rápida. Note também que **3 dos 5 testes continuam passando** — a falha
é parcial, não uma quebra geral, o que num projeto real tornaria o diagnóstico
menos óbvio.

**Como a IA contribui:** o `genai_analyst.py` coleta o trace do pytest (artefato
publicado pelo job anterior) e o diff do PR, monta um prompt estruturado pedindo
quatro seções — causa-raiz, correção sugerida, riscos e efeitos colaterais, e
como validar — e publica a resposta no PR. O prompt inclui duas restrições
deliberadas: "não invente arquivos ou funções que não apareçam nas evidências" e
"se a evidência for insuficiente, diga o que falta", para reduzir a chance de uma
resposta confiante e errada.

O ganho não é só apontar a linha — isso o próprio pytest já faz. É **ligar a
falha à mudança que a causou**, cruzando trace e diff, e entregar isso no PR,
onde a revisão já está acontecendo.

<!-- TRECHO PENDENTE: colar aqui o diagnóstico real da IA, após cadastrar a chave e re-executar o job -->

## 4. Desafios encontrados

**Plataforma diferente da do roteiro.** Sem conta no GitLab, migrei para o
GitHub Actions. O conceito se mantém, mas dois pontos exigiram tradução:
`when: on_failure` virou `if: failure()`, e, como no GitHub cada job roda em uma
máquina limpa, o trace do pytest não fica disponível para o job seguinte por
padrão. Resolvi publicando o log como **artefato** no `unit_test` e baixando-o
no `ai_debugger`. No GitLab isso é transparente, porque o agente lê o log pela
API.

**Encadeamento condicional.** No GitHub Actions um job com `needs:` é *pulado*
quando o anterior falha — o oposto do que o laboratório precisa. Foi preciso
combinar `needs: unit_test` com `if: failure()` para que o agente rodasse
exatamente no cenário de falha.

**Montar um defeito que não se entregue.** Reescrever o bug como uma mudança de
diff plausível deu mais trabalho do que copiar o exemplo pronto, mas evita que o
agente acerte por causa de uma pista explícita no código em vez do raciocínio
sobre as evidências.

**Agente que não derruba o pipeline.** O `genai_analyst.py` trata falha de HTTP,
ausência de chave e erro inesperado retornando `0`. Um agente de diagnóstico que
quebra o pipeline por conta própria troca um problema por outro.

**Segredo fora do código.** A chave fica em *Settings → Secrets and variables →
Actions*, lida via `secrets.*` e mascarada no log pelo GitHub. O script detecta
qual provedor está configurado e, sem chave nenhuma, apenas imprime o prompt e
encerra sem falhar — foi assim que validei o fluxo antes de ligar o modelo.

## 5. Reflexão crítica

**Vantagens.** A mais concreta é reduzir o tempo de diagnóstico: o log do runner
é longo e o desenvolvedor precisa abrir o Actions, achar o job, expandir o passo
certo. A análise chega pronta no PR. Como recebe o diff junto com o trace, a IA
consegue responder a pergunta que o pytest não responde — *o que mudou para isso
quebrar*. E há um efeito didático: a explicação em linguagem natural ensina quem
está lendo.

**Limitações.** A IA só enxerga o que entra no prompt. No meu caso são o trace e
o diff, truncados em 6.000 caracteres cada — ela não conhece a regra de negócio,
o histórico do serviço nem o resto do código. Daí vem o risco mais sério: ela
produz texto *plausível*, e plausível não é sinônimo de correto. Uma sugestão
errada com aparência de certa custa mais caro do que nenhuma sugestão, porque
desloca a investigação para o lado errado.

Vale notar um caso concreto disso neste laboratório. A correção óbvia aqui seria
`float(TAX_RATE)`, e ela faz os testes passarem. Mas é correção de **sintoma**:
se o valor vier de uma configuração externa com um texto inválido, o `TypeError`
só vira `ValueError`. A decisão de projeto — validar na origem, tipar a
configuração, usar `Decimal` em valores monetários — exige contexto que não está
no prompt. A IA resolve o teste; o engenheiro resolve o problema.

Há ainda os riscos de enviar log e código para um serviço externo (dados
sensíveis, LGPD) e o fato de o diff ser um vetor de *prompt injection*: quem
escreve o código controla parte do que o agente lê.

**Por que validar antes de aplicar.** Porque a IA não executa os testes, não
conhece a regra de negócio e não responde por uma falha em produção — quem
aprova o merge responde. O valor do arranjo está justamente na separação de
papéis que o curso enfatiza: **a IA sugere, o humano valida, a automação
executa**. Se a sugestão for aplicada sem revisão, a automação passa a executar
uma hipótese, e um erro do modelo vira um erro em produção.

Por isso o comentário gerado pelo bot termina sempre com "revise antes de
aplicar". Não é formalidade: é o ponto de controle que mantém a GenAI no papel
de copiloto, e não de autoridade final.

Abraço!
