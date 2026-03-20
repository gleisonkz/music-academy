import { BREAKPOINTS } from 'src/app/shared/constants/breakpoints';
import { DASHBOARD } from 'src/app/shared/constants/menus';
import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';
import { NavigationBarComponent } from 'src/app/widgets/components/navigation-bar/navigation-bar.component';

import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

export const DRAWER_MODE_OVER = 'over';
export const DRAWER_MODE_SIDE = 'side';

@Component({
  templateUrl: './musix-studio.component.html',
  styleUrls: ['./musix-studio.component.scss'],
  standalone: true,
  imports: [CommonModule, ZardSharedModule, NavigationBarComponent, RouterModule],
})
export class MusixStudioComponent implements OnInit {
  @ViewChild('drawer', { static: true }) drawer: ElementRef<HTMLDivElement>;
  private readonly router = inject(Router);
  protected drawerMode = signal<'over' | 'side'>(DRAWER_MODE_SIDE);
  protected drawerOpened = signal(false);

  public ngOnInit(): void {
    this.onResize();
  }

  @HostListener('window:resize', ['$event'])
  protected onResize(event?: Event): void {
    const innerWidth = (event?.target as Window)?.innerWidth || window.innerWidth;

    const drawerMode = innerWidth < BREAKPOINTS.largeTablet ? DRAWER_MODE_OVER : DRAWER_MODE_SIDE;

    this.drawerMode.set(drawerMode);
    this.drawerOpened.set(drawerMode === DRAWER_MODE_SIDE);
  }

  protected navigateToDashboard(): void {
    this.router.navigate([DASHBOARD.link]);
  }

  protected menuChange(): void {
    if (this.drawerMode() === DRAWER_MODE_OVER) {
      this.drawerOpened.update((opened) => !opened);
    }
  }

  protected toggleDrawer(): void {
    this.drawerOpened.update((opened) => !opened);
  }
}
