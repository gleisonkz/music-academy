import { Injectable, signal } from '@angular/core';

/**
 * Quando a Recording navega para o Sync Editor, os blob URLs (áudio, mapa, sync) são passados
 * no state. Se a Recording revogar esses URLs no ngOnDestroy, o Sync Editor recebe URLs
 * inválidas (ERR_FILE_NOT_FOUND). Este serviço sinaliza que estamos indo para o Sync Editor
 * para a Recording não revogar esses blobs ao ser destruída.
 */
@Injectable({ providedIn: 'root' })
export class RecordingSyncEditorNavService {
  /** true enquanto navegamos para o Sync Editor com state (não revogar blobs na Recording). */
  readonly skipRevokeBlobUrls = signal(false);
}
