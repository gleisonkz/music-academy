import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  public isMuted: boolean[] = [];
  public currentTimeSignal = signal(0);

  toggleMute(index: number) {
    this.isMuted[index] = !this.isMuted[index];
  }
}
