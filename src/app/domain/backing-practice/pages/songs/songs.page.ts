import { TextFormatDirective } from 'src/app/widgets/directives/text-format/text-format.directive';

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ZardSharedModule } from '../../../../shared/modules/zard-shared.module';

interface Song {
  songId: string;
  thumbnail: string;
}

@Component({
  templateUrl: './songs.page.html',
  styleUrls: ['./songs.page.scss'],
  standalone: true,
  imports: [CommonModule, TextFormatDirective, ZardSharedModule, RouterModule],
})
export class SongsPage {
  songs: Song[] = [
    {
      songId: 'unico-fernandinho',
      thumbnail: 'assets/audio/kit-ensaio/unico-fernandinho/thumb.jpg',
    },
    {
      songId: 'tu-es-o-rei-salazar',
      thumbnail: 'assets/audio/kit-ensaio/tu-es-o-rei-salazar/thumb.jpg',
    },
    {
      songId: 'com-muito-louvor-thalles',
      thumbnail: 'assets/audio/kit-ensaio/com-muito-louvor-thalles/thumb.jpg',
    },
  ];
}
