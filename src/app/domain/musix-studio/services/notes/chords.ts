export interface Chord {
  chord: string;
  name: string;
  notes: [string, string, string, string?];
}

export const CHORDS: Chord[] = [
  { chord: 'C', name: 'Dó maior', notes: ['C', 'E', 'G'] },
  { chord: 'Cm', name: 'Dó menor', notes: ['C', 'Eb', 'G'] },
  { chord: 'Db', name: 'Ré bemol maior', notes: ['Db', 'F', 'Ab'] },
  { chord: 'Dbm', name: 'Ré bemol menor', notes: ['Db', 'E', 'Ab'] },
  { chord: 'D', name: 'Ré maior', notes: ['D', 'F#', 'A'] },
  { chord: 'Dm', name: 'Ré menor', notes: ['D', 'F', 'A'] },
  { chord: 'E', name: 'Mi maior', notes: ['E', 'G#', 'B'] },
  { chord: 'Em', name: 'Mi menor', notes: ['E', 'G', 'B'] },
  { chord: 'F', name: 'Fá maior', notes: ['F', 'A', 'C'] },
  { chord: 'Fm', name: 'Fá menor', notes: ['F', 'Ab', 'C'] },
  { chord: 'G', name: 'Sol maior', notes: ['G', 'B', 'D'] },
  { chord: 'Gm', name: 'Sol menor', notes: ['G', 'Bb', 'D'] },
  { chord: 'A', name: 'Lá maior', notes: ['A', 'C#', 'E'] },
  { chord: 'Am', name: 'Lá menor', notes: ['A', 'C', 'E'] },
  { chord: 'B', name: 'Si maior', notes: ['B', 'D#', 'F#'] },
  { chord: 'Bm', name: 'Si menor', notes: ['B', 'D', 'F#'] },
];
