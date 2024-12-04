import { Howl } from 'howler';

import { CommonModule } from '@angular/common';
import { Component, inject, Input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';

import { AudioService } from '../../services/audio/audio.service';

export interface AudioPath {
  name: string;
  path: string;
}

export interface HowlAudio {
  id: string;
  howl: Howl;
}

@Component({
  selector: 'ma-audio-player',
  templateUrl: './audio-player.component.html',
  styleUrls: ['./audio-player.component.scss'],
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatSliderModule, CommonModule],
})
export class AudioPlayerComponent {
  public audioService = inject(AudioService);
  public allMuted = signal(false);

  @Input()
  sounds: HowlAudio[] | undefined;

  toggleMute(name: string) {
    const howl = this.sounds?.find((sound) => sound.id === name)?.howl;
    howl?.mute(!howl?.mute());
    this.audioService.toggleMute(this.sounds?.findIndex((sound) => sound.id === name) || 0);
  }

  muteAll() {
    const howls = this.sounds?.map((sound) => sound.howl);
    howls?.forEach((howl, index) => {
      howl?.mute(true);
      this.audioService.isMuted[index] = true;
    });
  }

  unmuteAll() {
    const howls = this.sounds?.map((sound) => sound.howl);

    howls?.forEach((howl) => {
      howl?.mute(false);
    });

    this.audioService.isMuted = this.audioService.isMuted.map(() => false);
  }

  playAll() {
    this.sounds?.forEach(({ howl: sound }) => {
      sound.play();
    });
  }

  stopAll() {
    this.sounds?.forEach(({ howl: sound }) => {
      sound.stop();
    });
  }
}
