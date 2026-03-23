import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getDriveTokenFromCache } from '../domain/musix-studio/shared/drive-token';
import { DriveUserEmailService } from '../shared/services/drive-user-email.service';

export const LOUVE_ALLOWED_EMAIL = 'gleisonsubzerokz@gmail.com';

/**
 * Guard para acesso exclusivo ao Louve Screenshot Parser.
 * Exige login + e-mail autorizado.
 */
export const louveParserGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);
  const driveUserEmailService = inject(DriveUserEmailService);
  const token = getDriveTokenFromCache();
  if (!token) {
    const returnUrl = state.url || '/';
    return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
  }

  const email = await driveUserEmailService.ensureLoaded(true);
  if ((email ?? '').toLowerCase() === LOUVE_ALLOWED_EMAIL) return true;
  return router.createUrlTree(['/']);
};
