import { TextFormatDirective } from 'src/app/widgets/directives/text-format/text-format.directive';

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';

interface Song {
  songId: string;
  thumbnail: string;
}

@Component({
  templateUrl: './songs.page.html',
  styleUrls: ['./songs.page.scss'],
  standalone: true,
  imports: [CommonModule, TextFormatDirective, MatCardModule, RouterModule],
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
