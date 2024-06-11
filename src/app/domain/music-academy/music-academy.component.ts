import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { Router, RouterModule } from '@angular/router';
import { BREAKPOINTS } from 'src/app/shared/constants/breakpoints';
import { DASHBOARD } from 'src/app/shared/constants/menus';
import { MatSharedModule } from 'src/app/shared/modules/mat-shared.module';
import { NavigationBarComponent } from 'src/app/widgets/components/navigation-bar/navigation-bar.component';

export const DRAWER_MODE_OVER = 'over';
export const DRAWER_MODE_SIDE = 'side';

@Component({
  templateUrl: './music-academy.component.html',
  styleUrls: ['./music-academy.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatSharedModule,
    NavigationBarComponent,
    RouterModule,
  ],
})
export class MusicAcademyComponent implements OnInit {
  @ViewChild(MatDrawer, { static: true }) drawer: MatDrawer;
  private readonly router = inject(Router);
  protected drawerMode = signal<'over' | 'side'>(DRAWER_MODE_SIDE);

  public ngOnInit(): void {
    this.onResize();
  }

  @HostListener('window:resize', ['$event'])
  protected onResize(event?: Event): void {
    const innerWidth =
      (event?.target as Window)?.innerWidth || window.innerWidth;

    const drawerMode =
      innerWidth < BREAKPOINTS.largeTablet
        ? DRAWER_MODE_OVER
        : DRAWER_MODE_SIDE;

    this.drawerMode.set(drawerMode);
    this.drawer.opened = drawerMode === DRAWER_MODE_SIDE;
  }

  protected navigateToDashboard(): void {
    this.router.navigate([DASHBOARD.link]);
  }

  protected menuChange(): void {
    if (this.drawerMode() === DRAWER_MODE_OVER) this.drawer.toggle();
  }
}
