import { FlipCardComponent } from 'src/app/domain/music-academy/components/flip-card/flip-card.component';
import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';

import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import { Question, QUESTIONS } from './questions.constant';

@Component({
  templateUrl: './quizz.page.html',
  styleUrls: ['./quizz.page.scss'],
  standalone: true,
  imports: [ZardSharedModule, FlipCardComponent, CommonModule],
})
export class QuizzPage {
  questions = QUESTIONS;
  randomizedQuestions = signal(this.shuffleQuestions(this.questions));
  currentQuestionIndex = signal(0);
  correctAnswers = signal(0);
  isFlipped = false;

  /** Tab ativa: 'estudar' | 'praticar' */
  activeTab = signal<'estudar' | 'praticar'>('praticar');

  isQuizOver = computed(() => this.currentQuestionIndex() >= this.randomizedQuestions().length);

  progress = computed(() => {
    const total = this.randomizedQuestions().length;
    const current = Math.min(this.currentQuestionIndex() + 1, total); // Evita passar do total
    return `${current}/${total}`;
  });

  shuffleQuestions(questions: Question[]) {
    return [...questions].sort(() => Math.random() - 0.5);
  }

  nextQuestion(correct: boolean) {
    if (!this.isQuizOver()) {
      // Apenas avança se o quiz não terminou
      this.isFlipped = false;
      if (correct) this.correctAnswers.update((count) => count + 1);
      this.currentQuestionIndex.update((index) => index + 1);
    }
  }

  resetQuiz() {
    this.randomizedQuestions.set(this.shuffleQuestions(this.questions));
    this.currentQuestionIndex.set(0);
    this.correctAnswers.set(0);
  }
}
