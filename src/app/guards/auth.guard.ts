import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getDriveTokenFromCache } from '../domain/musix-studio/shared/drive-token';

/**
 * Guard que exige login (token do Google Drive em cache).
 * Redireciona para /login com returnUrl quando não autenticado.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const token = getDriveTokenFromCache();
  if (token) return true;
  const returnUrl = state.url || '/';
  return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
};
