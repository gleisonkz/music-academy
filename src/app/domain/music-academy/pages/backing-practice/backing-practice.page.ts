import { TextFormatDirective } from 'src/app/widgets/directives/text-format/text-format.directive';

import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  templateUrl: './backing-practice.page.html',
  styleUrls: ['./backing-practice.page.scss'],
  standalone: true,
  imports: [CommonModule, TextFormatDirective],
})
export class BackingPracticePage {
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;

  song = {
    title: 'Pra onde eu irei',
    artist: 'Morada',
    key: 'C',
    sections: [
      {
        title: 'Intro',
        time: 0,
      },
      {
        title: 'Verso 1 - (1º vez)',
        time: 6,
        lyrics: [
          { time: 6.2, text: 'Ele abriu mão de sua gloria' },
          { time: 9.6, text: 'Sangrou no madeiro por mim' },
          { time: 13.3, text: 'Me conectou, salvou e curou' },
        ],
      },
      {
        title: 'Verso 2 - (1º vez)',
        time: 20.7,
        lyrics: [
          { time: 20.7, text: 'Ele me deu um destino' },
          { time: 24.4, text: 'Uma capa e um pouco de vinho' },
          { time: 28.1, text: 'Ele me deu unção, cajado e pão' },
        ],
      },
      {
        title: 'Pré Refrão - (1º vez)',
        time: 35.8,
        lyrics: [
          { time: 35.8, text: 'Pôs um anel em meu dedo e me tirou o medo' },
          { time: 43.2, text: 'Novas sandálias pra suportar o ide' },
          { time: 50.6, text: 'Pôs um anel em meu dedo e me tirou o medo' },
          { time: 58.1, text: 'Novas sandálias, e disse: Vai' },
        ],
      },
      {
        title: 'Refrão - (1º vez)',
        time: 69,
        lyrics: [
          { time: 69, text: '=E eu me despedi dos meus pais=' },
          { time: 77.5, text: '=Eu queimei minhas carroças=' },
          { time: 84, text: '=E= +eu+ afundei meus barcos no cais' },
        ],
      },
      {
        title: 'Refrão - (2º vez)',
        time: 98,
        lyrics: [
          { time: 98.7, text: '=E eu me despedi dos meus pais=' },
          { time: 107, text: '=Eu queimei minhas carroças=' },
          { time: 113.5, text: '=E= +eu+ afundei meus barcos no cais' },
        ],
      },
      {
        title: 'Verso 1 - (2º vez)',
        time: 128,
        lyrics: [
          { time: 128, text: 'Ele abriu mão de sua gloria' },
          { time: 131.6, text: 'Sangrou no madeiro por mim' },
          { time: 135.7, text: 'Me conectou, salvou e curou' },
        ],
      },
    ],
  };
  currentTime = 0;
  sectionActiveIndex = Number.NEGATIVE_INFINITY;
  lyricActiveIndex = Number.NEGATIVE_INFINITY;
  audioSrc = 'assets/audio/kit-ensao/pra-onde-eu-irei/c/TODOS_OS_BACKS.mp3';

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.audioPlayer.nativeElement.addEventListener('timeupdate', this.updateLyrics.bind(this));
  }

  updateLyrics(): void {
    this.currentTime = this.audioPlayer.nativeElement.currentTime;
    console.log({ currentTime: this.currentTime });
    // Verifica qual parte da letra corresponde ao tempo atual
    // for (let i = 0; i < this.song.lyrics.length; i++) {
    //   if (this.currentTime >= this.song.lyrics[i].time) {
    //     this.activeIndex = i;
    //   }
    // }

    for (let i = 0; i < this.song.sections.length; i++) {
      if (this.currentTime >= this.song.sections[i].time) {
        this.sectionActiveIndex = i;
      }

      if (this.song.sections[i].lyrics !== undefined) {
        const lyrics = this.song.sections[i].lyrics;
        if (!lyrics) return;
        for (let j = 0; j < lyrics.length; j++) {
          if (this.currentTime >= lyrics[j].time) {
            this.lyricActiveIndex = j;
          }
        }
      }
    }
  }

  jumpTo(time: number): void {
    this.audioPlayer.nativeElement.currentTime = time;
    this.audioPlayer.nativeElement.play();
  }

  onKeyDown() {}
}
