import { NgModule } from '@angular/core';

import { ZardButtonComponent } from '../../ui/components/button/button.component';
import { ZardCardComponent } from '../../ui/components/card/card.component';
import { ZardCheckboxComponent } from '../../ui/components/checkbox/checkbox.component';
import { ZardInputDirective } from '../../ui/components/input/input.directive';
import { ZardSelectItemComponent } from '../../ui/components/select/select-item.component';
import { ZardSelectComponent } from '../../ui/components/select/select.component';
import { ZardSwitchComponent } from '../../ui/components/switch/switch.component';
import { ZardTabComponent, ZardTabGroupComponent } from '../../ui/components/tabs/tabs.component';

@NgModule({
  imports: [
    ZardButtonComponent,
    ZardCardComponent,
    ZardCheckboxComponent,
    ZardInputDirective,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardSwitchComponent,
    ZardTabComponent,
    ZardTabGroupComponent,
  ],
  exports: [
    ZardButtonComponent,
    ZardCardComponent,
    ZardCheckboxComponent,
    ZardInputDirective,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardSwitchComponent,
    ZardTabComponent,
    ZardTabGroupComponent,
  ],
})
export class ZardSharedModule {}
