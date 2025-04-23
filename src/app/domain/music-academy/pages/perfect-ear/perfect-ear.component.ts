import { FrequencyService } from 'src/app/domain/music-academy/services/frequency/frequency.service';
import { MatSharedModule } from 'src/app/shared/modules/mat-shared.module';

import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

interface ExerciseNote {
  name: string;
  frequency: number;
  isCorrect?: boolean;
}

interface ExerciseResult {
  totalNotes: number;
  correctNotes: number;
  incorrectNotes: ExerciseNote[];
}

@Component({
  styleUrls: ['./perfect-ear.component.scss'],
  standalone: true,
  imports: [NgIf, MatSharedModule],
  template: `
    <div class="perfect-ear-container">
      <h2>Exercício de Afinação</h2>

      @if (!exerciseStarted) {
      <div class="start-section">
        <p>Este exercício mostrará 10 notas para você cantar em uníssono.</p>
        <button mat-raised-button color="primary" (click)="startExercise()">Iniciar Exercício</button>
      </div>
      } @if (exerciseStarted && !exerciseCompleted) {
      <div class="exercise-section">
        <h3>Nota {{ currentNoteIndex + 1 }} de {{ totalNotes }}</h3>

        <div class="current-note">
          <p>
            Cante a nota: <strong>{{ currentNote?.name }}</strong>
          </p>
          <button mat-stroked-button (click)="playCurrentNote()">Ouvir Nota</button>
        </div>

        <div class="recording-section">
          @if (!isRecording) {
          <button mat-raised-button color="accent" (click)="startRecording()">Gravar Sua Voz</button>
          } @else {
          <button mat-raised-button color="warn" (click)="stopRecording()">Parar Gravação</button>
          <div class="recording-indicator">Gravando... {{ recordedTime }}</div>
          }
        </div>

        @if (!isRecording && audioBlob) {
        <div class="playback-section">
          <p>Sua Gravação:</p>
          <audio controls>
            <source [src]="audioBlob" type="audio/webm" />
          </audio>
          <button mat-raised-button color="primary" (click)="checkNote()">Verificar Nota</button>
        </div>
        }
      </div>
      } @if (exerciseCompleted) {
      <div class="results-section">
        <h3>Resultados</h3>
        <p>Acertos: {{ results.correctNotes }} de {{ results.totalNotes }} ({{ getPercentage() }}%)</p>

        @if (results.incorrectNotes.length > 0) {
        <div class="incorrect-notes">
          <h4>Notas erradas:</h4>
          <ul>
            @for (note of results.incorrectNotes; track note.name) {
            <li>{{ note.name }} (sua nota estava fora do intervalo aceitável)</li>
            }
          </ul>
        </div>
        }

        <button mat-raised-button color="primary" (click)="startExercise()">Tentar Novamente</button>
      </div>
      }
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

  // Exercise state
  exerciseStarted = false;
  exerciseCompleted = false;
  currentNoteIndex = 0;
  totalNotes = 10;
  currentNote: ExerciseNote | null = null;
  exerciseNotes: ExerciseNote[] = [];
  audioContext: AudioContext;
  oscillator: OscillatorNode;
  results: ExerciseResult = {
    totalNotes: 0,
    correctNotes: 0,
    incorrectNotes: [],
  };

  private readonly minimumFrequency = 60.0;
  private readonly maximumFrequency = 392.0;
  private readonly allowedFrequencyDeviation = 15; // Hz deviation allowed for correct answer

  // Notes with their frequencies (C4 to G4)
  private availableNotes: ExerciseNote[] = [
    { name: 'C4', frequency: 261.63 },
    { name: 'D4', frequency: 293.66 },
    { name: 'E4', frequency: 329.63 },
    { name: 'F4', frequency: 349.23 },
    { name: 'G4', frequency: 392.0 },
    { name: 'A4', frequency: 440.0 },
    { name: 'B4', frequency: 493.88 },
  ];

  constructor(private sanitizer: DomSanitizer, private frequencyService: FrequencyService) {
    this.audioContext = new AudioContext();
  }

  startExercise() {
    this.exerciseStarted = true;
    this.exerciseCompleted = false;
    this.currentNoteIndex = 0;
    this.exerciseNotes = this.generateRandomNotes();
    this.currentNote = this.exerciseNotes[0];
    this.results = {
      totalNotes: this.totalNotes,
      correctNotes: 0,
      incorrectNotes: [],
    };
  }

  generateRandomNotes(): ExerciseNote[] {
    const notes: ExerciseNote[] = [];
    for (let i = 0; i < this.totalNotes; i++) {
      const randomIndex = Math.floor(Math.random() * this.availableNotes.length);
      notes.push({ ...this.availableNotes[randomIndex] });
    }
    return notes;
  }

  playCurrentNote() {
    if (!this.currentNote) return;

    if (this.oscillator) {
      this.oscillator.stop();
    }

    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.value = this.currentNote.frequency;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0.5;

    this.oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    this.oscillator.start();
    setTimeout(() => {
      this.oscillator.stop();
    }, 2000);
  }

  async startRecording() {
    if (!this.isRecording) {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      this.frequencyService.initialize(this.mediaStream, this.minimumFrequency, this.maximumFrequency);

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
    }
  }

  checkNote() {
    if (!this.currentNote) return;

    const bufferInformation = this.frequencyService.getBufferInformation();
    const detectedNote = this.frequencyService.getNoteFromFrequency(bufferInformation.frequency);
    const targetFreq = this.currentNote.frequency;
    const detectedFreq = bufferInformation.frequency;

    // Check if sung frequency is within acceptable range of target frequency
    const isCorrect = Math.abs(targetFreq - detectedFreq) <= this.allowedFrequencyDeviation;

    this.exerciseNotes[this.currentNoteIndex].isCorrect = isCorrect;

    if (isCorrect) {
      this.results.correctNotes++;
    } else {
      this.results.incorrectNotes.push({
        name: this.currentNote.name,
        frequency: this.currentNote.frequency,
      });
    }

    this.nextNote();
  }

  nextNote() {
    this.currentNoteIndex++;
    this.audioBlob = null;

    if (this.currentNoteIndex >= this.totalNotes) {
      this.completeExercise();
    } else {
      this.currentNote = this.exerciseNotes[this.currentNoteIndex];
    }
  }

  completeExercise() {
    this.exerciseCompleted = true;
    this.exerciseStarted = false;
  }

  getPercentage() {
    return Math.round((this.results.correctNotes / this.results.totalNotes) * 100);
  }

  clearRecordedData() {
    this.audioBlob = null;
  }
}
