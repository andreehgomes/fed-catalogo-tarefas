/**
 * Lançado pelo `TaskService` quando o usuário corrente tenta agir sobre
 * uma tarefa que pertence a outro `userId`.
 *
 * Em condições normais, as Firestore Security Rules já recusariam a
 * operação no servidor — mas validar no cliente também é defesa em
 * profundidade: evita um round-trip e permite mensagens de UI claras
 * caso algo escape (ex.: rules ainda não publicadas).
 */
export class UnauthorizedTaskAccessError extends Error {
  constructor(public readonly taskId: string) {
    super(
      `Operação não autorizada na tarefa "${taskId}": ela pertence a outro usuário.`,
    );
    this.name = 'UnauthorizedTaskAccessError';
  }
}
