import { Menu } from '../models/interfaces/menu';

export const DASHBOARD: Menu = {
  icon: 'home',
  title: 'Início',
  link: '/',
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
  {
    icon: 'mic',
    title: 'Gravação',
    link: '/music-academy/recording',
  },
  {
    icon: 'folder',
    title: 'Kit Ensaio',
    link: '/music-academy/kit-ensaio',
  },
  {
    icon: 'schedule',
    title: 'Editor de Sincronia',
    link: '/music-academy/sync-editor',
  },
  {
    icon: 'quiz',
    title: 'Quizz',
    link: '/music-academy/quizz',
  },
  {
    icon: 'logout',
    title: 'Sair',
    link: '__logout__',
  },
];
