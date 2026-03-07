import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { getDriveTokenFromCache, requestDriveToken } from '../../shared/drive-token';
import { loadRecordingContextFromDrive } from '../../shared/load-recording-context';
import { enumerateMapBlocks, normalizeDocHtml } from '../../shared/map-backs-doc';
import { SyncPointsListComponent } from '../../components/sync-points-list';
import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';
import { TrackAudioPlayerComponent } from '../../components/track-audio-player/track-audio-player.component';
import type { RecordingState } from '../recording/recording.page';

/** Retorna o blockIndex ativo para o tempo t dado os pontos de sync (mesma lógica da Gravação). */
function getActiveBlockIndexFromTime(
  t: number,
  points: { time: number; blockIndex: number }[]
): number | null {
  if (points.length === 0) return null;
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].time <= t) return points[i].blockIndex;
  }
  return null;
}

const SPOTLIGHT_EXCLUSION_TERMS = [
  'UNÍSSONO PLENO',
  'UNÍSSONO OITAVADO',
  'ABERTO',
  'DOBRA DE NAIPES',
  'DOBRA DE NAIPE',
  'CONTRA-TEMPO',
];

function isExcludedFromSpotlight(blockText: string): boolean {
  const normalized = blockText.trim().toUpperCase();
  if (!normalized) return false;
  return SPOTLIGHT_EXCLUSION_TERMS.some((term) => normalized.includes(term));
}

const SECTION_HEADER_PATTERNS: RegExp[] = [
  /^Introdução\b/i,
  /^Interlúdio\b/i,
  /^Verso\s*\d/i,
  /^Refrão\b/i,
  /^Ponte\b/i,
  /^Coda\b/i,
  /^Preparação\b/i,
  /^Bridge\b/i,
  / - \(\dº?\s*vez\)/,
  / - \[\s*[\w\s]+\]$/,
];

function isSectionHeaderBlock(el: HTMLElement): boolean {
  const text = (el.textContent ?? '').trim();
  if (!text) return false;
  if (SECTION_HEADER_PATTERNS.some((p) => p.test(text))) return true;
  const isBold =
    el.querySelector('b, strong') != null ||
    (typeof getComputedStyle !== 'undefined' && Number.parseInt(getComputedStyle(el).fontWeight, 10) >= 600);
  return isBold && text.length < 100;
}

/** Títulos de seção que podem receber ponto de sync no Sync Editor (os demais não são clicáveis). */
const SYNC_ALLOWED_SECTION_HEADERS: RegExp[] = [/^Introdução\b/i, /^Interlúdio\b/i, /^Solo\b/i];

function isAllowedSectionHeaderForSync(text: string): boolean {
  const t = (text ?? '').trim();
  return t.length > 0 && SYNC_ALLOWED_SECTION_HEADERS.some((p) => p.test(t));
}

function buildSectionHeaderMap(blocks: NodeListOf<HTMLElement>): Map<number, number> {
  const map = new Map<number, number>();
  let lastSectionIdx: number | null = null;
  blocks.forEach((el, i) => {
    if (isSectionHeaderBlock(el)) lastSectionIdx = i;
    map.set(i, lastSectionIdx ?? i);
  });
  return map;
}

function applySpotlightToBlock(el: HTMLElement, isActive: boolean): void {
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

function clearSpotlightStyles(el: HTMLElement): void {
  el.classList.remove('active');
  el.style.removeProperty('opacity');
  el.style.removeProperty('filter');
  el.style.removeProperty('transition');
}

export interface SyncPoint {
  time: number;
  blockIndex: number;
  /** Texto do parágrafo clicado (para exibir na lista em vez de "bloco N"). */
  label?: string;
}

@Component({
  selector: 'app-sync-editor-page',
  standalone: true,
  imports: [ZardSharedModule, CommonModule, RouterLink, TrackAudioPlayerComponent, SyncPointsListComponent],
  templateUrl: './sync-editor.page.html',
  styleUrls: ['./sync-editor.page.scss'],
})
export class SyncEditorPage implements OnInit, AfterViewChecked {
  private readonly mapContainerRef = viewChild<ElementRef<HTMLElement>>('mapContainer');
  private readonly backingPlayerRef = viewChild<TrackAudioPlayerComponent>('backingPlayer');
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Mensagem de erro ao restaurar contexto da URL (ex.: token expirado). */
  restoreError = signal<string | null>(null);
  /** true enquanto restaura contexto do Drive após F5. */
  restoringFromUrl = signal(false);
  /** true enquanto refaz login do Drive para tentar restaurar na mesma página. */
  reconnectInProgress = signal(false);
  /** Tempo atual do áudio de apoio (para preview do spotlight). */
  backingCurrentTime = signal(0);
  /** Liga/desliga o preview do efeito spotlight ao dar play. */
  previewSpotlight = signal(false);

  /** State vindo do Kit Ensaio (mesmo que Gravação). */
  backingAudioUrl = signal<string | null>(null);
  fileName = signal<string>('');
  mapBacksUrl = signal<string | null>(null);
  mapBacksFileName = signal<string>('');
  mapBacksMimeType = signal<string>('');

  mapBacksHtml = signal<string | null>(null);
  mapBacksText = signal<string | null>(null);
  readonly mapBacksSafeHtml = computed(() => {
    const html = this.mapBacksHtml();
    return html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
  });
  readonly mapBacksIsHtml = computed(() => (this.mapBacksMimeType() || '').toLowerCase().includes('text/html'));
  readonly mapBacksIsText = computed(() => (this.mapBacksMimeType() || '').toLowerCase().includes('text/plain'));

  /** Lista de pontos de sincronia (time em segundos, blockIndex). */
  syncPoints = signal<SyncPoint[]>([]);
  private enumeratedForHtml: string | null = null;

  /** Pasta do Drive onde salvar o JSON (pasta da música); vindo do Kit Ensaio. */
  private readonly driveFolderId = signal<string | null>(null);
  private readonly driveAccessToken = signal<string | null>(null);
  /** URL do JSON de sync map existente (quando abre para editar). */
  private readonly syncMapUrl = signal<string | null>(null);
  readonly savingToDrive = signal(false);
  readonly driveSaveError = signal<string | null>(null);

  readonly hasBackingTrack = computed(() => !!this.backingAudioUrl());
  readonly hasMapBacks = computed(() => !!this.mapBacksUrl());
  readonly canEdit = computed(() => this.hasBackingTrack() && this.hasMapBacks() && this.mapBacksIsHtml());
  readonly canSaveToDrive = computed(
    () =>
      this.syncPoints().length > 0 &&
      !!this.driveFolderId() &&
      !!this.driveAccessToken()
  );

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
    if (state?.driveFolderId) this.driveFolderId.set(state.driveFolderId);
    if (state?.driveAccessToken) this.driveAccessToken.set(state.driveAccessToken);
    if (state?.syncMapUrl) this.syncMapUrl.set(state.syncMapUrl);

    effect(() => {
      const html = this.mapBacksHtml();
      if (html) {
        this.enumeratedForHtml = null;
        this.cdr.markForCheck();
      }
    });

    effect(() => {
      if (!this.previewSpotlight()) {
        const container = this.mapContainerRef()?.nativeElement;
        const content = container?.querySelector('.map-html-content');
        if (content) {
          content.querySelectorAll<HTMLElement>('[data-block-index]').forEach(clearSpotlightStyles);
        }
        return;
      }
      this.mapBacksHtml();
      const container = this.mapContainerRef()?.nativeElement;
      const content = container?.querySelector('.map-html-content');
      if (!content) return;
      const blocks = content.querySelectorAll<HTMLElement>('[data-block-index]');
      const activeIdx = getActiveBlockIndexFromTime(this.backingCurrentTime(), this.syncPoints());
      if (activeIdx === null) {
        blocks.forEach(clearSpotlightStyles);
        return;
      }
      const sectionMap = buildSectionHeaderMap(blocks);
      const activeSectionHeaderIdx = sectionMap.get(activeIdx) ?? null;
      blocks.forEach((el) => {
        const idx = Number(el.getAttribute('data-block-index'));
        const isExcluded = isExcludedFromSpotlight(el.textContent?.trim() ?? '');
        const isActive =
          isExcluded ||
          idx === activeIdx ||
          (activeSectionHeaderIdx !== null && idx === activeSectionHeaderIdx);
        applySpotlightToBlock(el, isActive);
      });
    });
  }

  onBackingTimeUpdate(t: number): void {
    this.backingCurrentTime.set(t);
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
        const ids = folderIds.split(',').map((id) => id.trim()).filter(Boolean);
        if (ids.length > 0) {
          // Mesma regra do Kit Ensaio: pasta da música = 1 nível abaixo de KIT ENSAIO (ids[1])
          const musicRootFolderId = ids.length >= 2 ? ids[1] : ids[0];
          this.driveFolderId.set(musicRootFolderId);
          this.driveAccessToken.set(token);
        }
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
    enumerateMapBlocks(content);
    this.enumeratedForHtml = html;
  }

  onMapClick(event: MouseEvent): void {
    const target = (event.target as HTMLElement).closest('[data-block-index]');
    if (!target) return;
    const el = target as HTMLElement;
    if (this.isBlockNonClickable(el)) return;
    const indexStr = el.dataset['blockIndex'];
    if (indexStr == null) return;
    const blockIndex = Number.parseInt(indexStr, 10);
    if (!Number.isFinite(blockIndex)) return;
    const time = this.backingPlayerRef()?.currentTime() ?? 0;
    const rawLabel = el.textContent?.trim() ?? '';
    const label = rawLabel.length > 300 ? rawLabel.slice(0, 300) : rawLabel;
    this.addSyncPoint({ time, blockIndex, label: label || undefined });
  }

  /** Aplica destaque no hover com !important para vencer estilos inline do Google Docs. Blocos excluídos não ficam clicáveis. */
  onMapMouseOver(event: MouseEvent): void {
    this.clearAllHoverStyles();
    const el = (event.target as HTMLElement).closest('[data-block-index]') as HTMLElement | null;
    const container = this.mapContainerRef()?.nativeElement;
    const clickable = el != null && !this.isBlockNonClickable(el);
    if (container) container.style.cursor = clickable ? 'pointer' : 'default';
    if (el && clickable) this.applyHoverStyles(el);
  }

  onMapMouseLeave(): void {
    const container = this.mapContainerRef()?.nativeElement;
    if (container) container.style.cursor = 'default';
    this.clearAllHoverStyles();
  }

  private applyHoverStyles(el: HTMLElement): void {
    el.dataset['hover'] = 'true';
    el.style.setProperty('background', 'rgba(0, 251, 251, 0.22)', 'important');
    el.style.setProperty('box-shadow', '0 2px 0 0 #00fbfb', 'important');
  }

  private clearAllHoverStyles(): void {
    const container = this.mapContainerRef()?.nativeElement;
    if (!container) return;
    container.querySelectorAll('[data-block-index][data-hover]').forEach((node) => {
      const el = node as HTMLElement;
      delete el.dataset['hover'];
      el.style.removeProperty('background');
      el.style.removeProperty('box-shadow');
    });
  }

  /** Blocos vazios, exclusão do spotlight e títulos de seção (exceto Introdução, Interlúdio, Solo) não recebem ponto de sync. */
  private isBlockNonClickable(el: HTMLElement): boolean {
    const text = el.textContent?.trim() ?? '';
    if (!text) return true;
    if (isExcludedFromSpotlight(text)) return true;
    if (isSectionHeaderBlock(el) && !isAllowedSectionHeaderForSync(text)) return true;
    return false;
  }

  /** Adiciona um ponto de sync. Se já existir um ponto com o mesmo blockIndex, ele é substituído pelo novo (evita duplicatas). */
  addSyncPoint(point: SyncPoint): void {
    const current = this.syncPoints();
    const withoutSameBlock = current.filter((p) => p.blockIndex !== point.blockIndex);
    const list = [...withoutSameBlock, point].sort((a, b) => a.time - b.time);
    this.syncPoints.set(list);
  }

  removeSyncPoint(index: number): void {
    const list = this.syncPoints().filter((_, i) => i !== index);
    this.syncPoints.set(list);
  }

  /** Baixa o JSON de sincronia como arquivo no computador do usuário (não depende de login). Pausa o áudio ao salvar. */
  saveJsonLocal(): void {
    this.backingPlayerRef()?.pause();
    const list = this.syncPoints();
    if (list.length === 0) return;
    const audioName = this.fileName() || 'audio';
    const baseName = audioName.replace(/\.[^.]+$/, '') || audioName;
    const fileName = `SYNC-MAP-${baseName}.json`;
    const json = JSON.stringify(list, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Salva o JSON de sincronia na raiz da música no Google Drive (quando aberto pelo Kit Ensaio). Atualiza arquivo existente com o mesmo nome, ou cria um novo. Pausa o áudio ao salvar. */
  async saveJsonToDrive(): Promise<void> {
    this.backingPlayerRef()?.pause();
    const folderId = this.driveFolderId();
    const token = this.driveAccessToken();
    const list = this.syncPoints();
    if (!folderId || !token || list.length === 0) return;
    this.savingToDrive.set(true);
    this.driveSaveError.set(null);
    const audioName = this.fileName() || 'audio';
    const baseName = audioName.replace(/\.[^.]+$/, '') || audioName;
    const fileName = `SYNC-MAP-${baseName}.json`;
    const json = JSON.stringify(list, null, 2);
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    try {
      const listUrl = `https://www.googleapis.com/drive/v3/files?q='${encodeURIComponent(folderId)}'+in+parents+and+trashed=false&fields=files(id,name)`;
      const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!listRes.ok) throw new Error(`Erro ${listRes.status} ao listar pasta.`);
      const listData = (await listRes.json()) as { files?: { id: string; name: string }[] };
      const existing = (listData.files ?? []).find((f) => f.name === fileName);
      const fileId = existing?.id;

      if (fileId) {
        const uploadRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`,
          { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: json }
        );
        if (!uploadRes.ok) throw new Error(`Erro ${uploadRes.status} ao atualizar o arquivo.`);
      } else {
        const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers,
          body: JSON.stringify({ name: fileName, parents: [folderId] }),
        });
        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({}));
          throw new Error((err as { error?: { message?: string } }).error?.message ?? `Erro ${createRes.status}`);
        }
        const created = (await createRes.json()) as { id: string };
        const uploadRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(created.id)}?uploadType=media`,
          { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: json }
        );
        if (!uploadRes.ok) throw new Error(`Erro ${uploadRes.status} ao enviar o conteúdo.`);
      }
    } catch (err) {
      this.driveSaveError.set((err as Error)?.message ?? 'Não foi possível salvar no Drive.');
    } finally {
      this.savingToDrive.set(false);
    }
  }

  /** Restaura os pontos de sincronia a partir de um arquivo JSON (ex.: o que foi salvo local). */
  async onLoadJsonFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as SyncPoint[];
      if (Array.isArray(parsed) && parsed.every((p) => typeof p?.time === 'number' && typeof p?.blockIndex === 'number')) {
        this.syncPoints.set([...parsed].sort((a, b) => a.time - b.time));
      }
    } catch {
      // ignore invalid JSON
    }
  }

  /** Move o áudio de apoio para o tempo indicado (clique na minutagem da lista). */
  seekBackingTo(time: number): void {
    this.backingPlayerRef()?.seekTo(time);
  }

  formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  goToKitEnsaio(): void {
    this.router.navigate(['/music-academy/kit-ensaio']);
  }

  /** Navega para a página de Gravação com o mesmo contexto (áudio, mapa, sync map) para continuar de lá. */
  goToRecording(): void {
    const backing = this.backingAudioUrl();
    const mapUrl = this.mapBacksUrl();
    const syncUrl = this.syncMapUrl();
    if (!backing || !mapUrl) return;
    const state: RecordingState = {
      backingAudioUrl: backing,
      fileName: this.fileName() || undefined,
      mapBacksUrl: mapUrl,
      mapBacksFileName: this.mapBacksFileName() || undefined,
      mapBacksMimeType: this.mapBacksMimeType() || undefined,
      syncMapUrl: syncUrl ?? undefined,
      driveFolderId: this.driveFolderId() ?? undefined,
      driveAccessToken: this.driveAccessToken() ?? undefined,
    };
    const queryParams = this.route.snapshot.queryParams as { audioId?: string; folderIds?: string };
    const extras: { state: RecordingState; queryParams?: Record<string, string> } = { state };
    if (queryParams.audioId && queryParams.folderIds) {
      extras.queryParams = { audioId: queryParams.audioId, folderIds: queryParams.folderIds };
    }
    this.router.navigate(['/music-academy/recording'], extras);
  }
}
