import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription, delay, timer } from 'rxjs';
import { BASS_NOTES } from 'src/app/shared/constants/bass-notes.constant';
import { NoteEarTrainingForm } from 'src/app/shared/models/interfaces/note-ear-training';
import { MatSharedModule } from 'src/app/shared/modules/mat-shared.module';
import { SimpleStepComponent } from 'src/app/widgets/components/simple-step/simple-step.component';

@Component({
  selector: 'app-note-ear-training',
  templateUrl: './note-ear-training.component.html',
  styleUrls: ['./note-ear-training.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSharedModule,
    SimpleStepComponent,
  ],
})
export class NoteEarTrainingComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private timeSubscription: Subscription;

  protected noteEarTrainingForm: FormGroup<NoteEarTrainingForm>;
  protected limitTimeMilliseconds = 30000;
  protected readonly hasTrainingStarted = signal(false);
  protected readonly currentStep = signal(0);
  protected readonly countSteps = signal(10);
  protected readonly timerValue = signal('00:30');
  private readonly intervalStep = 5000;
  private currentIntervalId: any;
  private filteredBassNotes = this.getNotes();
  private currentAudio: HTMLAudioElement = new Audio(
    this.filteredBassNotes[0].src
  );

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnDestroy(): void {
    this.stopAudio();
    this.clearInterval();
  }

  protected nextStep(): void {
    this.stopAudio();
    this.clearInterval();

    this.currentStep.set(this.currentStep() + 1);

    this.currentAudio = new Audio(
      this.filteredBassNotes[this.currentStep() - 1].src
    );
    this.playCurrentAudio();
    this.restartCountdown();
    this.startCountdown();
  }

  protected previousStep(): void {
    this.stopAudio();
    this.clearInterval();

    this.currentStep.set(this.currentStep() - 1);

    this.currentAudio = new Audio(
      this.filteredBassNotes[this.currentStep() - 1].src
    );
    this.playCurrentAudio();
    this.restartCountdown();
    this.startCountdown();
  }

  protected doneSteps(): void {
    this.hasTrainingStarted.set(!this.hasTrainingStarted());
    this.currentStep.set(0);
    this.resetNotes();
    this.stopAudio();
    this.clearInterval();
    this.restartCountdown();
  }

  protected startTraining(): void {
    this.hasTrainingStarted.set(!this.hasTrainingStarted());
    this.playCurrentAudio();
    this.nextStep();
  }

  protected playCurrentAudio(): void {
    this.currentAudio.play();

    if (this.noteEarTrainingForm.controls.repeatNotes.value) {
      this.currentIntervalId = setInterval(() => {
        this.currentAudio.play();
      }, this.intervalStep);
    }
  }

  private buildForm(): void {
    this.noteEarTrainingForm = new FormGroup<NoteEarTrainingForm>({
      stopwatch: new FormControl(false),
      repeatNotes: new FormControl(false),
      instrument: new FormControl(1),
    });
  }

  private clearInterval() {
    if (this.currentIntervalId) {
      clearInterval(this.currentIntervalId);
    }
  }

  private getNotes(quantity = 10) {
    return [...BASS_NOTES].sort(() => Math.random() - 0.5).slice(0, quantity);
  }

  private resetNotes(): void {
    this.filteredBassNotes = this.getNotes();
    this.currentAudio = new Audio(this.filteredBassNotes[0].src);
  }

  private stopAudio(): void {
    const isPlaying = !this.currentAudio.paused;
    const isNotEnded = !this.currentAudio.ended;

    if (isPlaying && isNotEnded) {
      this.currentAudio.pause();
    }
  }

  private restartCountdown() {
    if (!this.noteEarTrainingForm.controls.stopwatch) return;
    this.timerValue.set('00:30');
    this.limitTimeMilliseconds = 30000;
    this.timeSubscription?.unsubscribe?.();
  }

  private startCountdown(): void {
    if (!this.noteEarTrainingForm.controls.stopwatch) return;
    const minuteTime = 60000;
    const secondTime = 1000;

    this.timeSubscription = timer(0, secondTime)
      .pipe(takeUntilDestroyed(this.destroyRef), delay(1000))
      .subscribe(() => {
        this.limitTimeMilliseconds -= secondTime;

        const minutes = Math.floor(this.limitTimeMilliseconds / minuteTime)
          .toString()
          .padStart(2, '0');

        const seconds = Math.floor(
          (this.limitTimeMilliseconds % minuteTime) / secondTime
        )
          .toString()
          .padStart(2, '0');
        this.timerValue.set(`${minutes}:${seconds}`);

        if (this.limitTimeMilliseconds <= 0) {
          this.clearInterval();
          this.restartCountdown();
          this.stopAudio();
        }
      });
  }
}
