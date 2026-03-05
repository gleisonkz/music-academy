import { FlipCardComponent } from 'src/app/domain/music-academy/components/flip-card/flip-card.component';
import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';

import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import { Question, QUESTIONS, QUIZ_TAGS } from './questions.constant';

@Component({
  templateUrl: './quizz.page.html',
  styleUrls: ['./quizz.page.scss'],
  standalone: true,
  imports: [ZardSharedModule, FlipCardComponent, CommonModule],
})
export class QuizzPage {
  readonly questions = QUESTIONS;
  readonly availableTags = QUIZ_TAGS;

  /** Tags selecionadas para filtrar (vazio = todas as perguntas). */
  readonly selectedTags = signal<Set<string>>(new Set());

  readonly filteredQuestions = computed(() => {
    const sel = this.selectedTags();
    if (sel.size === 0) return this.questions;
    return this.questions.filter((q) => (q.tags ?? []).some((t) => sel.has(t)));
  });

  randomizedQuestions = signal<Question[]>([]);
  currentQuestionIndex = signal(0);
  correctAnswers = signal(0);
  isFlipped = false;

  /** Tab ativa: 'estudar' | 'praticar' */
  activeTab = signal<'estudar' | 'praticar'>('estudar');

  isQuizOver = computed(() => this.currentQuestionIndex() >= this.randomizedQuestions().length);

  progress = computed(() => {
    const total = this.randomizedQuestions().length;
    const current = Math.min(this.currentQuestionIndex() + 1, total);
    return `${current}/${total}`;
  });

  constructor() {
    this.applyFilterAndReset();
  }

  toggleTag(tag: string) {
    this.selectedTags.update((s) => {
      const next = new Set(s);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
    this.applyFilterAndReset();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags().has(tag);
  }

  private applyFilterAndReset() {
    const filtered = this.filteredQuestions();
    this.randomizedQuestions.set(this.shuffleQuestions(filtered));
    this.currentQuestionIndex.set(0);
    this.correctAnswers.set(0);
  }

  shuffleQuestions(questions: Question[]) {
    return [...questions].sort(() => Math.random() - 0.5);
  }

  nextQuestion(correct: boolean) {
    if (!this.isQuizOver()) {
      this.isFlipped = false;
      if (correct) this.correctAnswers.update((count) => count + 1);
      this.currentQuestionIndex.update((index) => index + 1);
    }
  }

  resetQuiz() {
    this.applyFilterAndReset();
  }
}
