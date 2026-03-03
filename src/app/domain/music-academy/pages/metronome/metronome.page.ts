import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';
import { RemainingTimePipe } from 'src/app/widgets/pipes/remaining-time/remaining-time.pipe';

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

const PLAYLIST_STORAGE_KEY = 'music-academy-metronome-playlist';

export type SubdivisionType = 'quarter' | 'eighth' | 'eighthTriplet' | 'sixteenth';

export interface MetronomePreset {
  id: string;
  name: string;
  bpm: number;
  timeSignature: number;
}

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
export class MetronomePage implements OnInit, OnDestroy {
  readonly bpm = signal(120);
  readonly timeSignature = signal(4);
  readonly timerDuration = signal(3);
  readonly isPlaying = signal(false);
  readonly currentBeat = signal(0);
  readonly remainingTime = signal(0);
  readonly subdivision = signal<SubdivisionType>('quarter');
  readonly accentBeat = signal(1);

  readonly timeSignatures = [2, 3, 4, 5, 6, 7, 8];
  readonly subdivisionOptions: { value: SubdivisionType; label: string }[] = [
    { value: 'quarter', label: '1/4' },
    { value: 'eighth', label: '1/8' },
    { value: 'eighthTriplet', label: '1/8 triplet' },
    { value: 'sixteenth', label: '1/16' },
  ];

  accentEnabled = new FormControl(true);
  soundEnabled = new FormControl(true);
  endingSoundEnabled = new FormControl(true);

  readonly playlist = signal<MetronomePreset[]>([]);
  readonly selectedPresetId = signal<string | null>(null);
  readonly practiceMode = signal<'none' | 'warmup' | 'automator'>('none');
  readonly warmupTargetBpm = signal(80);
  readonly warmupSteps = signal<{ ratio: number; durationMin: number }[]>([
    { ratio: 0.5, durationMin: 5 },
    { ratio: 0.75, durationMin: 3 },
    { ratio: 1, durationMin: 12 },
  ]);
  readonly automatorStartBpm = signal(90);
  readonly automatorMaxBpm = signal(180);
  readonly automatorIncreaseBpm = signal(10);
  readonly automatorEveryBars = signal(10);
  readonly automatorByBars = signal(true);
  readonly practiceElapsedBars = signal(0);
  readonly practiceCurrentBpm = signal(0);
  readonly flashOnTempoChange = new FormControl(false);

  private readonly audioContext = new (globalThis.AudioContext || (globalThis as any).webkitAudioContext)();
  private accentBuffer: AudioBuffer | null = null;
  private clickBuffer: AudioBuffer | null = null;
  private tapTimes: number[] = [];
  private practiceStartBpm = 0;
  private ticksPerBeat = 1;
  private schedulerId: ReturnType<typeof setInterval> | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private schedulerTick = 0;
  private metronomeStartTime = 0;
  private readonly scheduleAheadTime = 0.12;
  private readonly schedulerIntervalMs = 20;

  readonly selectedPreset = computed(() => {
    const id = this.selectedPresetId();
    return this.playlist().find((p) => p.id === id) ?? null;
  });

  getBeatIndices(): number[] {
    return Array.from({ length: this.timeSignature() }, (_, i) => i);
  }

  readonly ticksPerBar = computed(() => {
    const sub = this.subdivision();
    const mul = sub === 'eighth' ? 2 : sub === 'eighthTriplet' ? 3 : sub === 'sixteenth' ? 4 : 1;
    return this.timeSignature() * mul;
  });

  ngOnInit() {
    this.loadSounds();
    this.loadPlaylist();
    this.practiceCurrentBpm.set(this.bpm());
  }

  ngOnDestroy() {
    this.clearSchedulerAndTimer();
    this.isPlaying.set(false);
  }

  loadPlaylist() {
    try {
      const raw = localStorage.getItem(PLAYLIST_STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw) as MetronomePreset[];
        this.playlist.set(Array.isArray(list) ? list : []);
      }
    } catch {
      this.playlist.set([]);
    }
  }

  savePlaylist() {
    try {
      localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(this.playlist()));
    } catch {}
  }

  addPreset(name: string) {
    if (!name.trim()) return;
    const preset: MetronomePreset = {
      id: 'p' + Date.now(),
      name: name.trim(),
      bpm: this.bpm(),
      timeSignature: this.timeSignature(),
    };
    this.playlist.update((list) => [...list, preset]);
    this.savePlaylist();
    this.selectedPresetId.set(preset.id);
  }

  loadPreset(preset: MetronomePreset) {
    this.bpm.set(preset.bpm);
    this.timeSignature.set(preset.timeSignature);
    this.selectedPresetId.set(preset.id);
    this.practiceCurrentBpm.set(preset.bpm);
  }

  removePreset(id: string) {
    this.playlist.update((list) => list.filter((p) => p.id !== id));
    if (this.selectedPresetId() === id) this.selectedPresetId.set(null);
    this.savePlaylist();
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
      this.practiceCurrentBpm.set(clamped);
    }
  }

  setBpmByDelta(delta: number) {
    this.bpm.update((v) => Math.max(30, Math.min(300, v + delta)));
    this.practiceCurrentBpm.set(this.bpm());
  }

  startMainMetronome() {
    this.practiceMode.set('none');
    this.startMetronome();
  }

  startPracticeWarmup() {
    this.practiceMode.set('warmup');
    this.bpm.set(Math.round(this.warmupTargetBpm() * (this.warmupSteps()[0]?.ratio ?? 0.5)));
    this.practiceCurrentBpm.set(this.bpm());
    this.startMetronome();
  }

  startPracticeAutomator() {
    this.practiceMode.set('automator');
    this.bpm.set(this.automatorStartBpm());
    this.practiceCurrentBpm.set(this.bpm());
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
    this.practiceElapsedBars.set(0);
    this.practiceStartBpm = this.bpm();
    this.practiceCurrentBpm.set(this.bpm());

    const ts = this.timeSignature();
    const intervalSec = 60 / (this.bpm() * this.ticksPerBeat);
    this.metronomeStartTime = this.audioContext.currentTime;
    this.nextNoteTime = this.metronomeStartTime;
    this.schedulerTick = 0;

    this.scheduleClickAt(this.nextNoteTime, ts);
    this.applyBeatAndPractice(ts, this.schedulerTick);
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

  private applyBeatAndPractice(ts: number, tick: number): void {
    const beatIndex = Math.floor(tick / this.ticksPerBeat) % ts;
    this.currentBeat.set(beatIndex + 1);
    if (tick > 0 && tick % (ts * this.ticksPerBeat) === 0) {
      this.practiceElapsedBars.update((b) => b + 1);
      this.updatePracticeBpm();
    }
  }

  private scheduler(ts: number): void {
    if (!this.isPlaying()) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const intervalSec = this.getIntervalSec();
    const lookAhead = now + this.scheduleAheadTime;

    while (this.nextNoteTime < lookAhead) {
      this.scheduleClickAt(this.nextNoteTime, ts);
      this.applyBeatAndPractice(ts, this.schedulerTick);
      this.schedulerTick++;
      this.nextNoteTime += intervalSec;
    }
  }

  private updatePracticeBpm() {
    const mode = this.practiceMode();
    if (mode === 'none') return;

    if (mode === 'automator') {
      const start = this.automatorStartBpm();
      const max = this.automatorMaxBpm();
      const inc = this.automatorIncreaseBpm();
      const every = this.automatorEveryBars();
      const bars = this.practiceElapsedBars();
      const steps = Math.floor(bars / every);
      const newBpm = Math.min(max, start + steps * inc);
      if (newBpm !== this.practiceCurrentBpm()) {
        this.bpm.set(newBpm);
        this.practiceCurrentBpm.set(newBpm);
        if (this.flashOnTempoChange.value) this.triggerFlash();
      }
    }

    if (mode === 'warmup') {
      const target = this.warmupTargetBpm();
      const steps = this.warmupSteps();
      const ts = this.timeSignature();
      let totalBars = 0;
      let ratio = 0;
      for (const s of steps) {
        const bpmStep = target * s.ratio;
        const barsInStep = Math.ceil((s.durationMin * bpmStep) / ts);
        if (this.practiceElapsedBars() < totalBars + barsInStep) {
          ratio = s.ratio;
          break;
        }
        totalBars += barsInStep;
      }
      if (ratio > 0) {
        const newBpm = Math.round(target * ratio);
        if (newBpm !== this.practiceCurrentBpm()) {
          this.bpm.set(newBpm);
          this.practiceCurrentBpm.set(newBpm);
          if (this.flashOnTempoChange.value) this.triggerFlash();
        }
      }
    }
  }

  private triggerFlash() {
    document.body.classList.add('metronome-flash');
    setTimeout(() => document.body.classList.remove('metronome-flash'), 150);
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

  setBpm(event: Event) {
    const target = event.target as HTMLInputElement;
    const v = Math.max(30, Math.min(300, +target.value || 120));
    this.bpm.set(v);
    this.practiceCurrentBpm.set(v);
  }

  setTimeSignature(v: number) {
    this.timeSignature.set(v);
  }

  setTimeSignatureDelta(delta: number) {
    const next = this.timeSignature() + delta;
    this.timeSignature.set(Math.max(2, Math.min(8, next)));
  }

  cycleTimeSignature() {
    const v = this.timeSignature();
    this.timeSignature.set(v >= 8 ? 2 : v + 1);
  }

  setSubdivision(value: SubdivisionType) {
    this.subdivision.set(value);
  }

  setAccentBeat(beat: number) {
    this.accentBeat.set(beat);
  }

  setWarmupStepRatio(index: number, ratio: number) {
    this.warmupSteps.update((steps) => {
      const s = [...steps];
      if (s[index]) s[index] = { ...s[index], ratio };
      return s;
    });
  }

  setWarmupStepDuration(index: number, durationMin: number) {
    this.warmupSteps.update((steps) => {
      const s = [...steps];
      if (s[index]) s[index] = { ...s[index], durationMin };
      return s;
    });
  }

  getAutomatorEstimatedMin(): number {
    const start = this.automatorStartBpm();
    const max = this.automatorMaxBpm();
    const inc = this.automatorIncreaseBpm();
    const every = this.automatorEveryBars();
    const ts = this.timeSignature();
    if (inc <= 0) return 0;
    const steps = Math.ceil((max - start) / inc);
    const bars = steps * every;
    const avgBpm = (start + max) / 2;
    return (bars * ts) / avgBpm;
  }
}
