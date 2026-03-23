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
    link: '/note-ear-training',
  },
  {
    icon: 'hearing',
    title: 'Ouvido Perfeito',
    link: '/perfect-ear',
  },
  {
    icon: 'music_note',
    title: 'Notação de Cifras',
    link: '/cipher-notation',
  },
  {
    icon: 'timer',
    title: 'Metrônomo',
    link: '/metronome',
  },
  {
    icon: 'mic',
    title: 'Gravação',
    link: '/recording',
  },
  {
    icon: 'folder',
    title: 'Kit Ensaio',
    link: '/kit-ensaio',
  },
  {
    icon: 'schedule',
    title: 'Editor de Sincronia',
    link: '/sync-editor',
  },
  {
    icon: 'tune',
    title: 'Tom Ideal',
    link: '/tom-ideal',
  },
  {
    icon: 'quiz',
    title: 'Quizz',
    link: '/quizz',
  },
  {
    icon: 'image_search',
    title: 'Louve Screenshot Parser',
    link: '/louve-screenshot-parser',
  },
  {
    icon: 'logout',
    title: 'Sair',
    link: '__logout__',
  },
];
