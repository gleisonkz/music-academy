import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';
import {
    AudioUploadDropzoneComponent
} from 'src/app/widgets/components/audio-upload-dropzone/audio-upload-dropzone.component';

import { CommonModule } from '@angular/common';
import { Component, computed, signal, viewChild } from '@angular/core';
import { Client, handle_file } from '@gradio/client';

import {
    TrackAudioPlayerComponent
} from '../../components/track-audio-player/track-audio-player.component';

type GradioAudioHandle = string | { url?: string; path?: string } | null;

interface ProcessJsonResponse {
  files?: {
    vocals_path?: GradioAudioHandle;
    instrumental_path?: GradioAudioHandle;
  };
  music?: {
    estimated_key?: string;
    tonic_pitch_class?: number;
    mode?: string;
  };
  vocal_range?: {
    min_note?: string;
    max_note?: string;
    min_time_sec?: number;
    max_time_sec?: number;
    min_hz?: number;
    max_hz?: number;
  };
  user_range?: {
    min_note?: string;
    max_note?: string;
  };
  recommendation?: {
    target_key?: string;
    transpose_semitones?: number;
    suggested_min_note?: string;
    suggested_max_note?: string;
  };
}

const TOM_IDEAL_BACKEND_URL_LOCAL = 'http://127.0.0.1:7860';
const TOM_IDEAL_BACKEND_URL_PUBLIC = 'https://gleisonkz-audio-separator-ai.hf.space';

function resolveTomIdealBackendUrl(): string {
  const hostname = globalThis?.location?.hostname ?? '';
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

  return isLocalHost ? TOM_IDEAL_BACKEND_URL_LOCAL : TOM_IDEAL_BACKEND_URL_PUBLIC;
}

@Component({
  selector: 'app-ideal-pitch-page',
  standalone: true,
  imports: [CommonModule, ZardSharedModule, AudioUploadDropzoneComponent, TrackAudioPlayerComponent],
  templateUrl: './ideal-pitch.page.html',
  styleUrls: ['./ideal-pitch.page.scss'],
})
export class IdealPitchPage {
  private readonly vocalsPlayer = viewChild<TrackAudioPlayerComponent>('vocalsPlayer');

  readonly noteOptions = [
    'C2',
    'C#2',
    'D2',
    'D#2',
    'E2',
    'F2',
    'F#2',
    'G2',
    'G#2',
    'A2',
    'A#2',
    'B2',
    'C3',
    'C#3',
    'D3',
    'D#3',
    'E3',
    'F3',
    'F#3',
    'G3',
    'G#3',
    'A3',
    'A#3',
    'B3',
    'C4',
    'C#4',
    'D4',
    'D#4',
    'E4',
    'F4',
    'F#4',
    'G4',
    'G#4',
    'A4',
    'A#4',
    'B4',
    'C5',
    'C#5',
    'D5',
    'D#5',
    'E5',
    'F5',
    'F#5',
    'G5',
    'G#5',
    'A5',
    'A#5',
    'B5',
    'C6',
  ] as const;

  readonly userMin = signal('E3');
  readonly userMax = signal('C#5');
  readonly minNoteOptions = computed(() => {
    const maxIdx = this.noteOptions.indexOf(this.userMax() as (typeof this.noteOptions)[number]);
    if (maxIdx < 0) return this.noteOptions;
    return this.noteOptions.filter((_, idx) => idx <= maxIdx);
  });
  readonly maxNoteOptions = computed(() => {
    const minIdx = this.noteOptions.indexOf(this.userMin() as (typeof this.noteOptions)[number]);
    if (minIdx < 0) return this.noteOptions;
    return this.noteOptions.filter((_, idx) => idx >= minIdx);
  });

  readonly selectedFile = signal<File | null>(null);
  readonly selectedFileName = computed(() => this.selectedFile()?.name ?? '');

  readonly isProcessing = signal(false);
  readonly progress = signal(0);
  readonly progressLabel = signal('Aguardando envio...');
  readonly error = signal<string | null>(null);

  readonly result = signal<ProcessJsonResponse | null>(null);

  onAudioFileSelected(file: File): void {
    if (!file.type.startsWith('audio/')) {
      this.error.set('Selecione um arquivo de áudio válido.');
      return;
    }
    this.error.set(null);
    this.selectedFile.set(file);
  }

  onUserMinChange(value: string): void {
    this.userMin.set(value);
    const minIdx = this.noteOptions.indexOf(value as (typeof this.noteOptions)[number]);
    const maxIdx = this.noteOptions.indexOf(this.userMax() as (typeof this.noteOptions)[number]);
    if (minIdx !== -1 && maxIdx !== -1 && minIdx > maxIdx) {
      this.userMax.set(value);
    }
  }

  onUserMaxChange(value: string): void {
    this.userMax.set(value);
    const minIdx = this.noteOptions.indexOf(this.userMin() as (typeof this.noteOptions)[number]);
    const maxIdx = this.noteOptions.indexOf(value as (typeof this.noteOptions)[number]);
    if (minIdx !== -1 && maxIdx !== -1 && maxIdx < minIdx) {
      this.userMin.set(value);
    }
  }

  async processAudio(): Promise<void> {
    const file = this.selectedFile();
    if (!file) {
      this.error.set('Escolha um arquivo de áudio antes de processar.');
      return;
    }

    this.error.set(null);
    this.result.set(null);
    this.isProcessing.set(true);
    this.progress.set(0);
    this.progressLabel.set('Conectando ao backend...');

    try {
      const app = await Client.connect(resolveTomIdealBackendUrl(), {
        events: ['data', 'status'],
      });

      const submission = app.submit('/process_json', {
        audio: handle_file(file),
        user_min: this.userMin().trim(),
        user_max: this.userMax().trim(),
      });

      for await (const msg of submission) {
        if (msg.type === 'status') {
          const stage = msg.stage ?? 'processing';
          const pd = msg.progress_data?.[0];
          const rawProgress = pd?.progress;
          const desc = pd?.desc ?? stage;
          if (typeof rawProgress === 'number') {
            this.progress.set(Math.round(rawProgress * 100));
          }
          this.progressLabel.set(desc);
        }

        if (msg.type === 'data') {
          const raw = msg.data;
          const payload = (Array.isArray(raw) ? raw[0] : raw) as ProcessJsonResponse;
          this.result.set(payload ?? null);
          this.progress.set(100);
          this.progressLabel.set('Concluído');
          break;
        }
      }
    } catch (err) {
      this.error.set((err as Error)?.message ?? 'Falha ao processar áudio no backend.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  audioUrlFromHandle(handle: GradioAudioHandle): string {
    if (!handle) return '';
    if (typeof handle === 'string') return this.normalizeAudioUrl(handle);
    if (typeof handle.url === 'string') return this.normalizeAudioUrl(handle.url);
    if (typeof handle.path === 'string') return this.normalizeAudioUrl(handle.path);
    return '';
  }

  private normalizeAudioUrl(value: string): string {
    const raw = value.trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;

    const backend = resolveTomIdealBackendUrl().replace(/\/+$/, '');
    const localFile = raw.replace(/^file:\/\//i, '');
    const normalizedPath = localFile.split('\\').join('/');
    const encodedPath = encodeURIComponent(normalizedPath);
    return `${backend}/gradio_api/file=${encodedPath}`;
  }

  formatSeconds(seconds?: number): string | null {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return null;
    return `${seconds.toFixed(1)}s`;
  }

  playVocalAt(seconds?: number): void {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return;
    const player = this.vocalsPlayer();
    if (!player) return;
    player.seekTo(seconds);
    player.playIfPaused();
  }
}
