import {
  Note,
  NOTES,
} from 'src/app/domain/music-academy/services/frequency/notes';

import { Injectable } from '@angular/core';

export interface BufferInformation {
  frequency: number;
  volume: number;
}

@Injectable({
  providedIn: 'root',
})
export class FrequencyService {
  audioContext?: AudioContext;
  audioAnalyser?: AnalyserNode;
  audioSource?: MediaStreamAudioSourceNode;
  samples?: Float32Array;
  bufferLength: number = 0;
  channels: number = 0;
  lowPeriod: number = 0;
  highPeriod: number = 0;
  sampleRate: number = 0;
  private readonly notes = NOTES;

  constructor() {}

  initialize(
    audioStream: MediaStream,
    minimumFrequency: number,
    maximumFrequency: number
  ): void {
    this.audioContext = new AudioContext();
    this.sampleRate = this.audioContext.sampleRate;
    this.audioAnalyser = this.audioContext.createAnalyser();
    this.audioSource = this.audioContext.createMediaStreamSource(audioStream);
    this.bufferLength = this.audioAnalyser.fftSize;
    this.samples = new Float32Array(this.bufferLength);
    this.channels = this.audioSource.channelCount;
    this.audioSource.connect(this.audioAnalyser);

    this.resetFrequencies(minimumFrequency, maximumFrequency);

    if (this.bufferLength < this.highPeriod) {
      // throw an error
    }
  }

  getNoteFromFrequency(frequency: number): Note {
    let result = {
      frequency: 0,
      halfStepDown: -Infinity,
      halfStepUp: -Infinity,
      name: '',
      octave: -Infinity,
    };

    for (const element of this.notes) {
      let note = element;

      if (frequency > note.halfStepDown && frequency < note.halfStepUp) {
        result = note;
        break;
      }
    }

    return result;
  }

  resetFrequencies(minimumFrequency: number, maximumFrequency: number) {
    if (minimumFrequency > 0 && maximumFrequency > minimumFrequency) {
      this.lowPeriod = Math.floor(this.sampleRate / maximumFrequency);
      this.highPeriod = Math.ceil(this.sampleRate / minimumFrequency);
    }
  }

  getBufferInformation(): BufferInformation {
    let bufferInformation: BufferInformation = {
      frequency: -Infinity,
      volume: -Infinity,
    };

    if (this.audioAnalyser && this.samples) {
      this.audioAnalyser.getFloatTimeDomainData(this.samples);

      let greatestMagnitude = -Infinity;
      let chosenPeriod = -1;
      let volume = 0.0;

      // Get the frequency using an Average Magnitude Difference Function
      for (let period = this.lowPeriod; period < this.highPeriod; period++) {
        let sum = 0.0;
        for (let i = 0; i < this.bufferLength - period; i++) {
          let sample = this.samples[i];
          sum += sample * this.samples[i + period];
          volume = Math.max(volume, Math.abs(sample));
        }

        const newMagnitude = sum / this.bufferLength;
        if (newMagnitude > greatestMagnitude) {
          chosenPeriod = period;
          greatestMagnitude = newMagnitude;
        }
      }

      bufferInformation = {
        frequency: this.sampleRate / chosenPeriod,
        volume: volume,
      };
    }

    return bufferInformation;
  }
}
