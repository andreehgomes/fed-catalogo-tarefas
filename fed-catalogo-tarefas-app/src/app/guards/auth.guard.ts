import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

/**
 * Bloqueia rotas privadas até que haja um usuário autenticado. Espera o
 * primeiro emit do `authState` para evitar redirecionar prematuramente
 * durante o boot (quando o AngularFire ainda está restaurando a sessão).
 *
 * Quando não há usuário, redireciona para `/login` e preserva a rota
 * original como query param `redirect`, para a tela de login devolver o
 * usuário ao destino original após o sucesso.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const user = await firstValueFrom(authState(auth));
  if (user) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { redirect: state.url },
  });
};
