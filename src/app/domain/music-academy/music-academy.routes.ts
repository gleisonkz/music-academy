import { Route } from '@angular/router';

export const MUSIC_ACADEMY_ROUTES: Route[] = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: async () => (await import('./music-academy.component')).MusicAcademyComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: async () => (await import('./pages/dashboard/dashboard.component')).DashboardComponent,
      },
      {
        path: 'note-ear-training',
        loadComponent: async () => (await import('./pages/note-ear-training/note-ear-training.component')).NoteEarTrainingComponent,
      },
      {
        path: 'perfect-ear',
        loadComponent: async () => (await import('./pages/perfect-ear/perfect-ear.component')).PerfectEarComponent,
      },
      {
        path: 'cipher-notation',
        loadComponent: async () => (await import('./pages/cipher-notation/cipher-notation.page')).CipherNotationPage,
      },
      {
        path: 'metronome',
        loadComponent: async () => (await import('./pages/metronome/metronome.page')).MetronomePage,
      },
      {
        path: 'quizz',
        loadComponent: async () => (await import('./pages/quizz/quizz.page')).QuizzPage,
      },
      {
        path: 'backing-practice',
        loadChildren: async () => (await import('../../domain/backing-practice/backing-practice.routes')).BACKING_PRACTICE_ROUTES,
      },
    ],
  },
];
