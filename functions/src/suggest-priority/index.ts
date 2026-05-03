import * as logger from 'firebase-functions/logger';

import { suggestPriorityWithClaude } from './claude-adapter';
import { suggestPriorityHeuristic } from './heuristic';
import {
  SuggestPriorityInput,
  SuggestPriorityOutput,
} from './schema';

/**
 * Decisão UMA-ÚNICA-VEZ entre IA e heurística — lição direta da
 * Unidade 3.2 (caso PriorityAdvisor). A interface pública
 * `suggestPriority` é a fronteira; quem chama não precisa saber se
 * por baixo foi Claude ou heurística, e a duplicação de lógica entre
 * "decidir prioridade" não acontece.
 *
 * Quando há erro na chamada do Claude (rede, timeout, rate limit),
 * caímos no fallback heurístico em vez de propagar — a UX preferida é
 * "sugestão talvez pior, mas sempre disponível" do que "sugestão
 * impossível por causa de IA off". Logamos o erro para diagnóstico.
 */
export async function suggestPriority(
  input: SuggestPriorityInput,
  options: { anthropicApiKey: string | null },
): Promise<SuggestPriorityOutput> {
  if (!options.anthropicApiKey) {
    return {
      priority: suggestPriorityHeuristic(input),
      source: 'heuristic',
    };
  }

  try {
    const priority = await suggestPriorityWithClaude(input, {
      apiKey: options.anthropicApiKey,
    });
    return { priority, source: 'claude' };
  } catch (error) {
    logger.warn('Claude indisponível — caindo no fallback heurístico', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      priority: suggestPriorityHeuristic(input),
      source: 'heuristic',
    };
  }
}
