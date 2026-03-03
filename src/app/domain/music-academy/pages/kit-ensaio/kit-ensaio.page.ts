import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

/** Client ID do OAuth 2.0 (Google Cloud Console > APIs & Services > Credentials). */
const GOOGLE_CLIENT_ID = '216430399393-s4bsm8fiti6978mm4elmmkphh6npa30q.apps.googleusercontent.com';

const DRIVE_TOKEN_STORAGE_KEY = 'music-academy-drive-token';
/** Token do Google expira em 1h; guardamos 55 min para renovar antes. */
const TOKEN_EXPIRY_MS = 55 * 60 * 1000;

/** Pasta pública do Kit Ensaio (qualquer um com o link pode ver). */
export const KIT_ENSAIO_FOLDER_ID = '1K8URtmzX0MOWtEcB_NSzBhcqNzFVBy83';
export const KIT_ENSAIO_FOLDER_URL = `https://drive.google.com/drive/folders/${KIT_ENSAIO_FOLDER_ID}`;

const FOLDER_MIME = 'application/vnd.google-apps.folder';

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

@Component({
  selector: 'app-kit-ensaio-page',
  standalone: true,
  imports: [ZardSharedModule, CommonModule],
  templateUrl: './kit-ensaio.page.html',
  styleUrls: ['./kit-ensaio.page.scss'],
})
export class KitEnsaioPage implements OnInit {
  private readonly router = inject(Router);

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

  private accessToken: string | null = null;

  get hasClientId(): boolean {
    return !!GOOGLE_CLIENT_ID;
  }

  ngOnInit(): void {
    if (!GOOGLE_CLIENT_ID) return;
    const cached = this.loadTokenFromCache();
    if (cached) {
      this.accessToken = cached;
      this.isConnected.set(true);
      this.error.set(null);
      this.listFolders();
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
      scope: 'https://www.googleapis.com/auth/drive.readonly',
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

  /** Lista pastas e arquivos dentro da pasta (multinível). */
  listContents(folderId: string, folderName: string): void {
    this.error.set(null);
    this.isLoading.set(true);
    const url = `https://www.googleapis.com/drive/v3/files?q='${encodeURIComponent(folderId)}'+in+parents&fields=files(id,name,webViewLink,mimeType)&orderBy=name`;
    this.apiFetch<{ files?: DriveItem[] }>(url)
      .then((data) => {
        const files = data.files || [];
        const sorted = [...files].sort((a, b) => {
          const aFolder = a.mimeType === FOLDER_MIME ? 0 : 1;
          const bFolder = b.mimeType === FOLDER_MIME ? 0 : 1;
          if (aFolder !== bFolder) return aFolder - bFolder;
          return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
        });
        this.currentItems.set(sorted);
        this.isLoading.set(false);
      })
      .catch((err) => {
        this.error.set(err?.message || 'Falha ao listar conteúdo.');
        this.isLoading.set(false);
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

  isDriveFolder(item: DriveItem): boolean {
    return item.mimeType === FOLDER_MIME;
  }

  /** Retorna true se o item for reconhecido como áudio (para mostrar botão "Usar na gravação"). */
  isAudioItem(item: DriveItem): boolean {
    return this.getFileIcon(item) === 'music_note';
  }

  /** Baixa o áudio do Drive e navega para Gravação já com esse arquivo como áudio de apoio. */
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
      this.router.navigate(['/music-academy/recording'], {
        state: { backingAudioUrl: objectUrl, fileName: item.name },
      });
    } catch (err) {
      this.error.set((err as Error)?.message ?? 'Não foi possível carregar o áudio para a gravação.');
    } finally {
      this.loadingForRecording.set(null);
    }
  }

  /** Ícone do Material Icons conforme tipo do arquivo (mimeType ou extensão). */
  getFileIcon(item: DriveItem): string {
    const mime = (item.mimeType || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac|wma)(\?|$)/i.test(name)) return 'music_note';
    if (mime.startsWith('video/') || /\.(mp4|webm|mkv|avi|mov)(\?|$)/i.test(name)) return 'videocam';
    if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'picture_as_pdf';
    if (mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(name)) return 'image';
    if (mime.startsWith('text/') || mime.includes('google-apps.document') || /\.(txt|md|csv)(\?|$)/i.test(name)) return 'text_snippet';
    if (mime.includes('spreadsheet') || /\.(xls|xlsx)(\?|$)/i.test(name)) return 'table_chart';
    if (mime.includes('presentation') || /\.(ppt|pptx)(\?|$)/i.test(name)) return 'slideshow';
    return 'description';
  }

  /** Classe CSS para cor do ícone por tipo (opcional). */
  getFileIconClass(item: DriveItem): string {
    const icon = this.getFileIcon(item);
    if (icon === 'music_note') return 'file-audio';
    if (icon === 'videocam') return 'file-video';
    if (icon === 'picture_as_pdf') return 'file-pdf';
    if (icon === 'text_snippet') return 'file-text';
    if (icon === 'image') return 'file-image';
    return 'file-default';
  }
}
