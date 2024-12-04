/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Howl } from 'howler';
import { TextFormatDirective } from 'src/app/widgets/directives/text-format/text-format.directive';

import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';

import { AudioPlayerComponent } from '../../components/audio-player/audio-player.component';
import { AudioService } from '../../services/audio/audio.service';

export interface HowlAudio {
  id: string;
  howl: Howl;
}

function compareWithTolerance(num1: number, num2: number, tolerance: number) {
  return Math.abs(num1 - num2) <= tolerance;
}

@Component({
  templateUrl: './song-detail.page.html',
  styleUrls: ['./song-detail.page.scss'],
  standalone: true,
  imports: [MatCheckboxModule, MatIconModule, TextFormatDirective, AudioPlayerComponent, MatSliderModule, MatSidenavModule, MatButtonModule],
})
export class SongDetailPage implements OnInit {
  @ViewChild('tenorAudio') tenorAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('contraltoAudio') contraltoAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('sopranoAudio') sopranoAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('clickAudio') clickAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('guiaAudio') guiaAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('vozAudio') vozAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('vsAudio') vsAudio!: ElementRef<HTMLAudioElement>;

  private readonly document = inject(DOCUMENT);
  public readonly audioService = inject(AudioService);
  sounds: HowlAudio[];

  public isPlayerSidebarOpen = signal(true);

  public readonly audioPaths = [
    { name: 'Tenor', path: 'assets/audio/kit-ensaio/unico-fernandinho/TENOR.mp3' },
    { name: 'Contralto', path: 'assets/audio/kit-ensaio/unico-fernandinho/CONTRALTO.mp3' },
    { name: 'Soprano', path: 'assets/audio/kit-ensaio/unico-fernandinho/SOPRANO.mp3' },
    { name: 'Click', path: 'assets/audio/kit-ensaio/unico-fernandinho/CLICK146.mp3' },
    { name: 'Guia', path: 'assets/audio/kit-ensaio/unico-fernandinho/GUIA.mp3' },
    { name: 'Voz', path: 'assets/audio/kit-ensaio/unico-fernandinho/VOZ.mp3' },
    { name: 'VS', path: 'assets/audio/kit-ensaio/unico-fernandinho/VS.mp3' },
  ];

  tenor = signal(true);
  contralto = signal(true);
  soprano = signal(true);
  click = signal(true);
  guia = signal(true);
  voz = signal(true);
  vs = signal(true);

  song = {
    title: 'Único',
    artist: 'Fernandinho',
    key: 'Gm',
    audios: {
      tenor: 'assets/audio/kit-ensaio/unico-fernandinho/TENOR.mp3',
      contralto: 'assets/audio/kit-ensaio/unico-fernandinho/CONTRALTO.mp3',
      soprano: 'assets/audio/kit-ensaio/unico-fernandinho/SOPRANO.mp3',
      click: 'assets/audio/kit-ensaio/unico-fernandinho/CLICK146.mp3',
      guia: 'assets/audio/kit-ensaio/unico-fernandinho/GUIA.mp3',
      voz: 'assets/audio/kit-ensaio/unico-fernandinho/VOZ.mp3',
      vs: 'assets/audio/kit-ensaio/unico-fernandinho/VS.mp3',
    },
    sections: [
      {
        title: 'Intro',
        time: 0,
      },
      {
        title: 'Verso 1 - (1º vez)',
        time: 19.726,
        lyrics: [
          { time: 19.726, text: 'Eu não tenho para onde ir' },
          { time: 23.424, text: 'Teu perfume está marcado em mim' },
          { time: 26.712, text: 'Na sombra de Tuas asas eu estou' },
        ],
      },
      {
        title: 'Verso 2 - (1º vez)',
        time: 32.876,
        lyrics: [
          { time: 32.876, text: 'Eu não sei mais o que fazer' },
          { time: 36.575, text: 'Sem Tua presença eu não sei viver' },
          { time: 39.863, text: 'Não existe vida além de Ti' },
        ],
      },
      {
        title: 'Refrão - (1º vez)',
        time: 45.616,
        lyrics: [
          { time: 45.616, text: '-Único Tu és o único-' },
          { time: 50.958, text: '-Incomparável és na minha vida-' },
          { time: 57.945, text: '-Meu coração não cabe outro amor-' },
          { time: 64.321, text: '-Tudo que tenho e sou é tudo Teu-' },
        ],
      },
      {
        title: 'Verso 1 - (2º vez)',
        time: 72.329,
        lyrics: [
          { time: 72.329, text: 'Eu não tenho para onde ir (-ah ah ah-) (-ah ah-) (-ah ah-)' },
          { time: 76.027, text: 'Teu perfume está marcado em mim (+em mim+)' },
          { time: 79.315, text: 'Na sombra de Tuas asas eu estou' },
        ],
      },
      {
        title: 'Verso 2 - (2º vez)',
        time: 85.479,
        lyrics: [
          { time: 85.479, text: 'Eu não sei mais o que fazer  (-ah ah ah-) (-ah ah-) (-ah ah-)' },
          { time: 89.178, text: 'Sem Tua presença eu não sei viver  (+viver er+)' },
          { time: 92.466, text: 'Não existe vida além de Ti' },
        ],
      },
      {
        title: 'Refrão - (2º vez) - [TENOR MELODIA]',
        time: 98.319,
        lyrics: [
          { time: 98.319, text: '+Único Tu é o único+' },
          { time: 103.661, text: '+Incomparável és na minha vida+' },
          { time: 110.648, text: '+Meu coração não cabe outro amor+' },
          { time: 117.024, text: '+Tudo que tenho e sou é tudo Teu+' },
        ],
      },
      {
        title: 'Refrão - (3º vez) - [SOPRANO MELODIA]',
        time: 124.86,
        lyrics: [
          { time: 124.86, text: '@Único Tu é o único@' },
          { time: 130.212, text: '@Incomparável és na minha vida@' },
          { time: 136.199, text: '@Meu coração não cabe outro amor@' },
          { time: 142.575, text: '@Tudo que tenho e sou é tudo Teu@' },
        ],
      },
      {
        title: 'Ponte - (1º vez)',
        time: 150.411,
        lyrics: [
          { time: 150.411, text: 'Irresistível foi' },
          { time: 153.7, text: 'Tua voz a me chamar' },
          { time: 156.987, text: 'Palavras de vida eterna, Tu tens pra mim' },
        ],
      },
      {
        title: 'Ponte - (2º vez) - [SOPRANO MELODIA]',
        time: 163.562,
        lyrics: [
          { time: 163.562, text: 'Irresistível foi (-irresistível foi-)' },
          { time: 166.85, text: 'Tua voz a me chamar (-tua voz a me- +chamar+)' },
          { time: 170.959, text: 'Palavras de vida eterna só Tu tens pra mim (-ah-) (-ah ah ah-) (-ah ah ah-) (+ahhhhhhhh+)' },
        ],
      },
      {
        title: 'Refrão - (4º vez)',
        time: 180.822,
        lyrics: [
          { time: 180.822, text: '+Único Tu é o+  - [TENOR MELODIA]' },
          { time: 183.579, text: '@Único incomparável és na minha vida@ - [SOPRANO MELODIA]' },
          { time: 192.226, text: '@Meu coração não cabe outro amor@' },
          { time: 198.602, text: '@Tudo que tenho e sou é tudo Teu@' },
        ],
      },
      {
        title: 'Refrão - (5º vez)',
        time: 207.123,
        lyrics: [
          { time: 207.123, text: '@Único Tu é o único@' },
          { time: 212.475, text: '@Incomparável és na minha vida@' },
          { time: 218.462, text: '@Meu coração não cabe outro amor@' },
          { time: 224.639, text: '@Tudo que tenho e sou é tudo Teu@' },
        ],
      },
      {
        title: 'Interlúdio',
        time: 233.425,
      },
      {
        title: 'Coro - (1º vez) - [CONTRALTO MELODIA]',
        time: 246.575,
        lyrics: [
          { time: 226.639, text: '+Oh oh oh oh+' },
          { time: 251.507, text: '+Oh oh oh oh+' },
          { time: 256.438, text: '+Oh oh+' },
        ],
      },
      {
        title: 'Coro - (2º vez) - [CONTRALTO MELODIA]',
        time: 259.726,
        lyrics: [
          { time: 229.927, text: '+Oh oh oh oh+' },
          { time: 264.658, text: '+Oh oh oh oh+' },
          { time: 269.579, text: '+Oh oh+' },
        ],
      },
      {
        title: 'Ponte - (3º vez) - [CONTRALTO MELODIA]',
        time: 272.101,
        lyrics: [
          { time: 272.101, text: 'Irresistível foi (+Oh oh oh oh+)' },
          { time: 275.115, text: 'Tua voz a me chamar (+Oh oh oh oh)+' },
          { time: 278.403, text: 'Palavras de vida eterna só Tu tens pra mim (+Oh oh)+' },
        ],
      },
      {
        title: 'Ponte - (4º vez) - [CONTRALTO MELODIA]',
        time: 285.601,
        lyrics: [
          { time: 285.601, text: 'Irresistível foi (+Oh oh oh oh+)' },
          { time: 288.614, text: 'Tua voz a me chamar (+Oh oh oh oh)+' },
          { time: 291.902, text: 'Palavras de vida eterna só Tu tens pra mim (+Oh oh)+' },
        ],
      },
      {
        title: 'Ponte - (5º vez) - [CONTRALTO MELODIA]',
        time: 298.891,
        lyrics: [
          { time: 298.891, text: 'Irresistível foi (+Oh oh oh oh+)' },
          { time: 301.904, text: 'Tua voz a me chamar (+Oh oh oh oh)+' },
          { time: 305.192, text: 'Palavras de vida eterna só Tu tens pra mim (+Oh oh)+' },
        ],
      },
      {
        title: 'Ponte - (6º vez) - [CONTRALTO MELODIA]',
        time: 311.691,
        lyrics: [
          { time: 311.691, text: 'Irresistível foi (+Oh oh oh oh+)' },
          { time: 314.704, text: 'Tua voz a me chamar (+Oh oh oh oh)+' },
          { time: 317.992, text: 'Palavras de vida eterna só Tu tens pra mim (+Oh oh)+' },
        ],
      },
      {
        title: 'Ponte - (7º vez) - [CONTRALTO MELODIA]',
        time: 324.991,
        lyrics: [
          { time: 324.991, text: 'Irresistível foi (-irresistível foi-)' },
          { time: 328.004, text: 'Tua voz a me chamar (-tua voz a me- +chamar+)' },
          { time: 331.292, text: 'Palavras de vida eterna só Tu tens pra mim (-ah-) (-ah ah ah-) (-ah ah ah-) (+ahhhhhhhh+)' },
        ],
      },
      {
        title: 'Refrão - (6º vez) - [SOPRANO MELODIA]',
        time: 338.467,
        lyrics: [
          { time: 338.467, text: '@Único Tu é o único@' },
          { time: 343.819, text: '@Incomparável és na minha vida@' },
          { time: 350.171, text: '@Meu coração não cabe outro amor@' },
          { time: 356.523, text: '@Tudo que tenho e sou é tudo Teu@' },
        ],
      },
    ],
  };

  get allControls() {
    return [
      this.tenorAudio.nativeElement,
      this.contraltoAudio.nativeElement,
      this.sopranoAudio.nativeElement,
      this.clickAudio.nativeElement,
      this.vozAudio.nativeElement,
      this.vsAudio.nativeElement,
    ];
  }

  ngOnInit(): void {
    this.sounds = this.audioPaths.map((audioPath) => {
      this.audioService.isMuted.push(false);
      return {
        id: audioPath.name,
        howl: new Howl({
          src: audioPath.path,
          html5: true,
          onplay: audioPath.name === 'Guia' ? this.trackTimeUpdate.bind(this) : undefined,
        }),
      };
    });
  }

  trackTimeUpdate() {
    const sound = this.sounds.find((sound) => sound.id === 'Guia');
    const currentTime = sound?.howl.seek() || 0;

    this.updateLyrics(currentTime);
    this.currentTime = currentTime;

    if (sound?.howl.playing()) {
      requestAnimationFrame(this.trackTimeUpdate.bind(this));
    }
  }

  getCurrentTime() {
    const currentTime = this.sounds[0].howl.seek();
    return currentTime;
  }

  currentTime = 0;
  sectionActiveIndex = Number.NEGATIVE_INFINITY;
  lyricActiveIndex = Number.NEGATIVE_INFINITY;
  audioSrc = 'assets/audio/kit-ensaio/pra-onde-eu-irei/c/TODOS_OS_BACKS.mp3';

  playAll() {
    this.sounds.forEach((player) => player.howl.play());
  }

  pauseAll() {
    this.allControls.forEach((player) => player.pause());
  }

  updateLyrics(currentTime: number): void {
    for (let i = 0; i < this.song.sections.length; i++) {
      const currentTimeThreeDigits = Math.floor(currentTime * 1000) / 1000;
      const isInSection = compareWithTolerance(currentTimeThreeDigits, this.song.sections[i].time, 0.05);

      if (isInSection) {
        const line: HTMLDivElement = this.document.querySelector(`[song-section-id="${i}"]`)!;
        const previousLine = this.document.querySelector(`[song-section-id="${i}"]`)?.previousElementSibling;
        const targetLine = previousLine ?? line;

        targetLine?.scrollIntoView({ behavior: 'smooth' });
      }

      if (currentTime >= this.song.sections[i].time) {
        this.sectionActiveIndex = i;
      }

      if (this.song.sections[i].lyrics !== undefined) {
        const lyrics = this.song.sections[i].lyrics;
        if (!lyrics) return;

        for (let j = 0; j < lyrics.length; j++) {
          if (currentTime >= lyrics[j].time) {
            this.lyricActiveIndex = j;
          }
        }
      }
    }
  }

  jumpTo(time: number): void {
    this.sounds.forEach((sound) => {
      sound.howl.seek(time);
    });

    this.playAll();
  }
}
