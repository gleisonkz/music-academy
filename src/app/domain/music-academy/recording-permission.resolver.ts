import { getDriveTokenFromCache } from './shared/drive-token';
import { KitEnsaioPermissionService } from 'src/app/shared/services/kit-ensaio-permission.service';

import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

import { KIT_ENSAIO_FOLDER_ID } from './pages/kit-ensaio/kit-ensaio.page';

/**
 * Resolver da rota de gravação: quando a URL tem audioId e folderIds (restore após F5),
 * executa a checagem de permissão do Kit Ensaio antes de ativar a rota, para o botão
 * "Editar sync map" já aparecer na primeira renderização.
 */
export const recordingPermissionResolver: ResolveFn<void> = (route) => {
  const permissionService = inject(KitEnsaioPermissionService);
  const audioId = route.queryParamMap.get('audioId');
  const folderIds = route.queryParamMap.get('folderIds');
  const token = getDriveTokenFromCache();
  if (token && audioId && folderIds) {
    return permissionService.checkWritePermission(token, KIT_ENSAIO_FOLDER_ID);
  }
  return Promise.resolve();
};
