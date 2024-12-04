import { Route } from '@angular/router';

export const BACKING_PRACTICE_ROUTES: Route[] = [
  {
    path: '',
    redirectTo: 'songs',
    pathMatch: 'full',
  },
  {
    path: 'songs',
    loadComponent: async () => (await import('./pages/songs/songs.page')).SongsPage,
  },
  {
    path: 'songs/detail/:id',
    loadComponent: async () => (await import('./pages/song-detail/song-detail.page')).SongDetailPage,
  },
];
