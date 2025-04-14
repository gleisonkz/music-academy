import { CommonModule } from '@angular/common';
import { Component, input, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'ma-flip-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './flip-card.component.html',
  styleUrl: './flip-card.component.scss',
})
export class FlipCardComponent implements OnInit {
  question = input('');
  answer = input('');

  isFlipped = signal(false);

  flipCard() {
    this.isFlipped.update((isFlipped) => !isFlipped);
  }

  ngOnInit(): void {
    this.isFlipped.set(false);
  }
}
