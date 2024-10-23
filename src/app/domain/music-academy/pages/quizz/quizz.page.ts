import { FlipCardComponent } from 'src/app/domain/music-academy/components/flip-card/flip-card.component';

import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';

import { QUESTIONS } from './questions.constant';

@Component({
  templateUrl: './quizz.page.html',
  styleUrls: ['./quizz.page.scss'],
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatTabsModule, FlipCardComponent, CommonModule],
})
export class QuizzPage {
  questions = QUESTIONS;
  randomizedQuestions = signal(this.shuffleQuestions(this.questions)); // Perguntas randomizadas
  currentQuestionIndex = signal(0); // Índice atual da pergunta
  correctAnswers = signal(0); // Contador de respostas corretas

  // Verifica se o quiz terminou (quando o índice atual é igual ao total de perguntas)
  isQuizOver = computed(() => this.currentQuestionIndex() >= this.randomizedQuestions().length);

  // Retorna o progresso como "X/Y"
  progress = computed(() => {
    const total = this.randomizedQuestions().length;
    const current = Math.min(this.currentQuestionIndex() + 1, total); // Evita passar do total
    return `${current}/${total}`;
  });

  // Função para embaralhar as perguntas
  shuffleQuestions(questions: any[]) {
    return questions.sort(() => Math.random() - 0.5);
  }

  // Avança para a próxima pergunta, garantindo que o índice não ultrapasse o total
  nextQuestion(correct: boolean) {
    if (!this.isQuizOver()) {
      // Apenas avança se o quiz não terminou
      if (correct) this.correctAnswers.update((count) => count + 1);
      this.currentQuestionIndex.update((index) => index + 1);
    }
  }

  // Reinicia o quiz
  resetQuiz() {
    this.randomizedQuestions.set(this.shuffleQuestions(this.questions));
    this.currentQuestionIndex.set(0);
    this.correctAnswers.set(0);
  }
}
