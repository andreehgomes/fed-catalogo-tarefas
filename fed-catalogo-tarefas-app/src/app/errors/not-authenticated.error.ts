/**
 * Lançado quando o `TaskService` é chamado sem usuário autenticado.
 * Em fluxo normal o `authGuard` impede esse caso, mas serviços públicos
 * defensivamente verificam o usuário antes de tocar o Firestore.
 */
export class NotAuthenticatedError extends Error {
  constructor() {
    super('Operação requer usuário autenticado.');
    this.name = 'NotAuthenticatedError';
  }
}
