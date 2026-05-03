import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

/**
 * Bloqueia rotas públicas (`/login`) para usuários já autenticados,
 * redirecionando para a home. Evita o caso "já estou logado mas alguém
 * me mandou um link de login".
 */
export const publicOnlyGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  const user = await firstValueFrom(authState(auth));
  if (!user) {
    return true;
  }

  return router.createUrlTree(['/']);
};
