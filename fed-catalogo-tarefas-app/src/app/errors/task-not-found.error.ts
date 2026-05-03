/**
 * Lançado pelo `TaskService` quando uma operação tenta agir sobre um
 * documento de tarefa que não existe no Firestore.
 *
 * A UI deve capturar essa classe especificamente para exibir mensagens de
 * "tarefa removida" sem confundir com falhas genéricas de rede.
 */
export class TaskNotFoundError extends Error {
  constructor(public readonly taskId: string) {
    super(`Tarefa com id "${taskId}" não foi encontrada.`);
    this.name = 'TaskNotFoundError';
  }
}
