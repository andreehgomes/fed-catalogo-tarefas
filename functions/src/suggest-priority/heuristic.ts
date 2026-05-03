import { Priority, SuggestPriorityInput } from './schema';

/**
 * Fallback heurístico determinístico — usado quando a chave do Claude
 * não está configurada, quando a chamada falha, ou nos testes unitários
 * que não querem depender de rede.
 *
 * Não pretende substituir o Claude: classifica com palavras-chave em
 * pt-BR. Determinístico por design — mesmo input sempre dá o mesmo
 * output, o que torna os testes confiáveis e a UX previsível.
 *
 * Lógica de prioridade (do mais alto pro mais baixo):
 *   1. Contém palavras de URGÊNCIA          → urgent
 *   2. Contém palavras de PRAZO PRÓXIMO      → high
 *   3. Frase muito curta sem palavras-chave  → low
 *   4. Caso geral                            → medium
 */

const URGENT_KEYWORDS = [
  'urgente',
  'urgência',
  'asap',
  'agora',
  'hoje',
  'imediatamente',
  'vencendo',
  'vence hoje',
  'expirando',
  'crítico',
  'critico',
  'emergência',
  'emergencia',
];

const HIGH_KEYWORDS = [
  'amanhã',
  'amanha',
  'importante',
  'prazo',
  'reunião',
  'reuniao',
  'entrega',
  'cliente',
  'deadline',
  'prioridade',
  'compromisso',
  'apresentação',
  'apresentacao',
];

const LOW_KEYWORDS = [
  'quando puder',
  'eventualmente',
  'algum dia',
  'ideia',
  'estudar',
  'ler',
  'pesquisar',
  'opcional',
];

const SHORT_TEXT_THRESHOLD = 20;

function containsAny(haystack: string, needles: readonly string[]): boolean {
  return needles.some((kw) => haystack.includes(kw));
}

export function suggestPriorityHeuristic(input: SuggestPriorityInput): Priority {
  const text = `${input.title} ${input.description}`.toLowerCase();

  if (containsAny(text, URGENT_KEYWORDS)) return 'urgent';
  if (containsAny(text, HIGH_KEYWORDS)) return 'high';
  if (containsAny(text, LOW_KEYWORDS)) return 'low';
  if (text.trim().length <= SHORT_TEXT_THRESHOLD) return 'low';

  return 'medium';
}
