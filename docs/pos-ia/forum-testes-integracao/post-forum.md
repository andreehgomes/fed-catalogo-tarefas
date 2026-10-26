# Texto para postar no fórum

> Copiar daqui para baixo. Confirme que o push foi feito antes de postar, para
> o link já abrir o conteúdo.
>
> A versão longa desta reflexão — as nove iterações de prompt, a análise
> detalhada e as evidências de execução — está no próprio repositório
> ([analise-prompts.md](./analise-prompts.md)). O texto abaixo é o comentário
> do fórum.

---

Olá, pessoal!

**Repositório:** https://github.com/andreehgomes/fed-catalogo-tarefas
**Entrega:** `docs/pos-ia/forum-testes-integracao/` · **Suíte:** `fed-catalogo-tarefas-app/src/app/integration/`

## Cenário

Usei as fronteiras reais da aplicação que venho construindo na pós, em vez de
um exemplo didático: um catálogo de tarefas em Angular 20 que conversa com
Firebase Auth, Firestore e uma Cloud Function callable (`suggestpriority`, que
usa Claude Haiku para sugerir prioridade). Quatro fronteiras distintas —
componente ↔ serviço (validação zod), serviço ↔ Auth (ownership), serviço ↔
Firestore (persistência e concorrência) e cliente ↔ Cloud Function (contrato).

## Tipos de prompt

Usei quatro: **cenários de integração** (role prompting), **dados de teste**
(valor-limite), **casos de erro** (adversarial, no papel de "engenheiro de
caos") e **contrato de API** (chain-of-thought com o schema como fonte da
verdade). Resultado: 27 casos, que viraram 34 testes em Karma/Jasmine.

## Qualidade e diversidade

O que não esperava: **cada tipo achou uma classe diferente de defeito**, com o
mesmo modelo e o mesmo código colado.

O de **cenários** cobriu os fluxos, mas com viés forte para caminho feliz —
7 de 8 casos. O de **dados** achou os defeitos de validação na borda: que
`.trim()` roda antes do `.min(1)`, que `.default()` cobre `undefined` mas não
`null` (relevante, porque formulário Angular emite `null`), e que o limite de
2000 caracteres conta unidades UTF-16, então 1000 emojis já o ocupam inteiro.
O **adversarial** foi o mais produtivo: descobriu que durante a *latency
compensation* do Firestore o `serverTimestamp()` chega `null` no listener
local e o código faz `?? new Date(0)` — a tarefa recém-criada recebe data de
1970 e pula de posição na lista. Nada lança erro; o teste de caminho feliz
passa. O de **contrato** apontou que `httpsCallable<I,O>` é genérico de
TypeScript apenas, sem validação em runtime, então qualquer divergência
atravessa o cliente em silêncio.

Pedir só "gere testes de integração" (que é o primeiro tipo) produziria uma
suíte verde, de aparência completa, que não detectaria nenhum desses defeitos.
Os tipos não competem — se complementam.

## Ajustes necessários

Nove iterações, quatro descartadas. Os de maior efeito:

1. **Colar o código real em vez de descrever o sistema.** A primeira versão
   chamou métodos inexistentes e supôs uma API REST que o projeto não tem.
2. **Exigir que cada caso atravesse ≥2 fronteiras.** Sem isso, ~40% da saída
   vira teste unitário disfarçado, mesmo com o código colado.
3. **Pedir o "invariante protegido" de cada caso.** Uma coluna a mais na
   tabela, e a LLM passou a deduplicar sozinha. Melhor custo-benefício.
4. **Proibir o ferramental errado, não só indicar o certo.** O prompt de
   contrato insistia em `HttpTestingController`, que não intercepta callables
   do Firebase; só cedeu com proibição explícita.
5. **Mudar o papel para mudar a classe de achado.** Como QA, a LLM só
   enumerou os `throw` existentes; como "engenheiro de caos", achou os
   defeitos de concorrência.

Não funcionou: pedir mais casos (variação trivial), "seja criativo" (cenários
irrelevantes) e pedir o código já na primeira passada — o erro de concepção
fica escondido no TypeScript. **Tabela primeiro, código depois.**

## A lição

A LLM propôs um cenário de concorrência que eu não tinha considerado e
escreveu a asserção **errada** para ele. **E o teste passou**, porque o
harness, também gerado com apoio dela, compartilhava a mesma concepção
equivocada do sistema — internamente consistente, externamente errada. Só a
comparação contra o código de produção pegou, e rendeu um defeito que nenhum
prompt havia achado.

O padrão: a LLM acerta a **estrutura** (quais fronteiras importam) e erra os
**fatos verificáveis** (gerou códigos de erro do zod 3 num projeto com zod 4;
afirmou que o código tratava casos que não trata), com a mesma confiança nos
dois. Fui conferir o lado servidor da Cloud Function, que o prompt não cobria,
e vi que ele já valida a resposta do LLM — o cenário mais dramático que a IA
me deu não acontece. Escopo estreito de prompt gera conclusão estreita.

Funciona como copiloto, e o ganho está em **ampliar o espaço de casos
considerados**, não em digitar mais rápido. Mas o copiloto sugere a rota e o
piloto confere os instrumentos: quatro dos 27 casos continham afirmações
falsas, e uma estava passando na suíte.

Curioso para saber como foi com vocês o prompt adversarial — aqui foi de longe
o mais produtivo.

Abraço!
