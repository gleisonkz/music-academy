import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  {
    path: 'ear-training',
    loadChildren: async () =>
      (await import('./domain/ear-training/ear-training.routes'))
        .EAR_TRAINING_ROUTES,
  },
];
