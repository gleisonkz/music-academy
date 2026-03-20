import { Client, handle_file } from '@gradio/client';
import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';
import { AudioUploadDropzoneComponent } from 'src/app/widgets/components/audio-upload-dropzone/audio-upload-dropzone.component';
import { TrackAudioPlayerComponent } from '../../components/track-audio-player/track-audio-player.component';

import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

type GradioAudioHandle = string | { url?: string; path?: string } | null;

interface TomIdealResult {
  vocals: GradioAudioHandle;
  instrumental: GradioAudioHandle;
  keyText: string;
  graveText: string;
  agudoText: string;
  suggestedText: string;
}

interface NoteAndTime {
  note: string | null;
  time: string | null;
}

const TOM_IDEAL_BACKEND_URL_LOCAL = 'http://127.0.0.1:7860';
const TOM_IDEAL_BACKEND_URL_PUBLIC = 'https://gleisonkz-audio-separator-ai.hf.space';

function resolveTomIdealBackendUrl(): string {
  const hostname = globalThis?.location?.hostname ?? '';
  const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0';

  return isLocalHost ? TOM_IDEAL_BACKEND_URL_LOCAL : TOM_IDEAL_BACKEND_URL_PUBLIC;
}

@Component({
  selector: 'app-tom-ideal-page',
  standalone: true,
  imports: [CommonModule, ZardSharedModule, AudioUploadDropzoneComponent, TrackAudioPlayerComponent],
  templateUrl: './tom-ideal.page.html',
  styleUrls: ['./tom-ideal.page.scss'],
})
export class TomIdealPage {
  readonly noteOptions = [
    'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2',
    'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
    'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
    'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5',
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

  readonly result = signal<TomIdealResult | null>(null);

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

      const submission = app.submit('/process', {
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
          const [vocals, instrumental, keyText, graveText, agudoText, suggestedText] = msg.data as [
            GradioAudioHandle,
            GradioAudioHandle,
            string,
            string,
            string,
            string,
          ];

          this.result.set({
            vocals,
            instrumental,
            keyText: keyText ?? '',
            graveText: graveText ?? '',
            agudoText: agudoText ?? '',
            suggestedText: suggestedText ?? '',
          });
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
    if (typeof handle === 'string') return handle;
    if (typeof handle.url === 'string') return handle.url;
    if (typeof handle.path === 'string') return handle.path;
    return '';
  }

  extractMainTonality(text: string): string | null {
    const match =
      text.match(/tom estimado:\s*([^.,;\n]+)/i) ??
      text.match(/tom\s*:\s*([^.,;\n]+)/i);
    return match?.[1]?.trim() ?? null;
  }

  extractRecommendedTonality(text: string): string | null {
    const match =
      text.match(/sugest[aã]o.*?:\s*([^.,;\n]+)/i) ??
      text.match(/tom transposto:\s*([^.,;\n]+)/i);
    return match?.[1]?.trim() ?? null;
  }

  extractNoteAndTime(text: string): NoteAndTime {
    const noteMatch = text.match(/[A-G](?:#|b)?\d/);
    const timeMatch = text.match(/-?\d+(?:\.\d+)?s/);
    return {
      note: noteMatch?.[0] ?? null,
      time: timeMatch?.[0] ?? null,
    };
  }
}

