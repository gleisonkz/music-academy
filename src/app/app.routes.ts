import { Route } from '@angular/router';

export const APP_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: async () =>
      (await import('./domain/music-academy/pages/landing-page')).LandingPageComponent,
  },
  {
    path: 'privacy-policy',
    loadComponent: async () =>
      (await import('./domain/music-academy/pages/privacy-policy')).PrivacyPolicyPage,
  },
  {
    path: 'terms-of-service',
    loadComponent: async () =>
      (await import('./domain/music-academy/pages/terms-of-service')).TermsOfServicePage,
  },
  {
    path: 'login',
    loadComponent: async () =>
      (await import('./domain/music-academy/pages/login')).LoginPage,
  },
  {
    path: 'music-academy',
    loadChildren: async () => (await import('./domain/music-academy/music-academy.routes')).MUSIC_ACADEMY_ROUTES,
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
