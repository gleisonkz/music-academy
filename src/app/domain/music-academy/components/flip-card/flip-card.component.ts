import { CommonModule } from '@angular/common';
import { Component, Input, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'ma-flip-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './flip-card.component.html',
  styleUrl: './flip-card.component.scss',
})
export class FlipCardComponent {
  question = input('');
  answer = input('');
  @Input() isFlipped = false;

  flipCard() {
    this.isFlipped = !this.isFlipped;
  }
}
