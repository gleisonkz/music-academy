import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  link: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent {
  readonly year = new Date().getFullYear();
  readonly features: FeatureCard[] = [
    {
      icon: 'volume_up',
      title: 'Treinamento Auditivo',
      description: 'Aprenda a reconhecer notas, intervalos e acordes pelo ouvido. Exercícios progressivos para afinar sua percepção musical.',
      link: '/music-academy/note-ear-training',
    },
    {
      icon: 'hearing',
      title: 'Ouvido Perfeito',
      description: 'Desenvolva a capacidade de identificar alturas e tons sem referência. Treino focado em reconhecimento absoluto e relativo.',
      link: '/music-academy/perfect-ear',
    },
    {
      icon: 'music_note',
      title: 'Notação de Cifras',
      description: 'Visualize e pratique cifras de forma clara. Ideal para estudo de harmonia e acompanhamento.',
      link: '/music-academy/cipher-notation',
    },
    {
      icon: 'timer',
      title: 'Metrônomo',
      description: 'Mantenha o tempo preciso em qualquer BPM. Essencial para ensaios e gravações.',
      link: '/music-academy/metronome',
    },
    {
      icon: 'music_note',
      title: 'Prática de Backing',
      description: 'Pratique com bases e backing tracks. Ajuste o andamento e treine suas partes com suporte de áudio.',
      link: '/music-academy/backing-practice',
    },
    {
      icon: 'mic',
      title: 'Gravação',
      description: 'Grave sua voz ou instrumento com áudio de apoio. Use mapas sincronizados e baixe ou compartilhe suas tomadas.',
      link: '/music-academy/recording',
    },
    {
      icon: 'folder',
      title: 'Kit Ensaio',
      description: 'Acesse suas pastas e arquivos no Google Drive. Organize áudios, mapas e sincronize com a gravação.',
      link: '/music-academy/kit-ensaio',
    },
    {
      icon: 'schedule',
      title: 'Editor de Sincronia',
      description: 'Crie e edite mapas que sincronizam letra e áudio. Defina os tempos de cada seção e exporte para a gravação.',
      link: '/music-academy/sync-editor',
    },
    {
      icon: 'quiz',
      title: 'Quizz',
      description: 'Teste seu conhecimento musical com perguntas e desafios. Aprenda de forma divertida.',
      link: '/music-academy/quizz',
    },
    {
      icon: 'policy',
      title: 'Política de Privacidade',
      description: 'Saiba como o Music Academy trata seus dados e integra com o Google Drive.',
      link: '/privacy-policy',
    },
    {
      icon: 'gavel',
      title: 'Termos de Serviço',
      description: 'Veja as regras de uso do Music Academy e suas responsabilidades.',
      link: '/terms-of-service',
    },
  ];
}

