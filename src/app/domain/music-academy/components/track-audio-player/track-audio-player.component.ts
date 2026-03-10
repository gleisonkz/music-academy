import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'ma-track-audio-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-audio-player.component.html',
  styleUrls: ['./track-audio-player.component.scss'],
})
export class TrackAudioPlayerComponent {
  private readonly audioRef = viewChild<ElementRef<HTMLAudioElement>>('audio');

  /** URL do áudio (blob ou arquivo) */
  src = input<string | null>(null);
  /** Duração em segundos (use quando o navegador não reportar, ex.: WebM gravado) */
  durationSeconds = input<number>(0);

  readonly isPlaying = signal(false);
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  /** Volume 0–1. Padrão 50%. */
  readonly volume = signal(0.5);

  /** Emitido a cada timeupdate do áudio (para sincronizar mapa/lyrics na página pai). */
  readonly timeUpdate = output<number>();

  readonly currentFormatted = computed(() => this.formatTime(this.currentTime()));
  readonly durationFormatted = computed(() => {
    const d = this.durationSeconds() || this.duration();
    return this.formatTime(d);
  });
  readonly progressPercent = computed(() => {
    const d = this.duration() || this.durationSeconds() || 0;
    if (d <= 0) return 0;
    return Math.min(100, (this.currentTime() / d) * 100);
  });

  constructor() {
    effect(() => {
      const s = this.src();
      if (s) {
        queueMicrotask(() => this.loadAudio());
      } else {
        this.currentTime.set(0);
        this.duration.set(0);
      }
    });
    effect(() => {
      const d = this.durationSeconds();
      if (d > 0) this.duration.set(d);
    });
  }

  private get audio(): HTMLAudioElement | undefined {
    return this.audioRef()?.nativeElement;
  }

  loadAudio(): void {
    const el = this.audio;
    if (!el?.src) return;
    el.volume = this.volume();
    el.load();
    this.duration.set(this.durationSeconds() || 0);
  }

  play(): void {
    this.restart();
  }

  pause(): void {
    this.audio?.pause();
  }

  restart(): void {
    const el = this.audio;
    if (el) {
      el.currentTime = 0;
      el.play().catch(() => {});
    }
  }

  togglePlay(): void {
    const el = this.audio;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }

  onTimeUpdate(): void {
    const el = this.audio;
    if (el) {
      const t = el.currentTime;
      this.currentTime.set(t);
      this.timeUpdate.emit(t);
    }
  }

  onLoadedMetadata(): void {
    const el = this.audio;
    if (el && Number.isFinite(el.duration) && !this.durationSeconds()) {
      this.duration.set(el.duration);
    } else if (this.durationSeconds()) {
      this.duration.set(this.durationSeconds());
    }
  }

  onDurationChange(): void {
    const el = this.audio;
    if (el && Number.isFinite(el.duration)) this.duration.set(el.duration);
    else if (this.durationSeconds()) this.duration.set(this.durationSeconds());
  }

  onPlay(): void {
    this.isPlaying.set(true);
  }

  onPause(): void {
    this.isPlaying.set(false);
  }

  /** Define o tempo atual do áudio em segundos (para seek pela lista de pontos). */
  seekTo(seconds: number): void {
    const el = this.audio;
    if (!el || !Number.isFinite(seconds) || seconds < 0) return;
    el.currentTime = seconds;
    this.currentTime.set(el.currentTime);
  }

  /** Dá play se o áudio estiver pausado (útil após seek ao clicar na seção). */
  playIfPaused(): void {
    const el = this.audio;
    if (el?.paused) el.play().catch(() => {});
  }

  onSeek(event: Event): void {
    const el = this.audio;
    const input = event.target as HTMLInputElement;
    if (!el || !input) return;
    const d = this.duration() || this.durationSeconds() || 0;
    if (d <= 0) return;
    const pct = Number(input.value) / 100;
    el.currentTime = pct * d;
    this.currentTime.set(el.currentTime);
  }

  onVolumeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const v = Number(input.value);
    this.volume.set(v);
    const el = this.audio;
    if (el) el.volume = v;
  }

  formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
