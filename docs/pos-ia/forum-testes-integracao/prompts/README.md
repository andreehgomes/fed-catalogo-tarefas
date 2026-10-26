# Os quatro tipos de prompt

O fórum pede "ao menos dois tipos de prompt". Usei quatro, porque cada um
ataca uma dimensão diferente da suíte de integração — e porque a comparação
entre eles é justamente o que revela onde a GenAI ajuda e onde ela engana.

Cada tipo está registrado em um arquivo próprio, seguindo o template de
[`docs/prompts/README.md`](../../../prompts/README.md) já adotado no projeto:
prompt integral, resultado, ajustes manuais e lições aprendidas.

## Tabela comparativa

| Tipo | Arquivo | Pergunta que o prompt responde | Técnica predominante |
|------|---------|-------------------------------|----------------------|
| **A** — Cenários de integração | [01-cenarios-integracao.md](./01-cenarios-integracao.md) | *Quais fluxos atravessam mais de um componente?* | Role prompting + contexto estruturado |
| **B** — Dados de teste | [02-dados-de-teste.md](./02-dados-de-teste.md) | *Com quais valores exercitar cada fronteira?* | Few-shot + análise de valor-limite |
| **C** — Casos de erro | [03-casos-de-erro.md](./03-casos-de-erro.md) | *O que pode quebrar entre os componentes?* | Prompt adversarial ("aja como atacante") |
| **D** — Contrato de API | [04-contrato-api.md](./04-contrato-api.md) | *O cliente e o servidor concordam sobre o payload?* | Chain-of-thought + schema como fonte da verdade |

## Os quatro tipos em uma frase cada

**Tipo A — Geração de cenários de integração.** Dá à LLM o diagrama de
componentes e os contratos (schemas zod, assinaturas dos serviços) e pede
fluxos que atravessem *pelo menos duas* fronteiras. O valor está na palavra
"atravessem": sem ela, a LLM devolve testes unitários disfarçados.

**Tipo B — Geração de dados de teste.** Dá os schemas zod com seus limites
(`min(1)`, `max(120)`, `max(2000)`, enums fechados) e pede uma matriz de
valores válidos, de fronteira e inválidos para cada campo. O valor está em
pedir explicitamente os três grupos — pedir "dados de teste" produz só o
grupo válido.

**Tipo C — Geração de casos de erro.** Inverte o papel: em vez de "teste este
sistema", pede "liste como fazer este sistema falhar na comunicação entre
componentes". O valor está na inversão, que desbloqueia modos de falha que o
prompt de cenários nunca alcança (timestamp nulo, documento deletado entre
leitura e escrita, callable devolvendo enum desconhecido).

**Tipo D — Teste de contrato de API.** Trata o schema como fonte da verdade e
pede testes que detectem divergência entre o que o cliente *espera* e o que o
servidor *envia*. Especialmente relevante aqui porque a
[DEC-005](../../../decisoes.md) duplica deliberadamente o schema entre cliente
e Cloud Function — duplicação é exatamente onde contratos se rompem em
silêncio.

## Princípio comum aos quatro

Todos os quatro prompts, na versão final, compartilham cinco elementos. A
ausência de qualquer um deles degradou o resultado em alguma iteração:

1. **Papel explícito** — "Você é um engenheiro de QA especializado em testes
   de integração em aplicações Angular + Firebase."
2. **Contexto real, colado** — o código-fonte dos schemas e serviços, não uma
   descrição em prosa. Descrever o sistema em palavras faz a LLM alucinar
   campos que não existem.
3. **Fronteira nomeada** — qual integração específica (F1–F4) está em foco.
4. **Formato de saída fixado** — tabela com colunas definidas, para os casos
   serem comparáveis entre prompts e rastreáveis na suíte.
5. **Proibição explícita** — "não gere testes que exercitem um único
   componente isolado"; "não invente métodos que não estão no código".

O item 5 foi a descoberta mais útil do exercício: dizer à LLM o que **não**
fazer eliminou mais ruído do que qualquer refinamento na parte positiva do
prompt.
