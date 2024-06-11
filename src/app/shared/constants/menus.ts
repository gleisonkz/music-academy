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
];
