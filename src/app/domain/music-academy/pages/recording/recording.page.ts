import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';

import { CommonModule } from '@angular/common';
import {
    AfterViewChecked, ChangeDetectorRef, Component, computed, effect, ElementRef, inject, NgZone,
    OnDestroy, OnInit, signal, viewChild
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { SyncPointsListComponent } from '../../components/sync-points-list';
import {
    TrackAudioPlayerComponent
} from '../../components/track-audio-player/track-audio-player.component';
import { KitEnsaioPermissionService } from 'src/app/shared/services/kit-ensaio-permission.service';
import { KIT_ENSAIO_FOLDER_ID } from '../kit-ensaio/kit-ensaio.page';
import { RecordingSyncEditorNavService } from '../../shared/recording-sync-editor-nav.service';
import { getDriveTokenFromCache, requestDriveToken } from '../../shared/drive-token';
import { loadRecordingContextFromDrive } from '../../shared/load-recording-context';
import { enumerateMapBlocks, normalizeDocHtml } from '../../shared/map-backs-doc';

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

/**
 * Lista de exclusão do spotlight: blocos cujo texto contiver uma dessas palavras/frases
 * não são escurecidos e permanecem sempre em destaque (rótulos do mapa).
 * Ajuste conforme o padrão dos seus mapas.
 */
const SPOTLIGHT_EXCLUSION_TERMS = ['UNÍSSONO PLENO', 'UNÍSSONO OITAVADO', 'ABERTO', 'DOBRA DE NAIPES', 'DOBRA DE NAIPE', 'CONTRA-TEMPO'] as const;

function isExcludedFromSpotlight(blockText: string): boolean {
  const normalized = blockText.trim().toUpperCase();
  if (!normalized) return false;
  return SPOTLIGHT_EXCLUSION_TERMS.some((term) => normalized.includes(term));
}

/** Padrões que indicam título de seção (Introdução, Verso 1, Refrão, etc.). */
const SECTION_HEADER_PATTERNS: RegExp[] = [
  /^Introdução\b/i,
  /^Interlúdio\b/i,
  /^Verso\s*\d/i,
  /^Refrão\b/i,
  /^Ponte\b/i,
  /^Coda\b/i,
  /^Coro\b/i,
  /^Preparação\b/i,
  /^Bridge\b/i,
  / - \(\dº?\s*vez\)/, // " - (1º vez)"
  / - \[\s*[\w\s]+\]$/, // " - [CONTRALTO MELODIA]"
];

function isSectionHeaderBlock(el: HTMLElement): boolean {
  const text = (el.textContent ?? '').trim();
  if (!text) return false;
  const matchesPattern = SECTION_HEADER_PATTERNS.some((p) => p.test(text));
  if (matchesPattern) return true;
  const isBold =
    el.querySelector('b, strong') != null || (typeof getComputedStyle !== 'undefined' && Number.parseInt(getComputedStyle(el).fontWeight, 10) >= 600);
  return isBold && text.length < 100;
}

/** Para cada índice de bloco, retorna o índice do título da seção a que pertence (ou o próprio se for título). */
function buildSectionHeaderMap(blocks: NodeListOf<HTMLElement>): Map<number, number> {
  const map = new Map<number, number>();
  let lastSectionIdx: number | null = null;
  blocks.forEach((el, i) => {
    if (isSectionHeaderBlock(el as HTMLElement)) lastSectionIdx = i;
    map.set(i, lastSectionIdx ?? i);
  });
  return map;
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
  private readonly permissionService = inject(KitEnsaioPermissionService);
  private readonly syncEditorNav = inject(RecordingSyncEditorNavService);

  /** Contexto para abrir o Sync Editor (pasta + token); setado ao vir do Kit Ensaio ou após restore por URL. */
  private readonly syncEditorContext = signal<{ driveFolderId?: string; driveAccessToken?: string } | null>(null);

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
  /** true enquanto refaz login do Drive para tentar restaurar na mesma página. */
  reconnectInProgress = signal(false);

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
    if (state?.driveFolderId || state?.driveAccessToken) {
      this.syncEditorContext.set({
        driveFolderId: state.driveFolderId,
        driveAccessToken: state.driveAccessToken,
      });
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
      { allowSignalWrites: true },
    );

    effect(() => {
      this.enumeratedBlocksCount();
      this.syncPoints();
      const container = this.mapContainerRef()?.nativeElement;
      const content = container?.querySelector('.map-html-content');
      if (!content) return;
      const activeIdx = this.activeBlockIndex();
      const blocks = content.querySelectorAll<HTMLElement>('[data-block-index]');
      if (activeIdx === null) {
        blocks.forEach((el) => this.clearSpotlightStyles(el));
      } else {
        const sectionMap = buildSectionHeaderMap(blocks);
        const activeSectionHeaderIdx = sectionMap.get(activeIdx) ?? null;
        blocks.forEach((el) => {
          const idx = Number(el.getAttribute('data-block-index'));
          const isExcluded = isExcludedFromSpotlight(el.textContent?.trim() ?? '');
          const isActive = isExcluded || idx === activeIdx || (activeSectionHeaderIdx !== null && idx === activeSectionHeaderIdx);
          this.applySpotlightToBlock(el, isActive);
        });
        const activeEl = content.querySelector(`[data-block-index="${activeIdx}"]`);
        if (activeEl) {
          (activeEl as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
      this.applySeekableToBlocks(content);
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

  /** Reaplica o estado de spotlight num bloco (ex.: após sair do hover seekable). */
  private refreshSpotlightForBlock(block: HTMLElement): void {
    const content = this.mapContainerRef()?.nativeElement?.querySelector('.map-html-content');
    const blocks = content?.querySelectorAll<HTMLElement>('[data-block-index]');
    if (!blocks?.length) return;
    const activeIdx = this.activeBlockIndex();
    if (activeIdx === null) {
      this.clearSpotlightStyles(block);
      return;
    }
    const idx = Number(block.dataset['blockIndex']);
    if (!Number.isInteger(idx)) return;
    const sectionMap = buildSectionHeaderMap(blocks);
    const activeSectionHeaderIdx = sectionMap.get(activeIdx) ?? null;
    const isExcluded = isExcludedFromSpotlight(block.textContent?.trim() ?? '');
    const isActive =
      isExcluded || idx === activeIdx || (activeSectionHeaderIdx !== null && idx === activeSectionHeaderIdx);
    this.applySpotlightToBlock(block, isActive);
  }

  /** Clique na área do mapa: se for em um bloco com sync point, move o áudio para essa seção. */
  onMapAreaClick(event: MouseEvent): void {
    if (this.syncPoints().length === 0) return;
    const target = event.target as HTMLElement;
    const blockEl = target.closest?.('[data-block-index]') as HTMLElement | null;
    if (!blockEl) return;
    const blockIndex = Number(blockEl.dataset['blockIndex']);
    if (!Number.isInteger(blockIndex)) return;
    const point = this.syncPoints().find((p) => p.blockIndex === blockIndex);
    if (!point) return;
    this.seekBackingTo(point.time);
  }

  private lastHoveredSeekableBlock: HTMLElement | null = null;

  /** Hover na área do mapa: contorno só na área do texto + opacity 1 (funciona em texto com ou sem preenchimento). */
  onMapAreaMouseOver(event: MouseEvent): void {
    const block = (event.target as HTMLElement).closest?.('[data-block-index].seekable') as HTMLElement | null;
    if (block === this.lastHoveredSeekableBlock) return;
    this.clearSeekableHover();
    if (!block) return;
    this.lastHoveredSeekableBlock = block;
    block.style.setProperty('opacity', '1', 'important');
    block.style.setProperty('width', 'fit-content', 'important');
    block.style.setProperty('box-shadow', '0 0 0 2px rgba(0, 251, 251, 0.9)', 'important');
    block.style.setProperty('border-radius', '0.25rem', 'important');
  }

  onMapAreaMouseLeave(): void {
    this.clearSeekableHover();
  }

  private clearSeekableHover(): void {
    if (!this.lastHoveredSeekableBlock) return;
    const block = this.lastHoveredSeekableBlock;
    block.style.removeProperty('opacity');
    block.style.removeProperty('width');
    block.style.removeProperty('box-shadow');
    block.style.removeProperty('border-radius');
    this.lastHoveredSeekableBlock = null;
    this.refreshSpotlightForBlock(block);
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
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('reset') === '1') {
        this.resetToInitialState();
        this.router.navigate(['/music-academy/recording'], { replaceUrl: true });
      }
    });

    const audioId = this.route.snapshot.queryParamMap.get('audioId');
    const folderIds = this.route.snapshot.queryParamMap.get('folderIds');
    const hasState = !!this.backingAudioUrl();
    const reset = this.route.snapshot.queryParamMap.get('reset');
    if (reset === '1') return;

    if (!hasState && audioId && folderIds) {
      this.tryRestoreFromUrl(audioId, folderIds);
      return;
    }

    this.loadMapAndSyncFromCurrentUrls();
  }

  /** Volta ao estado inicial (dropzone) quando o usuário clica em "Gravação" no menu já estando na página. */
  private resetToInitialState(): void {
    this.stopRecording();
    this.clearBackingTrack();
    this.recordedBlob.set(null);
    const recordedUrl = this.recordedUrl();
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      this.recordedUrl.set(null);
    }
    const mapUrl = this.mapBacksUrl();
    if (mapUrl) {
      URL.revokeObjectURL(mapUrl);
    }
    const syncUrl = this.syncMapUrl();
    if (syncUrl) URL.revokeObjectURL(syncUrl);
    this.mapBacksUrl.set(null);
    this.mapBacksFileName.set('');
    this.mapBacksMimeType.set('');
    this.mapBacksHtml.set(null);
    this.mapBacksText.set(null);
    this.syncMapUrl.set(null);
    this.syncPoints.set([]);
    this.syncEditorContext.set(null);
    this.restoreError.set(null);
    this.restoringFromUrl.set(false);
    this.enumeratedForHtml = null;
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
            this.mapBacksHtml.set(normalizeDocHtml(t));
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

  /** true quando a URL tem audioId e folderIds, permitindo "Conectar de novo" e manter a página. */
  canRetryRestoreWithLogin(): boolean {
    const audioId = this.route.snapshot.queryParamMap.get('audioId');
    const folderIds = this.route.snapshot.queryParamMap.get('folderIds');
    return !!(audioId && folderIds);
  }

  /** Refaz login no Drive e tenta restaurar o contexto na mesma página (sem ir para o Kit Ensaio). */
  async retryRestoreWithNewLogin(): Promise<void> {
    const audioId = this.route.snapshot.queryParamMap.get('audioId');
    const folderIds = this.route.snapshot.queryParamMap.get('folderIds');
    if (!audioId || !folderIds) return;
    this.reconnectInProgress.set(true);
    this.restoreError.set(null);
    try {
      await requestDriveToken();
      this.tryRestoreFromUrl(audioId, folderIds);
    } catch (err) {
      this.restoreError.set((err as Error)?.message ?? 'Não foi possível conectar.');
    } finally {
      this.reconnectInProgress.set(false);
    }
  }

  /** Restaura áudio + mapa + sync do Drive usando queryParams (após F5). Permissão e contexto em paralelo. */
  private tryRestoreFromUrl(audioId: string, folderIds: string): void {
    const token = getDriveTokenFromCache();
    if (!token) {
      this.restoreError.set('Sessão do Drive expirada. Abra pelo Kit Ensaio e conecte de novo.');
      return;
    }
    this.restoringFromUrl.set(true);
    this.restoreError.set(null);
    const contextPromise = loadRecordingContextFromDrive(token, audioId, folderIds);
    const permissionPromise = this.permissionService.checkWritePermission(token, KIT_ENSAIO_FOLDER_ID);
    Promise.all([contextPromise, permissionPromise])
      .then(([ctx]) => {
        this.backingAudioUrl.set(ctx.backingAudioUrl);
        this.fileName.set(ctx.fileName);
        this.mapBacksUrl.set(ctx.mapBacksUrl);
        this.mapBacksFileName.set(ctx.mapBacksFileName);
        this.mapBacksMimeType.set(ctx.mapBacksMimeType);
        this.syncMapUrl.set(ctx.syncMapUrl);
        const ids = folderIds.split(',').map((id) => id.trim()).filter(Boolean);
        this.syncEditorContext.set({
          driveFolderId: ids[1] ?? ids[0],
          driveAccessToken: token,
        });
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
    const count = enumerateMapBlocks(content);
    this.enumeratedForHtml = html;
    this.enumeratedBlocksCount.set(count);
    // Aplica seekable logo após enumerar blocos para o hover (cursor pointer) funcionar antes de qualquer clique.
    this.applySeekableToBlocks(content);
  }

  /** Marca blocos que têm sync point como clicáveis; cursor via JS para vencer estilos do Docs/innerHTML. */
  private applySeekableToBlocks(content: ParentNode): void {
    const blocks = content.querySelectorAll<HTMLElement>('[data-block-index]');
    const points = this.syncPoints();
    blocks.forEach((el) => {
      const idx = Number(el.dataset['blockIndex']);
      const hasSyncPoint = Number.isInteger(idx) && points.some((p) => p.blockIndex === idx);
      if (hasSyncPoint) {
        el.classList.add('seekable');
        el.style.setProperty('cursor', 'pointer', 'important');
      } else {
        el.classList.remove('seekable');
        el.style.removeProperty('cursor');
      }
    });
  }

  /** Arquivo de áudio enviado (backing track) */
  audioFile = signal<File | null>(null);
  /** URL do áudio para reprodução */
  backingAudioUrl = signal<string | null>(null);
  /** Nome do arquivo para exibição */
  fileName = signal<string>('');
  /** true apenas quando o áudio foi carregado pelo usuário (dropzone/input); false quando veio do Drive/Kit Ensaio. */
  backingLoadedByUser = signal(false);

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
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
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
    this.backingLoadedByUser.set(true);
  }

  private clearBackingTrack() {
    const url = this.backingAudioUrl();
    if (url) URL.revokeObjectURL(url);
    this.backingAudioUrl.set(null);
    this.audioFile.set(null);
    this.fileName.set('');
    this.backingCurrentTime.set(0);
    this.backingLoadedByUser.set(false);
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
    window.open(
      'https://wa.me/?text=' + encodeURIComponent('Minha gravação do Music Academy. Baixe o áudio pelo botão "Download" na página.'),
      '_blank',
    );
  }

  /** Exposto para o template: só mostrar botão "Editar sync map" para quem pode acessar o Sync Editor. */
  readonly canShowSyncEditorButton = computed(
    () => this.permissionService.canWriteToKitEnsaio() === true && this.hasBackingTrack() && this.hasMapBacks()
  );

  /** Navega para o Editor de Sincronia com a música atual (áudio + mapa + contexto Drive se houver). */
  goToSyncEditor(): void {
    const backingUrl = this.backingAudioUrl();
    const mapUrl = this.mapBacksUrl();
    if (!backingUrl || !mapUrl) return;
    this.syncEditorNav.skipRevokeBlobUrls.set(true);
    const ctx = this.syncEditorContext();
    const audioId = this.route.snapshot.queryParamMap.get('audioId');
    const folderIdsParam = this.route.snapshot.queryParamMap.get('folderIds');
    const queryParams =
      audioId && folderIdsParam ? { audioId, folderIds: folderIdsParam } : undefined;
    // Se não temos contexto Drive (ex.: veio do Kit Ensaio "Usar na gravação" sem driveFolderId no state),
    // derivamos da URL para o Sync Editor poder mostrar "Salvar no Drive".
    const driveFolderId =
      ctx?.driveFolderId ??
      (queryParams && folderIdsParam
        ? (() => {
            const ids = folderIdsParam.split(',').map((id) => id.trim()).filter(Boolean);
            return ids[1] ?? ids[0] ?? undefined;
          })()
        : undefined);
    const driveAccessToken =
      ctx?.driveAccessToken ?? (queryParams ? getDriveTokenFromCache() ?? undefined : undefined);
    this.router.navigate(['/music-academy/sync-editor'], {
      queryParams,
      state: {
        backingAudioUrl: backingUrl,
        fileName: this.fileName(),
        mapBacksUrl: mapUrl,
        mapBacksFileName: this.mapBacksFileName(),
        mapBacksMimeType: this.mapBacksMimeType(),
        syncMapUrl: this.syncMapUrl() ?? undefined,
        driveFolderId,
        driveAccessToken,
      } as RecordingState,
    });
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
    const skipRevoke = this.syncEditorNav.skipRevokeBlobUrls();
    if (skipRevoke) {
      this.syncEditorNav.skipRevokeBlobUrls.set(false);
    }
    if (!skipRevoke) {
      this.clearBackingTrack();
      const mapUrl = this.mapBacksUrl();
      if (mapUrl) URL.revokeObjectURL(mapUrl);
      const syncUrl = this.syncMapUrl();
      if (syncUrl) URL.revokeObjectURL(syncUrl);
    }
    const url = this.recordedUrl();
    if (url) URL.revokeObjectURL(url);
  }
}
