import { MENUS } from 'src/app/shared/constants/menus';
import { Menu } from 'src/app/shared/models/interfaces/menu';
import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';

import { Component, EventEmitter, Output, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navigation-bar',
  templateUrl: './navigation-bar.component.html',
  styleUrls: ['./navigation-bar.component.scss'],
  standalone: true,
  imports: [ZardSharedModule, RouterModule],
})
export class NavigationBarComponent {
  protected readonly menus = signal(MENUS);
  @Output() menuChange = new EventEmitter<Menu>();
}
