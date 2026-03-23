import { Injectable, signal } from '@angular/core';
import { getDriveTokenFromCache } from 'src/app/domain/musix-studio/shared/drive-token';

const DRIVE_USER_EMAIL_STORAGE_KEY = 'musix-studio-drive-user-email';

@Injectable({ providedIn: 'root' })
export class DriveUserEmailService {
  readonly email = signal<string | null>(null);
  private readonly loading = signal(false);

  async ensureLoaded(forceRefresh = false): Promise<string | null> {
    if (!forceRefresh && this.email()) return this.email();

    if (!forceRefresh && !this.email()) {
      const cached = this.readCachedEmail();
      if (cached) {
        this.email.set(cached);
        return cached;
      }
    }

    if (this.loading()) return this.email();
    this.loading.set(true);
    try {
      const token = getDriveTokenFromCache();
      if (!token) return this.email();
      const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return this.email();
      const about = (await res.json()) as { user?: { emailAddress?: string } };
      const email = (about.user?.emailAddress ?? '').trim().toLowerCase();
      if (!email) return this.email();
      this.email.set(email);
      this.writeCachedEmail(email);
      return email;
    } catch {
      return this.email();
    } finally {
      this.loading.set(false);
    }
  }

  clearCached(): void {
    this.email.set(null);
    try {
      localStorage.removeItem(DRIVE_USER_EMAIL_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  private readCachedEmail(): string | null {
    try {
      const raw = localStorage.getItem(DRIVE_USER_EMAIL_STORAGE_KEY);
      const email = (raw ?? '').trim().toLowerCase();
      return email || null;
    } catch {
      return null;
    }
  }

  private writeCachedEmail(email: string): void {
    try {
      localStorage.setItem(DRIVE_USER_EMAIL_STORAGE_KEY, email);
    } catch {
      // ignore
    }
  }
}
