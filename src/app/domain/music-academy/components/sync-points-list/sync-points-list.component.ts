import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

/** Ponto de sincronia (time em segundos, blockIndex, label opcional do parágrafo). */
export interface SyncPointItem {
  time: number;
  blockIndex: number;
  label?: string;
}

@Component({
  selector: 'ma-sync-points-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sync-points-list.component.html',
  styleUrls: ['./sync-points-list.component.scss'],
})
export class SyncPointsListComponent {
  /** Lista de pontos (time, blockIndex, label?). */
  points = input.required<SyncPointItem[]>();
  /** Se true, exibe o botão de remover em cada item. */
  showRemoveButton = input<boolean>(false);

  /** Emitido quando o usuário clica no tempo (para seek no áudio). */
  seek = output<number>();
  /** Emitido quando o usuário clica em remover (índice do ponto). */
  removePoint = output<number>();

  formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  onSeek(time: number): void {
    this.seek.emit(time);
  }

  onRemove(index: number): void {
    this.removePoint.emit(index);
  }

  labelFor(point: SyncPointItem): string {
    return point.label ?? `bloco ${point.blockIndex}`;
  }
}
