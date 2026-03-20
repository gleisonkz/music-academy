import { Route } from '@angular/router';

export const APP_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: async () =>
      (await import('./domain/musix-studio/pages/landing-page')).LandingPageComponent,
  },
  {
    path: 'privacy-policy',
    loadComponent: async () =>
      (await import('./domain/musix-studio/pages/privacy-policy')).PrivacyPolicyPage,
  },
  {
    path: 'terms-of-service',
    loadComponent: async () =>
      (await import('./domain/musix-studio/pages/terms-of-service')).TermsOfServicePage,
  },
  {
    path: 'login',
    loadComponent: async () =>
      (await import('./domain/musix-studio/pages/login')).LoginPage,
  },
  {
    path: 'musix-studio',
    loadChildren: async () => (await import('./domain/musix-studio/musix-studio.routes')).MUSIX_STUDIO_ROUTES,
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
