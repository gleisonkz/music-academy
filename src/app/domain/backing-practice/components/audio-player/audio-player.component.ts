import { Howl } from 'howler';

import { CommonModule } from '@angular/common';
import { Component, inject, Input, signal } from '@angular/core';

import { ZardSharedModule } from '../../../../shared/modules/zard-shared.module';
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
  imports: [ZardSharedModule, CommonModule],
})
export class AudioPlayerComponent {
  public audioService = inject(AudioService);
  public allMuted = signal(false);
  public masterVolume = signal(1.0); // Volume geral (0.0 a 1.0)

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

  // Novo método para controlar o volume geral
  setMasterVolume(volume: number) {
    this.masterVolume.set(volume);
    this.sounds?.forEach(({ howl: sound }) => {
      sound.volume(volume);
    });
  }

  // Método para obter o volume atual
  getMasterVolume(): number {
    return this.masterVolume();
  }

  // Método para lidar com mudanças no slider
  onVolumeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const volume = parseFloat(target.value);
    this.setMasterVolume(volume);
  }
}
