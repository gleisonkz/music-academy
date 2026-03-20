import { Route } from '@angular/router';
import { authGuard } from '../../guards/auth.guard';

export const MUSIX_STUDIO_ROUTES: Route[] = [
  {
    path: '',
    redirectTo: '/',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: async () => (await import('./musix-studio.component')).MusixStudioComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'note-ear-training',
        loadComponent: async () =>  (await import('./pages/note-ear-training/note-ear-training.component')).NoteEarTrainingComponent,
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
        path: 'recording',
        loadComponent: async () => (await import('./pages/recording')).RecordingPage,
      },
      {
        path: 'kit-ensaio',
        loadComponent: async () => (await import('./pages/kit-ensaio')).KitEnsaioPage,
      },
      {
        path: 'sync-editor',
        loadComponent: async () => (await import('./pages/sync-editor/index')).SyncEditorPage,
      },
      {
        path: 'tom-ideal',
        loadComponent: async () => (await import('./pages/tom-ideal')).IdealPitchPage,
      },
    ],
  },
];
