import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatSharedModule } from 'src/app/shared/modules/mat-shared.module';

@Component({
  selector: 'app-simple-step',
  templateUrl: './simple-step.component.html',
  styleUrls: ['./simple-step.component.scss'],
  standalone: true,
  imports: [CommonModule, MatSharedModule],
})
export class SimpleStepComponent {
  @Input() countSteps = 10;
  @Input() currentStep = 0;
  protected readonly steps = Array.from(
    { length: this.countSteps },
    (_, i) => i + 1
  );
}
