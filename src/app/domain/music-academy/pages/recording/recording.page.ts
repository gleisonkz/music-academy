import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';

import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { getDriveTokenFromCache } from '../../shared/drive-token';
import { loadRecordingContextFromDrive } from '../../shared/load-recording-context';
import { SyncPointsListComponent } from '../../components/sync-points-list';
import { TrackAudioPlayerComponent } from '../../components/track-audio-player/track-audio-player.component';

/** Ponto de sincronia mapa/áudio (time em segundos, blockIndex do parágrafo). */
export interface SyncPoint {
  time: number;
  blockIndex: number;
}

/** State opcional ao navegar do Kit Ensaio com um áudio já escolhido. */
export interface RecordingState {
  backingAudioUrl?: string;
  fileName?: string;
  mapBacksUrl?: string;
  mapBacksFileName?: string;
  mapBacksMimeType?: string;
  /** URL (blob) do JSON de sincronia gerado no Editor de Sincronia (busca recursiva por "sync-map" no Drive). */
  syncMapUrl?: string;
  /** ID da pasta do Drive onde o áudio está (para o Editor de Sincronia salvar o JSON lá). */
  driveFolderId?: string;
  /** Token de acesso ao Drive (para o Editor de Sincronia fazer upload do JSON). */
  driveAccessToken?: string;
}

@Component({
  selector: 'app-recording-page',
  standalone: true,
  imports: [ZardSharedModule, CommonModule, RouterLink, TrackAudioPlayerComponent, SyncPointsListComponent],
  templateUrl: './recording.page.html',
  styleUrls: ['./recording.page.scss'],
})
export class RecordingPage implements OnInit, AfterViewChecked, OnDestroy {
  private readonly backingPlayerRef = viewChild<TrackAudioPlayerComponent>('backingPlayer');
  private readonly mapContainerRef = viewChild<ElementRef<HTMLElement>>('mapContainer');
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  /** Pontos de sincronia (time, blockIndex) carregados do JSON do Drive ou manual. */
  syncPoints = signal<SyncPoint[]>([]);
  /** Índice do bloco ativo conforme o currentTime do áudio. */
  activeBlockIndex = signal<number | null>(null);
  private readonly syncMapUrl = signal<string | null>(null);
  private enumeratedForHtml: string | null = null;
  /** Quantidade de blocos enumerados no mapa (acorda o effect que aplica .active após o DOM estar pronto). */
  private enumeratedBlocksCount = signal(0);
  /** Tempo atual do áudio de apoio (atualizado pelo output do player para o effect reagir). */
  backingCurrentTime = signal(0);
  /** Mensagem de erro ao restaurar contexto da URL (ex.: token expirado). */
  restoreError = signal<string | null>(null);
  /** true enquanto restaura contexto do Drive após F5. */
  restoringFromUrl = signal(false);

  constructor() {
    const state = this.router.getCurrentNavigation()?.extras?.state as RecordingState | undefined;
    if (state?.backingAudioUrl) {
      this.backingAudioUrl.set(state.backingAudioUrl);
      this.fileName.set(state.fileName ?? 'Áudio do Kit Ensaio');
    }
    if (state?.mapBacksUrl) {
      this.mapBacksUrl.set(state.mapBacksUrl);
      this.mapBacksFileName.set(state.mapBacksFileName ?? 'MAPA BACKS');
      this.mapBacksMimeType.set(state.mapBacksMimeType ?? '');
    }
    if (state?.syncMapUrl) {
      this.syncMapUrl.set(state.syncMapUrl);
    }

    effect(
      () => {
        const t = this.backingCurrentTime();
        const points = this.syncPoints();
        if (points.length === 0) {
          this.activeBlockIndex.set(null);
          return;
        }
        let idx: number | null = null;
        for (let i = points.length - 1; i >= 0; i--) {
          if (points[i].time <= t) {
            idx = points[i].blockIndex;
            break;
          }
        }
        this.activeBlockIndex.set(idx);
      },
      { allowSignalWrites: true }
    );

    effect(() => {
      this.enumeratedBlocksCount();
      const container = this.mapContainerRef()?.nativeElement;
      const content = container?.querySelector('.map-html-content');
      if (!content) return;
      const activeIdx = this.activeBlockIndex();
      const blocks = content.querySelectorAll<HTMLElement>('[data-block-index]');
      if (activeIdx === null) {
        blocks.forEach((el) => this.clearSpotlightStyles(el));
        return;
      }
      blocks.forEach((el) => {
        const isActive = el.getAttribute('data-block-index') === String(activeIdx);
        this.applySpotlightToBlock(el, isActive);
      });
      const activeEl = content.querySelector(`[data-block-index="${activeIdx}"]`);
      if (activeEl) {
        (activeEl as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  /** Aplica efeito spotlight por bloco: inativos escurecidos, ativo normal (inline para vencer estilos do Docs). */
  private applySpotlightToBlock(el: HTMLElement, isActive: boolean): void {
    if (isActive) {
      el.classList.add('active');
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('filter', 'none', 'important');
      el.style.setProperty('transition', 'opacity 0.3s ease, filter 0.3s ease', 'important');
    } else {
      el.classList.remove('active');
      el.style.setProperty('opacity', '0.4', 'important');
      el.style.setProperty('filter', 'brightness(0.7)', 'important');
      el.style.setProperty('transition', 'opacity 0.3s ease, filter 0.3s ease', 'important');
    }
  }

  /** Remove estilos de spotlight (volta ao normal). */
  private clearSpotlightStyles(el: HTMLElement): void {
    el.classList.remove('active');
    el.style.removeProperty('opacity');
    el.style.removeProperty('filter');
    el.style.removeProperty('transition');
  }

  /** Corrige HTML do Docs: remove clip à esquerda, injeta estilo e wrapper com zona segura. */
  private normalizeDocHtml(html: string): string {
    const fixInlineStyles = (raw: string) =>
      raw.replace(
        /style="([^"]*)"/gi,
        (_match: string, style: string) => {
          let s = style
            .replace(/\boverflow\s*:\s*(?:hidden|auto|scroll)\b/gi, 'overflow:visible')
            .replace(/\bmax-width\s*:\s*[^;]+;?/gi, '')
            .replace(/\bcontain\s*:\s*[^;]+;?/gi, '');
          s = s.replace(/\bmargin-left\s*:\s*-[^;]+;?/gi, 'margin-left:0 !important;');
          s = s.replace(/\bleft\s*:\s*-[^;]+;?/gi, 'left:0 !important;');
          return `style="${s}"`;
        }
      );

    const fixed = fixInlineStyles(html);
    const wrapOpen = '<div class="doc-fix-wrapper" style="overflow:visible;display:block;box-sizing:border-box;">';
    const wrapClose = '</div>';
    const styleOverride =
      '<style data-doc-fix="">.doc-fix-wrapper *{overflow:visible !important;contain:none !important;}.doc-fix-wrapper,.doc-fix-wrapper body{margin-left:0 !important;}</style>';
    return styleOverride + wrapOpen + fixed + wrapClose;
  }

  /**
   * Debug: com ?debugMapHtml=1 na URL, o HTML bruto do Docs é logado no console.
   * Use isso para inspecionar a estrutura e estilos se o texto ainda cortar.
   */
  private debugMapHtmlIfRequested(rawHtml: string): void {
    if (this.route.snapshot.queryParamMap.get('debugMapHtml') === '1') {
      console.log('[Recording] HTML bruto do MAPA BACKS (primeiros 8000 chars):', rawHtml.slice(0, 8000));
      if (rawHtml.length > 8000) console.log('... (total', rawHtml.length, 'chars)');
    }
  }

  ngOnInit(): void {
    const audioId = this.route.snapshot.queryParamMap.get('audioId');
    const folderIds = this.route.snapshot.queryParamMap.get('folderIds');
    const hasState = !!this.backingAudioUrl();

    if (!hasState && audioId && folderIds) {
      this.tryRestoreFromUrl(audioId, folderIds);
      return;
    }

    this.loadMapAndSyncFromCurrentUrls();
  }

  /** Carrega HTML/texto do mapa e JSON de sync a partir dos URLs já setados. */
  private loadMapAndSyncFromCurrentUrls(): void {
    const url = this.mapBacksUrl();
    const mime = (this.mapBacksMimeType() || '').toLowerCase();
    if (url && (mime.includes('text/plain') || mime.includes('text/html'))) {
      fetch(url)
        .then((r) => r.text())
        .then((t) => {
          if (mime.includes('text/html')) {
            this.debugMapHtmlIfRequested(t);
            this.mapBacksHtml.set(this.normalizeDocHtml(t));
          } else {
            this.mapBacksText.set(t);
          }
        })
        .catch(() => {
          this.mapBacksHtml.set(null);
          this.mapBacksText.set(null);
        });
    }

    const syncUrl = this.syncMapUrl();
    if (syncUrl) {
      fetch(syncUrl)
        .then((r) => r.json())
        .then((parsed: SyncPoint[]) => {
          if (Array.isArray(parsed) && parsed.every((p) => typeof p?.time === 'number' && typeof p?.blockIndex === 'number')) {
            this.syncPoints.set([...parsed].sort((a, b) => a.time - b.time));
          }
        })
        .catch(() => {});
    }
  }

  /** Restaura áudio + mapa + sync do Drive usando queryParams (após F5). */
  private tryRestoreFromUrl(audioId: string, folderIds: string): void {
    const token = getDriveTokenFromCache();
    if (!token) {
      this.restoreError.set('Sessão do Drive expirada. Abra pelo Kit Ensaio e conecte de novo.');
      return;
    }
    this.restoringFromUrl.set(true);
    this.restoreError.set(null);
    loadRecordingContextFromDrive(token, audioId, folderIds)
      .then((ctx) => {
        this.backingAudioUrl.set(ctx.backingAudioUrl);
        this.fileName.set(ctx.fileName);
        this.mapBacksUrl.set(ctx.mapBacksUrl);
        this.mapBacksFileName.set(ctx.mapBacksFileName);
        this.mapBacksMimeType.set(ctx.mapBacksMimeType);
        this.syncMapUrl.set(ctx.syncMapUrl);
        this.loadMapAndSyncFromCurrentUrls();
      })
      .catch((err) => {
        this.restoreError.set((err as Error)?.message ?? 'Não foi possível recarregar. Abra pelo Kit Ensaio.');
      })
      .finally(() => this.restoringFromUrl.set(false));
  }

  ngAfterViewChecked(): void {
    const html = this.mapBacksHtml();
    if (!html || this.enumeratedForHtml === html) return;
    const container = this.mapContainerRef()?.nativeElement;
    if (!container) return;
    const content = container.querySelector('.map-html-content');
    if (!content) return;
    // Google Docs exporta com <p> e/ou <div>; mesmo seletor do Editor de Sincronia para índices baterem
    const blocks = content.querySelectorAll('.doc-fix-wrapper p, .doc-fix-wrapper > div');
    blocks.forEach((el, i) => (el as HTMLElement).dataset['blockIndex'] = String(i));
    this.enumeratedForHtml = html;
    this.enumeratedBlocksCount.set(blocks.length);
  }

  /** Arquivo de áudio enviado (backing track) */
  audioFile = signal<File | null>(null);
  /** URL do áudio para reprodução */
  backingAudioUrl = signal<string | null>(null);
  /** Nome do arquivo para exibição */
  fileName = signal<string>('');

  /** Mapa da música (MAPA BACKS) vindo do Kit Ensaio — URL, nome e mime para exibição. */
  mapBacksUrl = signal<string | null>(null);
  mapBacksFileName = signal<string>('');
  mapBacksMimeType = signal<string>('');

  readonly hasMapBacks = computed(() => !!this.mapBacksUrl());
  /** Sidebar de controles: true = visível, false = oculta. */
  sidebarOpen = signal(true);
  /** Conteúdo do mapa em texto puro (export text/plain). */
  mapBacksText = signal<string | null>(null);
  /** Conteúdo do mapa em HTML (export Google Docs como HTML — preserva cores e negrito). */
  mapBacksHtml = signal<string | null>(null);
  readonly mapBacksSafeUrl = computed(() => {
    const url = this.mapBacksUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
  readonly mapBacksSafeHtml = computed(() => {
    const html = this.mapBacksHtml();
    return html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
  });
  readonly mapBacksIsPdf = computed(() => (this.mapBacksMimeType() || '').toLowerCase().includes('pdf'));
  readonly mapBacksIsText = computed(() => (this.mapBacksMimeType() || '').toLowerCase().includes('text/plain'));
  readonly mapBacksIsHtml = computed(() => (this.mapBacksMimeType() || '').toLowerCase().includes('text/html'));

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
    this.backingCurrentTime.set(0);
  }

  /** Chamado a cada timeupdate do áudio de apoio; atualiza o signal para o effect de sincronia reagir. */
  onBackingTimeUpdate(currentTime: number): void {
    this.backingCurrentTime.set(currentTime);
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

  /** Move o áudio de apoio para o tempo indicado (clique no tempo da lista de seções). */
  seekBackingTo(time: number): void {
    this.backingPlayerRef()?.seekTo(time);
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
    const mapUrl = this.mapBacksUrl();
    if (mapUrl) URL.revokeObjectURL(mapUrl);
    const syncUrl = this.syncMapUrl();
    if (syncUrl) URL.revokeObjectURL(syncUrl);
  }
}
