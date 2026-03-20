import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Output, signal } from '@angular/core';

@Component({
  selector: 'ma-audio-upload-dropzone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-upload-dropzone.component.html',
  styleUrls: ['./audio-upload-dropzone.component.scss'],
})
export class AudioUploadDropzoneComponent {
  readonly accept = input('audio/*,.mp3,.wav,.ogg,.m4a,.aac');
  readonly title = input('Arraste um arquivo de áudio aqui ou clique para escolher');
  readonly hint = input('MP3, WAV, OGG, M4A, AAC');
  readonly selectedFileName = input('');

  readonly isDragging = signal(false);

  @Output() fileSelected = new EventEmitter<File>();

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0] ?? null;
    if (file) this.fileSelected.emit(file);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file) this.fileSelected.emit(file);
    input.value = '';
  }
}

