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
    link: '/musix-studio/note-ear-training',
  },
  {
    icon: 'hearing',
    title: 'Ouvido Perfeito',
    link: '/musix-studio/perfect-ear',
  },
  {
    icon: 'music_note',
    title: 'Notação de Cifras',
    link: '/musix-studio/cipher-notation',
  },
  {
    icon: 'timer',
    title: 'Metrônomo',
    link: '/musix-studio/metronome',
  },
  {
    icon: 'mic',
    title: 'Gravação',
    link: '/musix-studio/recording',
  },
  {
    icon: 'folder',
    title: 'Kit Ensaio',
    link: '/musix-studio/kit-ensaio',
  },
  {
    icon: 'schedule',
    title: 'Editor de Sincronia',
    link: '/musix-studio/sync-editor',
  },
  {
    icon: 'tune',
    title: 'Tom Ideal',
    link: '/musix-studio/tom-ideal',
  },
  {
    icon: 'quiz',
    title: 'Quizz',
    link: '/musix-studio/quizz',
  },
  {
    icon: 'logout',
    title: 'Sair',
    link: '__logout__',
  },
];
