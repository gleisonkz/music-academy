/** Chave do localStorage onde o Kit Ensaio guarda o token do Drive (para Gravação/Editor recarregarem após F5). */
export const DRIVE_TOKEN_STORAGE_KEY = 'music-academy-drive-token';

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

/** Client ID OAuth 2.0 (Google Cloud Console). Usado para "Conectar de novo" fora do Kit Ensaio. */
const GOOGLE_CLIENT_ID = '216430399393-s4bsm8fiti6978mm4elmmkphh6npa30q.apps.googleusercontent.com';

export interface CachedDriveToken {
  token: string;
  expiresAt: number;
}

/** Lê o token do Drive do cache (retorna null se expirado ou inexistente). */
export function getDriveTokenFromCache(): string | null {
  try {
    const raw = localStorage.getItem(DRIVE_TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedDriveToken;
    if (!data?.token || typeof data.expiresAt !== 'number') return null;
    if (Date.now() >= data.expiresAt) return null;
    return data.token;
  } catch {
    return null;
  }
}

/** Grava o token no cache (para uso após requestDriveToken). */
export function saveDriveTokenToCache(token: string): void {
  try {
    const data: CachedDriveToken = { token, expiresAt: Date.now() + TOKEN_EXPIRY_MS };
    localStorage.setItem(DRIVE_TOKEN_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Abre o fluxo de login do Google Drive e retorna o token quando o usuário autorizar.
 * Permite refazer login na Gravação/Editor sem sair da página.
 * Rejeita se o script do Google não estiver carregado ou o usuário cancelar/erro.
 */
export function requestDriveToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const g = (globalThis as unknown as { google?: { accounts: { oauth2: { initTokenClient: (config: {
      client_id: string;
      scope: string;
      callback: (resp: { access_token?: string; error?: string }) => void;
    }) => { requestAccessToken: (opts?: unknown) => void } } } } }).google;
    if (!g?.accounts?.oauth2?.initTokenClient) {
      reject(new Error('Script do Google não carregou. Recarregue a página.'));
      return;
    }
    const client = g.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
      callback: (response: { access_token?: string; error?: string }) => {
        if (response.error) {
          reject(new Error(response.error ?? 'Erro ao conectar'));
          return;
        }
        if (response.access_token) {
          saveDriveTokenToCache(response.access_token);
          resolve(response.access_token);
        } else {
          reject(new Error('Nenhum token retornado'));
        }
      },
    });
    client.requestAccessToken();
  });
}
