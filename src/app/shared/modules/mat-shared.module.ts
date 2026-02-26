import { NgModule } from '@angular/core';

import { ZardButtonComponent } from '../../ui/components/button/button.component';
import { ZardCardComponent } from '../../ui/components/card/card.component';
import { ZardCheckboxComponent } from '../../ui/components/checkbox/checkbox.component';
import { ZardInputDirective } from '../../ui/components/input/input.directive';
import { ZardSelectComponent } from '../../ui/components/select/select.component';
import { ZardSwitchComponent } from '../../ui/components/switch/switch.component';
import { ZardTabGroupComponent } from '../../ui/components/tabs/tabs.component';

@NgModule({
  imports: [
    ZardButtonComponent,
    ZardCardComponent,
    ZardCheckboxComponent,
    ZardInputDirective,
    ZardSelectComponent,
    ZardSwitchComponent,
    ZardTabGroupComponent,
  ],
  exports: [
    ZardButtonComponent,
    ZardCardComponent,
    ZardCheckboxComponent,
    ZardInputDirective,
    ZardSelectComponent,
    ZardSwitchComponent,
    ZardTabGroupComponent,
  ],
})
export class ZardSharedModule {}
