import Anthropic from '@anthropic-ai/sdk';

import { PRIORITIES, Priority, SuggestPriorityInput } from './schema';

/**
 * Adapter para o Claude (Anthropic). Usa `tool_use` em vez de prompt
 * solto para forçar o modelo a devolver UM dos quatro valores possíveis
 * de prioridade — sem prosa, sem aspas, sem markdown.
 *
 * Modelo padrão: `claude-haiku-4-5-20251001`. Pesquisamos o trade-off
 * em DEC-005: haiku resolve essa classificação curta com qualidade
 * suficiente e custo ~3x menor que sonnet.
 */

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `Você é um assistente que classifica a prioridade de tarefas pessoais.
Receba título e descrição em pt-BR e devolva APENAS um destes níveis:

- urgent: prazo no mesmo dia, palavras como "hoje", "agora", "vencendo", emergências
- high: prazo próximo (1-3 dias), reuniões, compromissos com terceiros, entregas com cliente
- medium: tarefas sem urgência específica, recorrentes, atividades do dia a dia
- low: ideias, leituras, estudo, "quando puder", baixo impacto

Devolva sempre via a ferramenta classify_priority.`;

const CLASSIFY_TOOL: Anthropic.Tool = {
  name: 'classify_priority',
  description: 'Classifica a prioridade da tarefa em um dos quatro níveis disponíveis.',
  input_schema: {
    type: 'object',
    properties: {
      priority: {
        type: 'string',
        enum: [...PRIORITIES],
        description: 'O nível de prioridade escolhido para a tarefa.',
      },
    },
    required: ['priority'],
  },
};

export interface ClaudeAdapterOptions {
  apiKey: string;
  model?: string;
}

export async function suggestPriorityWithClaude(
  input: SuggestPriorityInput,
  options: ClaudeAdapterOptions,
): Promise<Priority> {
  const client = new Anthropic({ apiKey: options.apiKey });

  const userMessage = [
    `Título: ${input.title}`,
    input.description ? `Descrição: ${input.description}` : 'Descrição: (vazia)',
  ].join('\n');

  const response = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: 64,
    system: SYSTEM_PROMPT,
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: 'tool', name: 'classify_priority' },
    messages: [{ role: 'user', content: userMessage }],
  });

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'classify_priority') {
      const raw = (block.input as { priority?: unknown }).priority;
      if (typeof raw === 'string' && (PRIORITIES as readonly string[]).includes(raw)) {
        return raw as Priority;
      }
    }
  }

  throw new Error('Claude não retornou uma prioridade válida via tool_use.');
}
