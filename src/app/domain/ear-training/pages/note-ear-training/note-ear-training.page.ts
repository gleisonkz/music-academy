import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { BASS_NOTES } from 'src/app/domain/ear-training/pages/note-ear-training/constants/bass-notes.constant';

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  templateUrl: './note-ear-training.page.html',
  styleUrls: ['./note-ear-training.page.scss'],
  standalone: true,
  imports: [
    NzSwitchModule,
    FormsModule,
    NzButtonModule,
    CommonModule,
    NzStepsModule,
    NzButtonModule,
    NzStatisticModule,
    NzSelectModule,
  ],
})
export class NoteEarTrainingPage {
  hasTrainingStarted = false;
  hasTimer = false;
  hasReplay = false;
  currentStep = 0;
  timer = new Date().getTime() + 30000;
  currentIntervalId: any;
  INTERVAL_STEP = 5000;
  instrument: string;

  filteredBassNotes = this.getNotes();
  currentAudio = new Audio(this.filteredBassNotes[0].src);

  getNotes(quantity: number = 10) {
    return [...BASS_NOTES].sort(() => Math.random() - 0.5).slice(0, quantity);
  }

  resetNotes() {
    this.filteredBassNotes = this.getNotes();
    this.currentAudio = new Audio(this.filteredBassNotes[0].src);
  }

  stopAudio() {
    const isPlaying = !this.currentAudio.paused;
    const isNotEnded = !this.currentAudio.ended;

    if (isPlaying && isNotEnded) {
      this.currentAudio.pause();
    }
  }

  previousStep(): void {
    this.stopAudio();
    this.clearInterval();
    this.currentStep -= 1;
    this.currentAudio = new Audio(this.filteredBassNotes[this.currentStep].src);
    this.playCurrentAudio();
    this.restartCountdown();
  }

  nextStep(): void {
    this.stopAudio();
    this.clearInterval();
    this.currentStep += 1;
    this.currentAudio = new Audio(this.filteredBassNotes[this.currentStep].src);
    this.playCurrentAudio();
    this.restartCountdown();
  }

  clearInterval() {
    if (this.currentIntervalId) {
      clearInterval(this.currentIntervalId);
    }
  }

  restartCountdown() {
    if (!this.hasTimer) return;
    this.timer = new Date().getTime() + 30000;
  }

  playCurrentAudio() {
    this.currentAudio.play();
    if (this.hasReplay) {
      this.currentIntervalId = setInterval(() => {
        this.currentAudio.play();
      }, this.INTERVAL_STEP);
    }
  }

  onCountdownFinish() {
    this.clearInterval();
  }

  trackById(_: number, item: any): number {
    return item.id;
  }

  done() {
    this.hasTrainingStarted = false;
    this.hasTimer = false;
    this.hasReplay = false;
    this.currentStep = 0;
    this.currentIntervalId = null;
    this.resetNotes();
  }

  startTraining() {
    this.hasTrainingStarted = true;
    this.restartCountdown();
    this.playCurrentAudio();
  }
}
