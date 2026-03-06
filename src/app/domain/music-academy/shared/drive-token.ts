/** Chave do localStorage onde o Kit Ensaio guarda o token do Drive (para Gravação/Editor recarregarem após F5). */
export const DRIVE_TOKEN_STORAGE_KEY = 'music-academy-drive-token';

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

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
