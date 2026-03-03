import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';

import {
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  NgZone,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { TrackAudioPlayerComponent } from '../../components/track-audio-player/track-audio-player.component';

/** State opcional ao navegar do Kit Ensaio com um áudio já escolhido. */
export interface RecordingState {
  backingAudioUrl?: string;
  fileName?: string;
}

@Component({
  selector: 'app-recording-page',
  standalone: true,
  imports: [ZardSharedModule, CommonModule, TrackAudioPlayerComponent],
  templateUrl: './recording.page.html',
  styleUrls: ['./recording.page.scss'],
})
export class RecordingPage {
  private readonly backingPlayerRef = viewChild<TrackAudioPlayerComponent>('backingPlayer');
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  constructor() {
    const state = this.router.getCurrentNavigation()?.extras?.state as RecordingState | undefined;
    if (state?.backingAudioUrl) {
      this.backingAudioUrl.set(state.backingAudioUrl);
      this.fileName.set(state.fileName ?? 'Áudio do Kit Ensaio');
    }
  }

  /** Arquivo de áudio enviado (backing track) */
  audioFile = signal<File | null>(null);
  /** URL do áudio para reprodução */
  backingAudioUrl = signal<string | null>(null);
  /** Nome do arquivo para exibição */
  fileName = signal<string>('');

  /** Estado do drag and drop */
  isDragging = signal(false);

  /** Gravando do microfone */
  isRecording = signal(false);
  /** Blob da gravação final */
  recordedBlob = signal<Blob | null>(null);
  /** URL da gravação para preview e download */
  recordedUrl = signal<string | null>(null);
  /** Duração da gravação em segundos (calculada ao parar) */
  recordedDurationSeconds = signal(0);

  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStartTime = 0;

  readonly hasBackingTrack = computed(() => !!this.backingAudioUrl());
  readonly hasRecording = computed(() => !!this.recordedUrl());

  readonly acceptTypes = 'audio/*,.mp3,.wav,.ogg,.m4a,.aac';

  /** Escolhe o melhor codec suportado pelo navegador (Opus = melhor qualidade). */
  private getBestSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) this.handleFile(files[0]);
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.handleFile(file);
    input.value = '';
  }

  private handleFile(file: File) {
    if (!file.type.startsWith('audio/')) return;
    this.clearBackingTrack();
    this.recordedBlob.set(null);
    this.recordedUrl.set(null);
    this.recordedDurationSeconds.set(0);
    const url = URL.createObjectURL(file);
    this.audioFile.set(file);
    this.backingAudioUrl.set(url);
    this.fileName.set(file.name);
  }

  private clearBackingTrack() {
    const url = this.backingAudioUrl();
    if (url) URL.revokeObjectURL(url);
    this.backingAudioUrl.set(null);
    this.audioFile.set(null);
    this.fileName.set('');
  }

  async startRecording() {
    if (this.isRecording() || !this.backingAudioUrl()) return;
    try {
      // Melhor qualidade: 48 kHz, stereo, sem noiseSuppression/autoGain (preserva música/voz).
      // Use fones para ouvir o backing e evitar que entre no microfone.
      const audioConstraints: MediaTrackConstraints = {
        sampleRate: { ideal: 48000 },
        channelCount: { ideal: 2 },
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      };
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
        });
      } catch {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const mimeType = this.getBestSupportedMimeType();
      const options: MediaRecorderOptions = {
        mimeType,
        audioBitsPerSecond: 256000,
      };
      if (mimeType && 'audioBitrateMode' in MediaRecorder.prototype) {
        (options as { audioBitrateMode?: string }).audioBitrateMode = 'variable';
      }
      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size) this.recordedChunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        const type = this.mediaRecorder?.mimeType || 'audio/webm';
        const chunks = [...this.recordedChunks];
        const blob = new Blob(chunks, { type });
        const durationSec = (Date.now() - this.recordingStartTime) / 1000;
        const url = URL.createObjectURL(blob);
        this.mediaStream?.getTracks().forEach((t) => t.stop());
        this.mediaStream = null;
        this.mediaRecorder = null;
        // onstop roda fora da zona do Angular; agendar atualização na zona
        this.ngZone.runOutsideAngular(() => {
          setTimeout(() => {
            this.ngZone.run(() => {
              this.recordedBlob.set(blob);
              this.recordedUrl.set(url);
              this.recordedDurationSeconds.set(durationSec);
              this.cdr.detectChanges();
            });
          }, 0);
        });
      };

      this.recordingStartTime = Date.now();
      // timeslice 1s: garante chunks regulares e evita perda em gravações longas
      this.mediaRecorder.start(1000);
      this.isRecording.set(true);

      this.backingPlayerRef()?.restart();
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      this.isRecording.set(false);
    }
  }

  stopRecording() {
    if (!this.isRecording() || !this.mediaRecorder) return;
    this.mediaRecorder.stop();
    this.backingPlayerRef()?.pause();
    this.isRecording.set(false);
  }

  downloadRecording() {
    const blob = this.recordedBlob();
    const url = this.recordedUrl();
    if (!blob || !url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `gravacao-${Date.now()}.webm`;
    a.click();
  }

  async shareWhatsApp() {
    const blob = this.recordedBlob();
    if (!blob) return;
    const file = new File([blob], `gravacao-${Date.now()}.webm`, { type: blob.type });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Gravação Music Academy',
          files: [file],
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') this.fallbackWhatsAppShare();
      }
    } else {
      this.fallbackWhatsAppShare();
    }
  }

  private fallbackWhatsAppShare() {
    window.open('https://wa.me/?text=' + encodeURIComponent('Minha gravação do Music Academy. Baixe o áudio pelo botão "Download" na página.'), '_blank');
  }

  removeBackingTrack() {
    this.stopRecording();
    this.clearBackingTrack();
    this.recordedBlob.set(null);
    const url = this.recordedUrl();
    if (url) URL.revokeObjectURL(url);
    this.recordedUrl.set(null);
  }

  ngOnDestroy() {
    this.clearBackingTrack();
    const url = this.recordedUrl();
    if (url) URL.revokeObjectURL(url);
  }
}
