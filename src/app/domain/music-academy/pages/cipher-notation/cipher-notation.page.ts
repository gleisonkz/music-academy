import { MatSharedModule } from 'src/app/shared/modules/mat-shared.module';

import { NgFor } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  templateUrl: './cipher-notation.page.html',
  styleUrls: ['./cipher-notation.page.scss'],
  standalone: true,
  imports: [FormsModule, NgFor, MatSharedModule],
})
export class CipherNotationPage {
  private chords = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  private notes = ['Dó', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Sí'];

  steps = signal(10);
  currentStep = signal(1);
  currentChord = signal(this.getRandomChord());
  options = signal<string[]>(this.generateOptions());
  feedback = signal('');
  canGuess = signal(true);
  isGameOver = signal(false);
  correctAnswers = signal(0);
  totalTime = signal(0);
  averageTime = signal(0);

  private getRandomChord(): string {
    const randomIndex = Math.floor(Math.random() * this.chords.length);
    return this.chords[randomIndex];
  }

  private generateOptions(): string[] {
    const correctNote = this.notes[this.chords.indexOf(this.currentChord())];
    const randomNotes = this.notes
      .filter((note) => note !== correctNote)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
    return [...randomNotes, correctNote].sort(() => 0.5 - Math.random());
  }

  selectOption(selectedOption: string) {
    const correctNote = this.notes[this.chords.indexOf(this.currentChord())];

    if (selectedOption === correctNote) {
      this.correctAnswers.set(this.correctAnswers() + 1);
      this.feedback.set('Correto! Parabéns!');
    } else {
      this.feedback.set(`Errado! A resposta correta é ${correctNote}`);
    }

    this.canGuess.set(false);
  }

  resetNote() {
    this.currentChord.set(this.getRandomChord());
    this.options.set(this.generateOptions());
    this.feedback.set('');
    this.canGuess.set(true);
  }

  nextStep() {
    this.currentStep.set(this.currentStep() + 1);
    this.resetNote();
  }

  endGame() {
    this.isGameOver.set(true);
  }

  restart() {
    this.currentStep.set(1);
    this.correctAnswers.set(0);
    this.totalTime.set(0);
    this.averageTime.set(0);
    this.isGameOver.set(false);
    this.resetNote();
  }
}
