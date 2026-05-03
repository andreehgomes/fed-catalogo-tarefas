import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';

import { suggestPriority } from './suggest-priority';
import { SuggestPriorityInputSchema } from './suggest-priority/schema';

/**
 * Segredo gerenciado pelo Google Secret Manager.
 *
 * Configuração local (uma vez por máquina):
 *   firebase functions:secrets:set ANTHROPIC_API_KEY
 *
 * Quando o segredo NÃO está setado em produção, a função detecta a
 * ausência via `process.env` e cai automaticamente no fallback
 * heurístico — sem quebrar o fluxo do usuário.
 */
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

/**
 * Cloud Function callable: o cliente Angular invoca via
 * `httpsCallable(functions, 'suggestPriority')`. Exige usuário
 * autenticado (Firebase Auth) — sem isso, qualquer um podia bombardear
 * a função e queimar a cota da Anthropic.
 */
export const suggestpriority = onCall(
  {
    region: 'us-central1',
    cors: true,
    secrets: [ANTHROPIC_API_KEY],
    // App Check vai ser ligado em release subsequente; por ora deixamos
    // a callable aceitar requisições sem App Check para o smoke test
    // funcionar antes do enforcement.
    enforceAppCheck: false,
    maxInstances: 10,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'É necessário estar autenticado para sugerir prioridade.',
      );
    }

    const parsed = SuggestPriorityInputSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError(
        'invalid-argument',
        `Entrada inválida: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      );
    }

    const apiKey = ANTHROPIC_API_KEY.value() || null;
    const result = await suggestPriority(parsed.data, {
      anthropicApiKey: apiKey,
    });

    logger.info('suggestpriority', {
      uid: request.auth.uid,
      titleLen: parsed.data.title.length,
      source: result.source,
      priority: result.priority,
    });

    return result;
  },
);
