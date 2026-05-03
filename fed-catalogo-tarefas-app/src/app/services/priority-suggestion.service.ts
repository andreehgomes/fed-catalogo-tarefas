import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

import { TaskPriority } from '../models/task';

interface SuggestPriorityInput {
  title: string;
  description: string;
}

interface SuggestPriorityOutput {
  priority: TaskPriority;
  source: 'claude' | 'heuristic';
}

const CALLABLE_NAME = 'suggestpriority';

/**
 * Cliente da Cloud Function `suggestpriority`. Tipos definidos
 * localmente para casar com o contrato do servidor — veja DEC-005
 * sobre por que o schema zod é deliberadamente duplicado entre
 * cliente e função.
 */
@Injectable({ providedIn: 'root' })
export class PrioritySuggestionService {
  private readonly functions = inject(Functions);

  async suggest(input: SuggestPriorityInput): Promise<SuggestPriorityOutput> {
    const callable = httpsCallable<SuggestPriorityInput, SuggestPriorityOutput>(
      this.functions,
      CALLABLE_NAME,
    );
    const result = await callable(input);
    return result.data;
  }
}
