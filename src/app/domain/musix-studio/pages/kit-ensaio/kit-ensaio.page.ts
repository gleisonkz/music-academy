import { KitEnsaioPermissionService } from 'src/app/shared/services/kit-ensaio-permission.service';
import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';

import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { DriveFileIconClassPipe, DriveFileIconPipe, getDriveFileIcon } from './drive-file-icon.pipe';

/** Client ID do OAuth 2.0 (Google Cloud Console > APIs & Services > Credentials). */
const GOOGLE_CLIENT_ID = '216430399393-s4bsm8fiti6978mm4elmmkphh6npa30q.apps.googleusercontent.com';

const DRIVE_TOKEN_STORAGE_KEY = 'musix-studio-drive-token';
const KIT_ENSAIO_VIEW_KEY = 'musix-studio-kit-ensaio-view';
const LAST_USED_AUDIO_KEY = 'musix-studio-kit-ensaio-last-used-audio';
/** Tempo que mantemos o token em cache no localStorage (1 dia). */
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export interface LastUsedAudio {
  itemId: string;
  itemName: string;
  breadcrumb: { id: string; name: string }[];
}

/** Pasta pública do Kit Ensaio (qualquer um com o link pode ver). */
export const KIT_ENSAIO_FOLDER_ID = '1K8URtmzX0MOWtEcB_NSzBhcqNzFVBy83';
export const KIT_ENSAIO_FOLDER_URL = `https://drive.google.com/drive/folders/${KIT_ENSAIO_FOLDER_ID}`;

const FOLDER_MIME = 'application/vnd.google-apps.folder';
const GOOGLE_DOCS_MIME = 'application/vnd.google-apps.document';
/** Nome do arquivo de mapa de backs — busca case-insensitive. */
const MAPA_BACKS_NAME = 'MAPA BACKS';
/** Parte do nome para buscar JSON de sincronia do mapa (ex.: sync-map-1772755577509.json). */
const SYNC_MAP_NAME_PART = 'sync-map';

export interface DriveFolder {
  id: string;
  name: string;
  webViewLink: string;
}

export interface DriveItem {
  id: string;
  name: string;
  webViewLink: string;
  mimeType: string;
}

const DRIVE_WRITE_ROLES = new Set(['owner', 'organizer', 'fileOrganizer', 'writer']);

/** Normaliza string para busca: minúsculas e sem acentos (ex.: "Incêndia" → "incendia"). */
function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mark}/gu, '');
}

@Component({
  selector: 'app-kit-ensaio-page',
  standalone: true,
  imports: [ZardSharedModule, CommonModule, DriveFileIconPipe, DriveFileIconClassPipe],
  templateUrl: './kit-ensaio.page.html',
  styleUrls: ['./kit-ensaio.page.scss'],
})
export class KitEnsaioPage implements OnInit {
  private readonly router = inject(Router);
  private readonly permissionService = inject(KitEnsaioPermissionService);

  readonly isConnected = signal(false);
  readonly isConnecting = signal(false);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly folders = signal<DriveFolder[]>([]);
  /** Navegação multinível: conteúdo da pasta atual (pastas + arquivos). */
  readonly currentItems = signal<DriveItem[]>([]);
  /** Breadcrumb: [{ id, name }] da pasta raiz até a atual. */
  readonly breadcrumb = signal<{ id: string; name: string }[]>([]);
  /** ID do arquivo sendo carregado para "Usar na gravação" (evita cliques duplos). */
  readonly loadingForRecording = signal<string | null>(null);
  /** ID do arquivo sendo carregado para "Editor de Sincronia". */
  readonly loadingForSyncEditor = signal<string | null>(null);
  /** true enquanto carrega "Abrir último na gravação". */
  readonly loadingLastUsed = signal(false);
  /** Último áudio usado (gravação ou editor), lido do localStorage. */
  readonly lastUsedAudio = signal<LastUsedAudio | null>(null);
  /** Filtro de pesquisa (só no primeiro nível). */
  readonly searchFilter = signal('');
  /** Visualização: lista ou grade (só afeta desktop; preferência salva no localStorage). */
  readonly viewMode = signal<'list' | 'grid'>('grid');
  /** Se na pasta atual (ou acima) existe um sync map; null = ainda verificando. */
  readonly hasSyncMapInContext = signal<boolean | null>(null);

  readonly isFirstLevel = computed(() => this.breadcrumb().length === 1);

  /** Itens da pasta atual; no primeiro nível, filtrados pela pesquisa (com normalização de acentos). */
  readonly filteredItems = computed(() => {
    const items = this.currentItems();
    if (!this.isFirstLevel()) return items;
    const q = (this.searchFilter() || '').trim();
    if (!q) return items;
    const qNorm = normalizeForSearch(q);
    return items.filter((item) =>
      normalizeForSearch(item.name || '').includes(qNorm)
    );
  });

  /** Exposto para o template: só mostrar Criar/Editar Sync Map quando true. */
  readonly canWriteToKitEnsaio = this.permissionService.canWriteToKitEnsaio;

  private accessToken: string | null = null;

  get hasClientId(): boolean {
    return !!GOOGLE_CLIENT_ID;
  }

  ngOnInit(): void {
    this.loadViewPreference();
    if (!GOOGLE_CLIENT_ID) return;
    const cached = this.loadTokenFromCache();
    if (cached) {
      this.accessToken = cached;
      this.isConnected.set(true);
      this.error.set(null);
      this.listFolders();
      this.loadLastUsedFromStorage();
      this.checkDriveWritePermission();
      return;
    }
    this.tryConnectGoogle();
  }

  private loadTokenFromCache(): string | null {
    try {
      const raw = localStorage.getItem(DRIVE_TOKEN_STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as { token: string; expiresAt: number };
      if (!data.token || typeof data.expiresAt !== 'number') return null;
      if (Date.now() >= data.expiresAt) {
        localStorage.removeItem(DRIVE_TOKEN_STORAGE_KEY);
        return null;
      }
      return data.token;
    } catch {
      return null;
    }
  }

  private saveTokenToCache(token: string): void {
    try {
      const data = { token, expiresAt: Date.now() + TOKEN_EXPIRY_MS };
      localStorage.setItem(DRIVE_TOKEN_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
  }

  private clearTokenCache(): void {
    try {
      localStorage.removeItem(DRIVE_TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Verifica se o usuário logado tem permissão de escrita na pasta do Kit Ensaio (Drive API).
   * Atualiza KitEnsaioPermissionService para menu e botões Criar/Editar Sync Map.
   */
  private checkDriveWritePermission(): void {
    if (!this.accessToken) {
      this.permissionService.setCanWrite(false);
      return;
    }
    const aboutUrl = 'https://www.googleapis.com/drive/v3/about?fields=user';
    this.apiFetch<{ user?: { emailAddress?: string } }>(aboutUrl)
      .then((about) => {
        const email = (about.user?.emailAddress ?? '').trim().toLowerCase();
        if (!email) {
          this.permissionService.setCanWrite(false);
          return;
        }
        const permUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(KIT_ENSAIO_FOLDER_ID)}?fields=permissions`;
        return this.apiFetch<{ permissions?: { type: string; role: string; emailAddress?: string }[] }>(permUrl).then(
          (file) => {
            const perms = file.permissions ?? [];
            const canWrite = perms.some(
              (p) =>
                p.type === 'user' &&
                (p.emailAddress ?? '').toLowerCase() === email &&
                DRIVE_WRITE_ROLES.has((p.role ?? '').toLowerCase())
            );
            this.permissionService.setCanWrite(canWrite);
          }
        );
      })
      .catch(() => this.permissionService.setCanWrite(false));
  }

  private loadViewPreference(): void {
    try {
      const saved = localStorage.getItem(KIT_ENSAIO_VIEW_KEY);
      if (saved === 'list' || saved === 'grid') this.viewMode.set(saved);
    } catch {
      // ignore
    }
  }

  setViewMode(mode: 'list' | 'grid'): void {
    this.viewMode.set(mode);
    try {
      localStorage.setItem(KIT_ENSAIO_VIEW_KEY, mode);
    } catch {
      // ignore
    }
  }

  tryConnectGoogle(): void {
    this.error.set(null);
    this.isConnecting.set(true);
    const g = (globalThis as unknown as { google?: { accounts: { oauth2: { initTokenClient: (config: { client_id: string; scope: string; callback: (resp: { access_token?: string; error?: string }) => void }) => { requestAccessToken: (opts?: unknown) => void } } } } }).google;
    if (!g?.accounts?.oauth2?.initTokenClient) {
      this.error.set('Script do Google não carregou. Recarregue a página.');
      this.isConnecting.set(false);
      return;
    }
    const client = g.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
      callback: (response: { access_token?: string; error?: string }) => {
        this.isConnecting.set(false);
        if (response.error) {
          this.error.set(response.error);
          return;
        }
        if (response.access_token) {
          this.accessToken = response.access_token;
          this.saveTokenToCache(response.access_token);
          this.isConnected.set(true);
          this.error.set(null);
          this.listFolders();
          this.loadLastUsedFromStorage();
          this.checkDriveWritePermission();
        }
      },
    });
    client.requestAccessToken();
  }

  private apiFetch<T>(url: string): Promise<T> {
    return fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    }).then((res) => {
      if (res.status === 401) {
        this.clearTokenCache();
        this.accessToken = null;
        this.isConnected.set(false);
        this.permissionService.setCanWrite(false);
        this.error.set('Sessão expirada. Recarregue a página para conectar de novo.');
      }
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
      return res.json() as Promise<T>;
    });
  }

  private getFolderName(folderId: string): Promise<string> {
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}?fields=name`;
    return this.apiFetch<{ name: string }>(url).then((d) => d.name || 'Pasta');
  }

  /** Lista pastas e arquivos dentro da pasta (multinível), com paginação para carregar todos os itens. */
  listContents(folderId: string, folderName: string): void {
    this.error.set(null);
    this.isLoading.set(true);
    this.hasSyncMapInContext.set(null);
    const baseUrl = `https://www.googleapis.com/drive/v3/files?q='${encodeURIComponent(folderId)}'+in+parents+and+trashed=false&fields=files(id,name,webViewLink,mimeType),nextPageToken&orderBy=name&pageSize=100`;
    const fetchPage = (pageToken?: string): Promise<{ files: DriveItem[]; nextPageToken?: string }> => {
      const url = pageToken ? `${baseUrl}&pageToken=${encodeURIComponent(pageToken)}` : baseUrl;
      return this.apiFetch<{ files?: DriveItem[]; nextPageToken?: string }>(url).then((data) => ({
        files: data.files || [],
        nextPageToken: data.nextPageToken,
      }));
    };
    const fetchAllPages = (acc: DriveItem[] = [], token?: string): Promise<DriveItem[]> =>
      fetchPage(token).then(({ files, nextPageToken }) => {
        const combined = [...acc, ...files];
        if (nextPageToken) return fetchAllPages(combined, nextPageToken);
        return combined;
      });
    fetchAllPages()
      .then((allFiles) => {
        const files = allFiles.filter((f) => !this.isSyncMapFile(f));
        const sorted = [...files].sort((a, b) => {
          const aFolder = a.mimeType === FOLDER_MIME ? 0 : 1;
          const bFolder = b.mimeType === FOLDER_MIME ? 0 : 1;
          if (aFolder !== bFolder) return aFolder - bFolder;
          return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
        });
        this.currentItems.set(sorted);
        const isRoot = this.breadcrumb().length === 1;
        const hasAudioInFolder = sorted.some((item) => this.isAudioItem(item));
        const canWrite = this.canWriteToKitEnsaio() === true;
        if (isRoot || !hasAudioInFolder || !canWrite) {
          this.hasSyncMapInContext.set(false);
          this.isLoading.set(false);
          return;
        }
        this.loadSyncMapRecursive()
          .then((s) => {
            this.hasSyncMapInContext.set(!!s);
            this.isLoading.set(false);
          })
          .catch(() => {
            this.hasSyncMapInContext.set(false);
            this.isLoading.set(false);
          });
      })
      .catch((err) => {
        this.error.set(err?.message || 'Falha ao listar conteúdo.');
        this.isLoading.set(false);
        this.hasSyncMapInContext.set(false);
      });
  }

  listFolders(): void {
    this.error.set(null);
    this.folders.set([]);
    this.currentItems.set([]);
    this.breadcrumb.set([]);
    const folderId = KIT_ENSAIO_FOLDER_ID;
    if (!this.accessToken) {
      this.error.set('Conecte com o Google primeiro.');
      return;
    }
    this.isLoading.set(true);
    this.getFolderName(folderId)
      .then((name) => {
        this.breadcrumb.set([{ id: folderId, name }]);
        this.listContents(folderId, name);
      })
      .catch((err) => {
        this.error.set(err?.message || 'Falha ao carregar pasta.');
        this.isLoading.set(false);
      });
  }

  /** Entra na pasta (multinível). */
  openFolder(item: DriveItem): void {
    if (item.mimeType !== FOLDER_MIME) return;
    const prev = this.breadcrumb();
    this.breadcrumb.set([...prev, { id: item.id, name: item.name }]);
    this.listContents(item.id, item.name);
  }

  /** Volta para um nível do breadcrumb. */
  navigateTo(index: number): void {
    const bc = this.breadcrumb();
    if (index < 0 || index >= bc.length) return;
    const slice = bc.slice(0, index + 1);
    const { id, name } = slice[slice.length - 1];
    this.breadcrumb.set(slice);
    this.listContents(id, name);
  }

  /** Atualiza o conteúdo da pasta atual (útil após apagar/alterar arquivos no Drive em outra aba). */
  refreshCurrentFolder(): void {
    const bc = this.breadcrumb();
    if (bc.length === 0) return;
    const { id, name } = bc[bc.length - 1];
    this.listContents(id, name);
  }

  isDriveFolder(item: DriveItem): boolean {
    return item.mimeType === FOLDER_MIME;
  }

  /** Verifica se o item é um arquivo de sync map (mesmo critério da busca recursiva). */
  private isSyncMapFile(item: DriveItem): boolean {
    const name = (item.name || '').toUpperCase();
    const mime = (item.mimeType || '').toLowerCase();
    return name.includes(SYNC_MAP_NAME_PART.toUpperCase()) && (name.endsWith('.JSON') || mime.includes('json'));
  }

  /** Retorna true se o item for reconhecido como áudio (para mostrar botão "Usar na gravação"). */
  isAudioItem(item: DriveItem): boolean {
    return getDriveFileIcon(item) === 'music_note';
  }

  private loadLastUsedFromStorage(): void {
    try {
      const raw = localStorage.getItem(LAST_USED_AUDIO_KEY);
      if (!raw) {
        this.lastUsedAudio.set(null);
        return;
      }
      const data = JSON.parse(raw) as LastUsedAudio;
      if (data?.itemId && data?.itemName && Array.isArray(data?.breadcrumb)) {
        this.lastUsedAudio.set(data);
      } else {
        this.lastUsedAudio.set(null);
      }
    } catch {
      this.lastUsedAudio.set(null);
    }
  }

  private saveLastUsedAudio(item: DriveItem): void {
    const bc = this.breadcrumb();
    if (bc.length < 1) return;
    try {
      const data: LastUsedAudio = {
        itemId: item.id,
        itemName: item.name,
        breadcrumb: bc.map((c) => ({ id: c.id, name: c.name })),
      };
      localStorage.setItem(LAST_USED_AUDIO_KEY, JSON.stringify(data));
      this.lastUsedAudio.set(data);
    } catch {
      // ignore
    }
  }

  /**
   * Busca o arquivo "MAPA BACKS" de forma recursiva: começa na pasta do áudio e sobe as pastas
   * até a raiz (nível da pasta da música / Kit Ensaio). Se não achar em nenhum nível, lança erro.
   * Google Docs é exportado como PDF para exibição.
   * @param bc breadcrumb a usar; se omitido, usa o da pasta atual.
   */
  private async loadMapBacksRecursive(bc?: { id: string; name: string }[]): Promise<{ url: string; fileName: string; mimeType: string }> {
    const breadcrumb = bc ?? this.breadcrumb();
    if (breadcrumb.length < 1 || !this.accessToken) {
      throw new Error('MAPA BACKS não encontrado: nenhuma pasta para buscar.');
    }
    const searchName = MAPA_BACKS_NAME.toUpperCase();
    for (let i = breadcrumb.length - 1; i >= 0; i--) {
      const folderId = breadcrumb[i].id;
      const listUrl = `https://www.googleapis.com/drive/v3/files?q='${encodeURIComponent(folderId)}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)`;
      const data = await this.apiFetch<{ files?: DriveItem[] }>(listUrl).catch(() => ({ files: [] }));
      const files = data.files || [];
      const mapBacks = files.find((f) => f.name?.toUpperCase().includes(searchName));
      if (!mapBacks) continue;

      const isGoogleDoc = (mapBacks.mimeType || '').includes(GOOGLE_DOCS_MIME);
      const downloadUrl = isGoogleDoc
        ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(mapBacks.id)}/export?mimeType=text%2Fhtml`
        : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(mapBacks.id)}?alt=media`;
      const res = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      if (!res.ok) throw new Error(`Erro ${res.status} ao baixar o MAPA BACKS.`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const mimeType = isGoogleDoc ? 'text/html' : (mapBacks.mimeType || '');
      return { url, fileName: mapBacks.name, mimeType };
    }
    throw new Error(
      'MAPA BACKS não encontrado. Coloque um arquivo com esse nome (ex.: no Google Docs) na pasta da música ou em alguma pasta acima.'
    );
  }

  /**
   * Busca recursiva por um arquivo cujo nome contenha "sync-map" (ex.: sync-map-1772755577509.json).
   * Percorre as mesmas pastas do breadcrumb (da pasta do áudio até a raiz). Retorna null se não achar.
   * @param bc breadcrumb a usar; se omitido, usa o da pasta atual.
   */
  private async loadSyncMapRecursive(bc?: { id: string; name: string }[]): Promise<{ url: string } | null> {
    const breadcrumb = bc ?? this.breadcrumb();
    if (breadcrumb.length < 1 || !this.accessToken) return null;
    const searchPart = SYNC_MAP_NAME_PART.toUpperCase();
    for (let i = breadcrumb.length - 1; i >= 0; i--) {
      const folderId = breadcrumb[i].id;
      const listUrl = `https://www.googleapis.com/drive/v3/files?q='${encodeURIComponent(folderId)}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)`;
      const data = await this.apiFetch<{ files?: DriveItem[] }>(listUrl).catch(() => ({ files: [] }));
      const files = data.files || [];
      const syncMapFile = files.find((f) => {
        const name = (f.name || '').toUpperCase();
        const mime = (f.mimeType || '').toLowerCase();
        return name.includes(searchPart) && (name.endsWith('.JSON') || mime.includes('json'));
      });
      if (!syncMapFile) continue;

      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(syncMapFile.id)}?alt=media`;
      const res = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      if (!res.ok) continue;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      return { url };
    }
    return null;
  }

  /** Baixa o áudio e o MAPA BACKS (busca recursiva) e navega para Gravação. Se o mapa não for encontrado, exibe erro e não navega. */
  async useInRecording(item: DriveItem): Promise<void> {
    if (!this.isAudioItem(item) || !this.accessToken) return;
    this.loadingForRecording.set(item.id);
    this.error.set(null);
    try {
      const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(item.id)}?alt=media`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      if (!res.ok) throw new Error(`Erro ${res.status} ao baixar o áudio.`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const mapBacks = await this.loadMapBacksRecursive();
      const syncMap = await this.loadSyncMapRecursive();

      this.saveLastUsedAudio(item);

      const bc = this.breadcrumb();
      const folderIds = bc.map((c) => c.id).join(',');
      this.router.navigate(['/recording'], {
        queryParams: { audioId: item.id, folderIds },
        state: {
          backingAudioUrl: objectUrl,
          fileName: item.name,
          mapBacksUrl: mapBacks.url,
          mapBacksFileName: mapBacks.fileName,
          mapBacksMimeType: mapBacks.mimeType,
          syncMapUrl: syncMap?.url,
        },
      });
    } catch (err) {
      this.error.set((err as Error)?.message ?? 'Não foi possível carregar para a gravação.');
    } finally {
      this.loadingForRecording.set(null);
    }
  }

  /** Carrega o último áudio usado (gravado no localStorage) e abre na Gravação. */
  async openLastUsedInRecording(): Promise<void> {
    const last = this.lastUsedAudio();
    if (!last || !this.accessToken) return;
    this.loadingLastUsed.set(true);
    this.error.set(null);
    try {
      const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(last.itemId)}?alt=media`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      if (!res.ok) throw new Error(`Erro ${res.status} ao baixar o áudio.`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const mapBacks = await this.loadMapBacksRecursive(last.breadcrumb);
      const syncMap = await this.loadSyncMapRecursive(last.breadcrumb);

      const folderIds = last.breadcrumb.map((c) => c.id).join(',');
      this.router.navigate(['/recording'], {
        queryParams: { audioId: last.itemId, folderIds },
        state: {
          backingAudioUrl: objectUrl,
          fileName: last.itemName,
          mapBacksUrl: mapBacks.url,
          mapBacksFileName: mapBacks.fileName,
          mapBacksMimeType: mapBacks.mimeType,
          syncMapUrl: syncMap?.url,
        },
      });
    } catch (err) {
      this.error.set((err as Error)?.message ?? 'Não foi possível carregar o último áudio.');
    } finally {
      this.loadingLastUsed.set(false);
    }
  }

  /** Carrega áudio + MAPA BACKS e navega para o Editor de Sincronia (mesmo state que Gravação). */
  async useInSyncEditor(item: DriveItem): Promise<void> {
    if (!this.isAudioItem(item) || !this.accessToken) return;
    this.loadingForSyncEditor.set(item.id);
    this.error.set(null);
    try {
      const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(item.id)}?alt=media`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      if (!res.ok) throw new Error(`Erro ${res.status} ao baixar o áudio.`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const mapBacks = await this.loadMapBacksRecursive();
      const syncMap = await this.loadSyncMapRecursive();

      this.saveLastUsedAudio(item);

      const bc = this.breadcrumb();
      // Raiz da música = 1 pasta abaixo de KIT ENSAIO (breadcrumb[0] = raiz, breadcrumb[1] = pasta da música)
      const musicRootFolderId = bc.length >= 2 ? bc[1].id : bc[0]?.id;
      const folderIds = bc.map((c) => c.id).join(',');

      this.router.navigate(['/sync-editor'], {
        queryParams: { audioId: item.id, folderIds },
        state: {
          backingAudioUrl: objectUrl,
          fileName: item.name,
          mapBacksUrl: mapBacks.url,
          mapBacksFileName: mapBacks.fileName,
          mapBacksMimeType: mapBacks.mimeType,
          syncMapUrl: syncMap?.url,
          driveFolderId: musicRootFolderId,
          driveAccessToken: this.accessToken ?? undefined,
        },
      });
    } catch (err) {
      this.error.set((err as Error)?.message ?? 'Não foi possível abrir o Editor de Sincronia.');
    } finally {
      this.loadingForSyncEditor.set(null);
    }
  }

}
