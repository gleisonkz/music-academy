import { Injectable, signal } from '@angular/core';

/**
 * Armazena se o usuário logado tem permissão de escrita na pasta do Kit Ensaio no Drive.
 * Definido pela página Kit Ensaio após verificar via API (about + permissions).
 * Usado pelo menu (ocultar "Editor de Sincronia") e pelos botões Criar/Editar Sync Map.
 */
@Injectable({ providedIn: 'root' })
export class KitEnsaioPermissionService {
  /** true = pode salvar/editar; false = só leitor; null = ainda não verificou (ex.: não está no Kit Ensaio conectado). */
  readonly canWriteToKitEnsaio = signal<boolean | null>(null);

  setCanWrite(value: boolean): void {
    this.canWriteToKitEnsaio.set(value);
  }
}
