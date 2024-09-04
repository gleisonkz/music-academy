import { interval, Subject, takeUntil } from 'rxjs';
import { MatSharedModule } from 'src/app/shared/modules/mat-shared.module';
import { RemainingTimePipe } from 'src/app/widgets/pipes/remaining-time/remaining-time.pipe';

import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  templateUrl: './metronome.page.html',
  styleUrls: ['./metronome.page.scss'],
  standalone: true,
  imports: [MatSharedModule, CommonModule, RemainingTimePipe, FormsModule, ReactiveFormsModule],
})
export class MetronomePage {
  bpm = signal(120);
  timeSignature = signal(4);
  timerDuration = signal(3);
  isPlaying = signal(false);
  accentEnabled = new FormControl(true);
  soundEnabled = new FormControl(true);
  endingSoundEnabled = new FormControl(true);
  timeSignatures = [2, 3, 4, 5, 6, 7, 8];
  currentBeat = signal(0);
  remainingTime = signal(0);
  clickAudio = new Audio('assets/audio/metronome/classic/click.m4a');
  accentAudio = new Audio('assets/audio/metronome/classic/accent.m4a');

  private destroy$ = new Subject<void>();
  private audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  private accentBuffer: AudioBuffer | null = null;
  private clickBuffer: AudioBuffer | null = null;

  ngOnInit() {
    this.loadSounds();
  }

  ngOnDestroy() {
    this.isPlaying.set(false);
    this.destroySubjects();
  }

  async loadSounds() {
    const clickResponse = await fetch('assets/audio/metronome/classic/click.m4a');
    const clickArrayBuffer = await clickResponse.arrayBuffer();
    this.clickBuffer = await this.audioContext.decodeAudioData(clickArrayBuffer);

    const accentResponse = await fetch('assets/audio/metronome/classic/accent.m4a');
    const arrayBuffer = await accentResponse.arrayBuffer();
    this.accentBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  startMetronome() {
    if (this.isPlaying()) return;

    this.isPlaying.set(true);
    // Converte a duração do temporizador de minutos para segundos
    this.remainingTime.set(this.timerDuration() * 60);
    this.currentBeat.set(0);
    const intervalTime = 60000 / this.bpm(); // Tempo entre batidas em milissegundos

    // Observable para o metrônomo
    interval(intervalTime)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentBeat.set((this.currentBeat() % this.timeSignature()) + 1);
        this.playClickSound();

        if (this.currentBeat() === 1 && this.accentEnabled.value) {
          this.playAccentSound();
        }
      });

    // Observable para o timer
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.remainingTime.update((time) => time - 1);

        if (this.remainingTime() <= 0) {
          this.stopMetronome();
        }
      });
  }

  stopMetronome() {
    this.playEndingSound();
    this.isPlaying.set(false);
    this.destroySubjects();
  }

  stopManualMetronome() {
    this.isPlaying.set(false);
    this.destroySubjects();
  }

  destroySubjects() {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$ = new Subject<void>();
  }

  playClickSound() {
    if (!this.clickBuffer || !this.soundEnabled.value) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = this.clickBuffer;
    source.connect(this.audioContext.destination);
    source.start(0);
  }

  playAccentSound() {
    if (!this.accentBuffer || !this.soundEnabled.value) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = this.accentBuffer;
    source.connect(this.audioContext.destination);
    source.start(0);
  }

  playEndingSound() {
    if (!this.endingSoundEnabled.value) return;
    const endingSound = new Audio('assets/audio/ending.mp3');
    endingSound.play();
  }

  setTimeDuration(event: Event) {
    const target = event.target as HTMLInputElement;
    this.timerDuration.set(+target.value);
  }

  setBpm(event: Event) {
    const target = event.target as HTMLInputElement;
    this.bpm.set(+target.value);
  }

  setTimeSignature(event: Event) {
    const target = event.target as HTMLInputElement;
    this.timeSignature.set(+target.value);
  }
}
