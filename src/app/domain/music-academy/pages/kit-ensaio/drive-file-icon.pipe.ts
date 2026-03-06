import { Pipe, PipeTransform } from '@angular/core';

/** Item do Drive com campos usados para escolher ícone (nome e mimeType). */
export interface DriveItemIcon {
  name?: string;
  mimeType?: string;
}

/** Retorna o nome do ícone Material (ex.: music_note, videocam). Usado no componente para isAudioItem. */
export function getDriveFileIcon(item: DriveItemIcon): string {
  const mime = (item.mimeType || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac|wma)(\?|$)/i.test(name)) return 'music_note';
  if (mime.startsWith('video/') || /\.(mp4|webm|mkv|avi|mov)(\?|$)/i.test(name)) return 'videocam';
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'picture_as_pdf';
  if (mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(name)) return 'image';
  if (mime.startsWith('text/') || mime.includes('google-apps.document') || /\.(txt|md|csv)(\?|$)/i.test(name)) return 'text_snippet';
  if (mime.includes('spreadsheet') || /\.(xls|xlsx)(\?|$)/i.test(name)) return 'table_chart';
  if (mime.includes('presentation') || /\.(ppt|pptx)(\?|$)/i.test(name)) return 'slideshow';
  return 'description';
}

function getDriveFileIconClass(icon: string): string {
  if (icon === 'music_note') return 'file-audio';
  if (icon === 'videocam') return 'file-video';
  if (icon === 'picture_as_pdf') return 'file-pdf';
  if (icon === 'text_snippet') return 'file-text';
  if (icon === 'image') return 'file-image';
  return 'file-default';
}

@Pipe({ name: 'driveFileIcon', standalone: true })
export class DriveFileIconPipe implements PipeTransform {
  transform(item: DriveItemIcon): string {
    return getDriveFileIcon(item);
  }
}

@Pipe({ name: 'driveFileIconClass', standalone: true })
export class DriveFileIconClassPipe implements PipeTransform {
  transform(item: DriveItemIcon): string {
    return getDriveFileIconClass(getDriveFileIcon(item));
  }
}
