import { Route } from '@angular/router';

export const APP_ROUTES: Route[] = [
  {
    path: '',
    redirectTo: 'music-academy/dashboard',
    pathMatch: 'full',
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
