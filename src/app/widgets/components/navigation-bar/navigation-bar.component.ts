import { Component, EventEmitter, Output, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MENUS } from 'src/app/shared/constants/menus';
import { Menu } from 'src/app/shared/models/interfaces/menu';
import { MatSharedModule } from 'src/app/shared/modules/mat-shared.module';

@Component({
  selector: 'app-navigation-bar',
  templateUrl: './navigation-bar.component.html',
  styleUrls: ['./navigation-bar.component.scss'],
  standalone: true,
  imports: [MatSharedModule, RouterModule],
})
export class NavigationBarComponent {
  protected readonly menus = signal(MENUS);
  @Output() menuChange = new EventEmitter<Menu>();
}
