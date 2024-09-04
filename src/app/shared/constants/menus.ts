import { Menu } from '../models/interfaces/menu';

export const DASHBOARD: Menu = {
  icon: 'music_note',
  title: 'Dashboard',
  link: '/music-academy/dashboard',
};

export const MENUS: Menu[] = [
  {
    icon: 'volume_up',
    title: 'Treinamento Auditivo',
    link: '/music-academy/note-ear-training',
  },
  {
    icon: 'hearing',
    title: 'Ouvido Perfeito',
    link: '/music-academy/perfect-ear',
  },
  {
    icon: 'music_note',
    title: 'Notação de Cifras',
    link: '/music-academy/cipher-notation',
  },
  {
    icon: 'timer',
    title: 'Metrônomo',
    link: '/music-academy/metronome',
  },
];
