import { z } from 'zod';

/**
 * Contrato de entrada e saída da Cloud Function `suggestPriority`.
 *
 * NOTE: este schema é deliberadamente DUPLICADO entre `functions/` e o
 * cliente Angular (`src/app/services/priority-suggestion.service.ts`).
 * Não é a duplicação proibida pela Unidade 3.2 (caso PriorityAdvisor) —
 * essa proibida era de LÓGICA. Aqui é um CONTRATO de fronteira de
 * processo: o servidor e o cliente são deploys diferentes, em runtimes
 * diferentes, e podem evoluir as versões de zod independentemente. O
 * preço é manter os dois schemas em sincronia manualmente; o ganho é
 * não acoplar deps do cliente Angular ao bundle das Cloud Functions.
 *
 * Veja DEC-005 em `docs/decisoes.md` para o registro dessa decisão.
 */

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const SuggestPriorityInputSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório').max(120),
  description: z.string().trim().max(2000).default(''),
});
export type SuggestPriorityInput = z.infer<typeof SuggestPriorityInputSchema>;

export const SuggestPriorityOutputSchema = z.object({
  priority: z.enum(PRIORITIES),
  source: z.enum(['claude', 'heuristic']),
});
export type SuggestPriorityOutput = z.infer<typeof SuggestPriorityOutputSchema>;
