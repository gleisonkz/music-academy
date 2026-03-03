import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';
import { RemainingTimePipe } from 'src/app/widgets/pipes/remaining-time/remaining-time.pipe';

import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

export type SubdivisionType = 'quarter' | 'eighth' | 'eighthTriplet' | 'sixteenth';

@Component({
  templateUrl: './metronome.page.html',
  styleUrls: ['./metronome.page.scss'],
  standalone: true,
  imports: [
    ZardSharedModule,
    CommonModule,
    RemainingTimePipe,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class MetronomePage implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('bpmDialog') bpmDialogRef?: ElementRef<HTMLDialogElement>;

  readonly bpm = signal(120);
  readonly timeSignature = signal(4);
  readonly timerDuration = signal(3);
  readonly isPlaying = signal(false);
  readonly currentBeat = signal(0);
  readonly remainingTime = signal(0);
  readonly subdivision = signal<SubdivisionType>('quarter');
  readonly accentBeat = signal(1);
  readonly bpmKeypadOpen = signal(false);
  readonly bpmKeypadInput = signal('');

  readonly keypadDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

  accentEnabled = new FormControl(true);
  soundEnabled = new FormControl(true);
  endingSoundEnabled = new FormControl(true);

  private readonly audioContext = new (globalThis.AudioContext || (globalThis as any).webkitAudioContext)();
  private accentBuffer: AudioBuffer | null = null;
  private clickBuffer: AudioBuffer | null = null;
  private tapTimes: number[] = [];
  private ticksPerBeat = 1;
  private schedulerId: ReturnType<typeof setInterval> | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private schedulerTick = 0;
  private readonly scheduleAheadTime = 0.12;
  private readonly schedulerIntervalMs = 20;

  getBeatIndices(): number[] {
    return Array.from({ length: this.timeSignature() }, (_, i) => i);
  }

  ngOnInit() {
    this.loadSounds();
  }

  ngOnDestroy() {
    this.clearSchedulerAndTimer();
    this.isPlaying.set(false);
  }

  async loadSounds() {
    try {
      const [clickRes, accentRes] = await Promise.all([
        fetch('assets/audio/metronome/classic/click.m4a'),
        fetch('assets/audio/metronome/classic/accent.m4a'),
      ]);
      this.clickBuffer = await this.audioContext.decodeAudioData(
        await (await clickRes).arrayBuffer()
      );
      this.accentBuffer = await this.audioContext.decodeAudioData(
        await (await accentRes).arrayBuffer()
      );
    } catch {}
  }

  tapTempo() {
    const now = Date.now();
    this.tapTimes = this.tapTimes.filter((t) => now - t < 2000);
    this.tapTimes.push(now);
    if (this.tapTimes.length >= 2) {
      const gaps = this.tapTimes.slice(1).map((t, i) => t - this.tapTimes[i]);
      const avgMs = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const bpm = Math.round(60000 / avgMs);
      const clamped = Math.max(30, Math.min(300, bpm));
      this.bpm.set(clamped);
    }
  }

  setBpmByDelta(delta: number) {
    this.bpm.update((v) => Math.max(30, Math.min(300, v + delta)));
  }

  openBpmKeypad() {
    this.bpmKeypadInput.set(String(this.bpm()));
    this.bpmKeypadOpen.set(true);
  }

  ngAfterViewChecked() {
    const dialog = this.bpmDialogRef?.nativeElement;
    if (dialog && this.bpmKeypadOpen() && !dialog.open) {
      dialog.showModal();
    }
  }

  keypadDigit(d: number) {
    const current = this.bpmKeypadInput();
    const isFirstInput = current === '' || current === '0' || current === String(this.bpm());
    const next = isFirstInput ? String(d) : current + d;
    if (next.length <= 3) this.bpmKeypadInput.set(next);
  }

  keypadClear() {
    this.bpmKeypadInput.set('0');
  }

  keypadSet() {
    const raw = this.bpmKeypadInput() || '0';
    const value = Math.max(30, Math.min(300, Math.round(+raw) || 30));
    this.bpm.set(value);
    this.closeBpmKeypad();
  }

  closeBpmKeypad() {
    this.bpmDialogRef?.nativeElement?.close();
    this.bpmKeypadOpen.set(false);
  }

  onBpmDialogBackdropClick(event: MouseEvent) {
    if (event.target === this.bpmDialogRef?.nativeElement) this.closeBpmKeypad();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (!this.bpmKeypadOpen()) return;
    if (event.key >= '0' && event.key <= '9') {
      event.preventDefault();
      this.keypadDigit(parseInt(event.key, 10));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.keypadSet();
    }
  }

  startMainMetronome() {
    this.startMetronome();
  }

  async startMetronome() {
    if (this.isPlaying()) return;

    const sub = this.subdivision();
    this.ticksPerBeat =
      sub === 'eighth' ? 2 : sub === 'eighthTriplet' ? 3 : sub === 'sixteenth' ? 4 : 1;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.isPlaying.set(true);
    this.remainingTime.set(this.timerDuration() * 60);
    this.currentBeat.set(0);

    const ts = this.timeSignature();
    const intervalSec = 60 / (this.bpm() * this.ticksPerBeat);
    this.nextNoteTime = this.audioContext.currentTime;
    this.schedulerTick = 0;

    this.scheduleClickAt(this.nextNoteTime, ts);
    this.applyBeat(ts, this.schedulerTick);
    this.schedulerTick++;
    this.nextNoteTime += intervalSec;

    this.schedulerId = setInterval(() => this.scheduler(ts), this.schedulerIntervalMs);

    this.timerId = setInterval(() => {
      this.remainingTime.update((t) => t - 1);
      if (this.remainingTime() <= 0) this.stopMetronome();
    }, 1000);
  }

  private getIntervalSec(): number {
    return 60 / (this.bpm() * this.ticksPerBeat);
  }

  private scheduleClickAt(when: number, ts: number): void {
    if (this.soundEnabled.value !== true) return;
    const beatIndex = Math.floor(this.schedulerTick / this.ticksPerBeat) % ts;
    const beat = beatIndex + 1;
    const isAccent = !!(beat === this.accentBeat() && this.accentEnabled.value);
    const buf = isAccent ? this.accentBuffer : this.clickBuffer;
    if (!buf) return;
    const source = this.audioContext.createBufferSource();
    source.buffer = buf;
    source.connect(this.audioContext.destination);
    source.start(when);
  }

  private applyBeat(ts: number, tick: number): void {
    const beatIndex = Math.floor(tick / this.ticksPerBeat) % ts;
    this.currentBeat.set(beatIndex + 1);
  }

  private scheduler(ts: number): void {
    if (!this.isPlaying()) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const intervalSec = this.getIntervalSec();
    const lookAhead = now + this.scheduleAheadTime;

    while (this.nextNoteTime < lookAhead) {
      this.scheduleClickAt(this.nextNoteTime, ts);
      this.applyBeat(ts, this.schedulerTick);
      this.schedulerTick++;
      this.nextNoteTime += intervalSec;
    }
  }

  stopMetronome() {
    if (this.endingSoundEnabled.value) {
      const a = new Audio('assets/audio/ending.mp3');
      a.play().catch(() => {});
    }
    this.clearSchedulerAndTimer();
    this.isPlaying.set(false);
  }

  stopManualMetronome() {
    this.clearSchedulerAndTimer();
    this.isPlaying.set(false);
  }

  private clearSchedulerAndTimer() {
    if (this.schedulerId != null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    if (this.timerId != null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  playClickSound(accent: boolean) {
    if (this.soundEnabled.value !== true) return;
    const buf = accent && this.accentEnabled.value ? this.accentBuffer : this.clickBuffer;
    if (!buf) return;
    const source = this.audioContext.createBufferSource();
    source.buffer = buf;
    source.connect(this.audioContext.destination);
    source.start(0);
  }

  setTimeDuration(event: Event) {
    const target = event.target as HTMLInputElement;
    this.timerDuration.set(+target.value || 1);
  }

  cycleTimeSignature() {
    const v = this.timeSignature();
    this.timeSignature.set(v >= 8 ? 2 : v + 1);
  }
}
