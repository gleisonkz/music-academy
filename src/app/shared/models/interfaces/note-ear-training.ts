import { FormControl } from '@angular/forms';

export interface NoteEarTraining {
  stopwatch: boolean;
  repeatNotes: boolean;
  instrument: number;
  /** Volume de 0 a 100 (percentual). Padrão 50. */
  volume: number;
}

export type NoteEarTrainingForm = {
  [key in keyof NoteEarTraining]: FormControl<NoteEarTraining[key] | null>;
};
