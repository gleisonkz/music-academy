import { FormControl } from '@angular/forms';

export interface NoteEarTraining {
  stopwatch: boolean;
  repeatNotes: boolean;
  instrument: number;
}

export type NoteEarTrainingForm = {
  [key in keyof NoteEarTraining]: FormControl<NoteEarTraining[key] | null>;
};
