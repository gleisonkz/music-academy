import { CommonModule } from '@angular/common';
import { Component, inject, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { getDriveTokenFromCache, requestDriveToken } from '../../shared/drive-token';
import { DriveUserEmailService } from 'src/app/shared/services/drive-user-email.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly ngZone = inject(NgZone);
  private readonly driveUserEmailService = inject(DriveUserEmailService);

  loading = false;
  error: string | null = null;
  readonly year = new Date().getFullYear();

  ngOnInit(): void {
    if (getDriveTokenFromCache()) {
      void this.driveUserEmailService.ensureLoaded(true);
      this.navigateToReturnUrl();
    }
  }

  async signInWithGoogle(): Promise<void> {
    this.error = null;
    this.loading = true;
    try {
      await requestDriveToken();
      await this.driveUserEmailService.ensureLoaded(true);
      this.navigateToReturnUrl();
    } catch (err) {
      this.error = (err as Error)?.message ?? 'Não foi possível fazer login com o Google.';
    } finally {
      this.loading = false;
    }
  }

  private navigateToReturnUrl(): void {
    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') || '/';
    this.ngZone.run(() => {
      setTimeout(() => {
        this.router.navigateByUrl(returnUrl).then((ok) => {
          if (!ok) {
            this.router.navigate(['/']);
          }
        });
      }, 100);
    });
  }
}
