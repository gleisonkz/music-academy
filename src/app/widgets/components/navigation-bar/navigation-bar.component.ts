import { MENUS } from 'src/app/shared/constants/menus';
import { Menu } from 'src/app/shared/models/interfaces/menu';
import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';
import { KitEnsaioPermissionService } from 'src/app/shared/services/kit-ensaio-permission.service';

import { Component, EventEmitter, inject, Output, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

const SYNC_EDITOR_LINK = '/music-academy/sync-editor';
const RECORDING_LINK = '/music-academy/recording';

@Component({
  selector: 'app-navigation-bar',
  templateUrl: './navigation-bar.component.html',
  styleUrls: ['./navigation-bar.component.scss'],
  standalone: true,
  imports: [ZardSharedModule, RouterModule],
})
export class NavigationBarComponent {
  private readonly permissionService = inject(KitEnsaioPermissionService);
  private readonly router = inject(Router);

  /** Lista de menus; "Editor de Sincronia" só aparece se o usuário tiver permissão de escrita na pasta do Kit Ensaio. */
  protected readonly menus = computed(() => {
    const canWrite = this.permissionService.canWriteToKitEnsaio();
    if (canWrite === true) return MENUS;
    return MENUS.filter((m) => m.link !== SYNC_EDITOR_LINK);
  });

  @Output() menuChange = new EventEmitter<Menu>();

  /** Ao clicar em "Gravação" já estando na página de gravação, força reset (estado inicial com dropzone). */
  protected onMenuClick(event: MouseEvent, menu: Menu): void {
    if (menu.link === RECORDING_LINK && this.router.url.includes('recording')) {
      event.preventDefault();
      this.router.navigate([RECORDING_LINK], { queryParams: { reset: '1' } });
    }
    this.menuChange.emit(menu);
  }
}
