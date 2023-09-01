import { Routes } from '@angular/router';

import { NoteEarTrainingPage } from './pages/note-ear-training/note-ear-training.page';

export const EAR_TRAINING_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'note-ear-training',
  },
  {
    path: 'note-ear-training',
    component: NoteEarTrainingPage,
  },
];
