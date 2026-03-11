import { CommonModule } from '@angular/common';
import { Component, inject, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { getDriveTokenFromCache, requestDriveToken } from '../../shared/drive-token';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly ngZone = inject(NgZone);

  loading = false;
  error: string | null = null;
  readonly year = new Date().getFullYear();

  ngOnInit(): void {
    if (getDriveTokenFromCache()) {
      this.navigateToReturnUrl();
    }
  }

  async signInWithGoogle(): Promise<void> {
    this.error = null;
    this.loading = true;
    try {
      await requestDriveToken();
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
