import { Injectable, signal } from '@angular/core';

const DRIVE_WRITE_ROLES = new Set(['owner', 'organizer', 'fileOrganizer', 'writer']);

/**
 * Armazena se o usuário logado tem permissão de escrita na pasta do Kit Ensaio no Drive.
 * Definido pela página Kit Ensaio ou ao restaurar a Recording pela URL (F5).
 * Usado pelo menu (ocultar "Editor de Sincronia") e pelos botões Criar/Editar Sync Map.
 */
@Injectable({ providedIn: 'root' })
export class KitEnsaioPermissionService {
  /** true = pode salvar/editar; false = só leitor; null = ainda não verificou (ex.: não está no Kit Ensaio conectado). */
  readonly canWriteToKitEnsaio = signal<boolean | null>(null);

  setCanWrite(value: boolean): void {
    this.canWriteToKitEnsaio.set(value);
  }

  /**
   * Verifica permissão de escrita na pasta do Drive (about + permissions) e atualiza o signal.
   * Retorna uma Promise para permitir que guards/resolvers aguardem antes de ativar a rota.
   */
  checkWritePermission(accessToken: string, folderId: string): Promise<void> {
    const headers = { Authorization: `Bearer ${accessToken}` };
    return fetch('https://www.googleapis.com/drive/v3/about?fields=user', { headers })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`about ${res.status}`))))
      .then((about: { user?: { emailAddress?: string } }) => {
        const email = (about.user?.emailAddress ?? '').trim().toLowerCase();
        if (!email) {
          this.setCanWrite(false);
          return;
        }
        return fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}?fields=permissions`,
          { headers }
        )
          .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`permissions ${res.status}`))))
          .then((file: { permissions?: { type: string; role: string; emailAddress?: string }[] }) => {
            const perms = file.permissions ?? [];
            const canWrite = perms.some(
              (p) =>
                p.type === 'user' &&
                (p.emailAddress ?? '').toLowerCase() === email &&
                DRIVE_WRITE_ROLES.has((p.role ?? '').toLowerCase())
            );
            this.setCanWrite(canWrite);
          });
      })
      .catch(() => {
        this.setCanWrite(false);
      });
  }
}
