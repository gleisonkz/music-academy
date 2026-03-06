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
import { Router } from '@angular/router';

import { enumerateMapBlocks, normalizeDocHtml } from '../../shared/map-backs-doc';
import { SyncPointsListComponent } from '../../components/sync-points-list';
import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';
import { TrackAudioPlayerComponent } from '../../components/track-audio-player/track-audio-player.component';
import type { RecordingState } from '../recording/recording.page';

export interface SyncPoint {
  time: number;
  blockIndex: number;
  /** Texto do parágrafo clicado (para exibir na lista em vez de "bloco N"). */
  label?: string;
}

@Component({
  selector: 'app-sync-editor-page',
  standalone: true,
  imports: [ZardSharedModule, CommonModule, TrackAudioPlayerComponent, SyncPointsListComponent],
  templateUrl: './sync-editor.page.html',
  styleUrls: ['./sync-editor.page.scss'],
})
export class SyncEditorPage implements OnInit, AfterViewChecked {
  private readonly mapContainerRef = viewChild<ElementRef<HTMLElement>>('mapContainer');
  private readonly backingPlayerRef = viewChild<TrackAudioPlayerComponent>('backingPlayer');
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);

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
  }

  ngOnInit(): void {
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
    const indexStr = el.dataset['blockIndex'];
    if (indexStr == null) return;
    const blockIndex = Number.parseInt(indexStr, 10);
    if (!Number.isFinite(blockIndex)) return;
    const time = this.backingPlayerRef()?.currentTime() ?? 0;
    const rawLabel = el.textContent?.trim() ?? '';
    const label = rawLabel.length > 300 ? rawLabel.slice(0, 300) : rawLabel;
    this.addSyncPoint({ time, blockIndex, label: label || undefined });
  }

  /** Aplica destaque no hover com !important para vencer estilos inline do Google Docs. */
  onMapMouseOver(event: MouseEvent): void {
    this.clearAllHoverStyles();
    const el = (event.target as HTMLElement).closest('[data-block-index]') as HTMLElement | null;
    const container = this.mapContainerRef()?.nativeElement;
    if (container) container.style.cursor = el ? 'pointer' : 'default';
    if (el) this.applyHoverStyles(el);
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

  addSyncPoint(point: SyncPoint): void {
    const current = this.syncPoints();
    const withoutSameTime = current.filter((p) => p.time !== point.time);
    const list = [...withoutSameTime, point].sort((a, b) => a.time - b.time);
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
}
