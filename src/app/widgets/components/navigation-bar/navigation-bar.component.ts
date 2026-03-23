import { MENUS } from 'src/app/shared/constants/menus';
import { Menu } from 'src/app/shared/models/interfaces/menu';
import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';
import { KitEnsaioPermissionService } from 'src/app/shared/services/kit-ensaio-permission.service';
import { clearDriveTokenCache } from 'src/app/domain/musix-studio/shared/drive-token';
import { LOUVE_ALLOWED_EMAIL } from 'src/app/guards/louve-parser.guard';
import { DriveUserEmailService } from 'src/app/shared/services/drive-user-email.service';

import { Component, EventEmitter, inject, Output, computed, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

const SYNC_EDITOR_LINK = '/sync-editor';
const RECORDING_LINK = '/recording';
const LOUVE_PARSER_LINK = '/louve-screenshot-parser';
const LOGOUT_LINK = '__logout__';

@Component({
  selector: 'app-navigation-bar',
  templateUrl: './navigation-bar.component.html',
  styleUrls: ['./navigation-bar.component.scss'],
  standalone: true,
  imports: [ZardSharedModule, RouterModule],
})
export class NavigationBarComponent implements OnInit {
  private readonly permissionService = inject(KitEnsaioPermissionService);
  private readonly router = inject(Router);
  private readonly driveUserEmailService = inject(DriveUserEmailService);

  /** Lista de menus; "Editor de Sincronia" só aparece se o usuário tiver permissão de escrita na pasta do Kit Ensaio. */
  protected readonly menus = computed(() => {
    const canWrite = this.permissionService.canWriteToKitEnsaio();
    const isOwner = (this.driveUserEmailService.email() ?? '').toLowerCase() === LOUVE_ALLOWED_EMAIL;
    return MENUS.filter((m) => {
      if (m.link === SYNC_EDITOR_LINK && canWrite !== true) return false;
      if (m.link === LOUVE_PARSER_LINK && !isOwner) return false;
      return true;
    });
  });

  ngOnInit(): void {
    void this.driveUserEmailService.ensureLoaded(true);
  }

  @Output() menuChange = new EventEmitter<Menu>();

  /** Fecha o drawer em modo overlay (mesmo comportamento dos itens do menu). */
  protected onLogoClick(): void {
    const first = this.menus()[0];
    if (first) this.menuChange.emit(first);
  }

  /** Ao clicar em "Gravação" já estando na página de gravação, força reset (estado inicial com dropzone). */
  protected onMenuClick(event: MouseEvent, menu: Menu): void {
    if (menu.link === LOGOUT_LINK) {
      event.preventDefault();
      clearDriveTokenCache();
      this.driveUserEmailService.clearCached();
      this.router.navigate(['/']);
      return;
    }
    if (menu.link === RECORDING_LINK && this.router.url.includes('recording')) {
      event.preventDefault();
      this.router.navigate([RECORDING_LINK], { queryParams: { reset: '1' } });
    }
    this.menuChange.emit(menu);
  }
}
