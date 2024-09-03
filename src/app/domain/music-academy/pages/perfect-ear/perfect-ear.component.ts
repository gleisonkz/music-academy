import { FrequencyService } from 'src/app/domain/music-academy/services/frequency/frequency.service';
import { MatSharedModule } from 'src/app/shared/modules/mat-shared.module';

import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-perfect-hearing',
  styleUrls: ['./perfect-ear.component.scss'],
  standalone: true,
  imports: [NgIf, MatSharedModule],
  template: `
    <div>
      <button
        type="button"
        mat-stroked-button
        *ngIf="!isRecording"
        (click)="startRecording()"
      >
        Start Recording
      </button>

      <button
        type="button"
        mat-stroked-button
        *ngIf="isRecording"
        (click)="stopRecording()"
      >
        Stop Recording
      </button>

      <div *ngIf="isRecording">{{ recordedTime }}</div>

      @if (!isRecording && audioBlob) {
      <div>
        <audio controls>
          <source [src]="audioBlob" type="audio/webm" />
        </audio>
      </div>
      }

      <p>
        Status da Gravação:
        {{ mediaRecorder?.state }}
      </p>
    </div>
  `,
})
export class PerfectEarComponent {
  isRecording = false;
  recordedTime: any;
  mediaStream: MediaStream | null;
  chunks: any = [];
  mediaRecorder: MediaRecorder | null;
  audioBlob: any;

  private readonly minimumFrequency = 60.0;
  private readonly maximumFrequency = 392.0;

  constructor(
    private sanitizer: DomSanitizer,
    private frequencyService: FrequencyService
  ) {}

  async startRecording() {
    if (!this.isRecording) {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      this.frequencyService.initialize(
        this.mediaStream,
        this.minimumFrequency,
        this.maximumFrequency
      );

      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      this.mediaRecorder.start();

      this.mediaRecorder.ondataavailable = (event) => {
        this.chunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/wav' });
        this.chunks = [];
        const audioUrl = URL.createObjectURL(blob);
        this.audioBlob = this.sanitizer.bypassSecurityTrustUrl(audioUrl);
        this.isRecording = false;
      };

      this.isRecording = true;
    }
  }

  stopRecording() {
    if (this.isRecording) {
      this.mediaRecorder?.stop();

      this.mediaStream?.getTracks().forEach((track) => track.stop());
      this.isRecording = false;

      console.log('Recording stopped!');
      console.log(this.chunks);
      const bufferInformation = this.frequencyService.getBufferInformation();
      const note = this.frequencyService.getNoteFromFrequency(
        bufferInformation.frequency
      );
      console.log(bufferInformation);
      console.log(`a nota emitida foi: ${note.name}`);
      console.log({ note });
    }
  }

  clearRecordedData() {
    // this.blobUrl = null;
  }

  ngOnDestroy(): void {}
}
