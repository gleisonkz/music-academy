import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Client, handle_file } from '@gradio/client';
import { ZardSharedModule } from 'src/app/shared/modules/zard-shared.module';

import { IGNORE_ROLE_TERMS, LOUVE_ROSTER_MAP, type LouveRoleEntry } from './roster-map';

interface ParsedParticipant {
  name: string;
  role: string;
}

interface ResolvedParticipant {
  role: string;
  output: string;
  sortKey: string;
}

interface ParsedSong {
  title: string;
}

interface OcrJsonResponse {
  ocr?: {
    text?: string;
  };
}

const TOM_IDEAL_BACKEND_URL_LOCAL = 'http://127.0.0.1:7860';
const TOM_IDEAL_BACKEND_URL_PUBLIC = 'https://gleisonkz-audio-separator-ai.hf.space';
const PARTICIPANT_ROLE_ORDER: Record<string, number> = {
  ministros: 0,
  soprano: 1,
  contralto: 2,
  tenor: 3,
  teclado: 4,
  violao: 5,
  guitarra: 6,
  baixo: 7,
  bateria: 8,
};

function resolveTomIdealBackendUrl(): string {
  const hostname = globalThis?.location?.hostname ?? '';
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
  return isLocalHost ? TOM_IDEAL_BACKEND_URL_LOCAL : TOM_IDEAL_BACKEND_URL_PUBLIC;
}

@Component({
  selector: 'app-louve-screenshot-parser-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardSharedModule],
  templateUrl: './louve-screenshot-parser.page.html',
  styleUrls: ['./louve-screenshot-parser.page.scss'],
})
export class LouveScreenshotParserPage {
  readonly isProcessing = signal(false);
  readonly progressLabel = signal('Aguardando screenshot...');
  readonly headlineOcrText = signal('');
  readonly roteiroOcrText = signal('');
  readonly participantsOcrText = signal('');
  readonly generatedText = signal('');
  readonly error = signal<string | null>(null);
  readonly pasteTarget = signal<'headline' | 'roteiro' | 'participants'>('headline');

  readonly hasOutput = computed(() => !!this.generatedText().trim());

  async onFileSelected(event: Event, target: 'headline' | 'roteiro' | 'participants'): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;
    await this.processScreenshotFile(file, target);
  }

  async pasteFromClipboard(target: 'headline' | 'roteiro' | 'participants'): Promise<void> {
    this.pasteTarget.set(target);
    if (!('clipboard' in navigator) || !('read' in navigator.clipboard)) {
      this.error.set('Seu navegador não permite leitura da área de transferência nesta página.');
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        const file = new File([blob], `clipboard.${imageType.split('/')[1] ?? 'png'}`, { type: imageType });
        await this.processScreenshotFile(file, target);
        return;
      }
      this.error.set('Nenhuma imagem encontrada na área de transferência.');
    } catch (err) {
      this.error.set((err as Error)?.message ?? 'Não foi possível colar a imagem da área de transferência.');
    }
  }

  setPasteTarget(target: 'headline' | 'roteiro' | 'participants'): void {
    this.pasteTarget.set(target);
    this.progressLabel.set(
      `Destino do Ctrl+V: ${target === 'headline' ? 'headline' : target === 'roteiro' ? 'roteiro' : 'participantes'}`
    );
  }

  @HostListener('document:paste', ['$event'])
  async onPaste(event: ClipboardEvent): Promise<void> {
    const items = event.clipboardData?.items;
    if (!items?.length) return;
    for (const item of Array.from(items)) {
      if (!item.type.startsWith('image/')) continue;
      const file = item.getAsFile();
      if (!file) continue;
      event.preventDefault();
      await this.processScreenshotFile(file, this.pasteTarget());
      return;
    }
  }

  private async processScreenshotFile(file: File, target: 'headline' | 'roteiro' | 'participants'): Promise<void> {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.error.set('Selecione uma imagem válida (PNG/JPG/WEBP).');
      return;
    }

    this.error.set(null);
    this.isProcessing.set(true);
    const targetLabel = target === 'headline' ? 'headline' : target === 'roteiro' ? 'roteiro' : 'participantes';
    this.progressLabel.set(`Executando OCR no backend (${targetLabel})...`);
    try {
      const text = await this.extractTextFromBackend(file);
      if (target === 'headline') {
        this.headlineOcrText.set(text);
      } else if (target === 'roteiro') {
        this.roteiroOcrText.set(text);
      } else {
        this.participantsOcrText.set(text);
      }
      this.recomputeGeneratedText();
      this.progressLabel.set('Concluído');
    } catch (err) {
      this.error.set((err as Error)?.message ?? 'Falha ao extrair texto da imagem.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async extractTextFromBackend(imageFile: File): Promise<string> {
    const app = await Client.connect(resolveTomIdealBackendUrl());
    const result = await app.predict('/ocr_image_json', {
      image: handle_file(imageFile),
      language: 'pt',
    });
    const payload = (Array.isArray((result as { data?: unknown[] }).data)
      ? (result as { data?: unknown[] }).data?.[0]
      : result) as OcrJsonResponse | null;
    const text = (payload?.ocr?.text ?? '').trim();
    if (!text) throw new Error('OCR retornou vazio. Tente um print mais nítido.');
    return text;
  }

  async copyResult(): Promise<void> {
    const text = this.generatedText().trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.progressLabel.set('Texto copiado para a área de transferência.');
    } catch {
      this.progressLabel.set('Não foi possível copiar automaticamente.');
    }
  }

  private recomputeGeneratedText(): void {
    this.generatedText.set(this.buildYoutubeText(this.headlineOcrText(), this.roteiroOcrText(), this.participantsOcrText()));
  }

  private buildYoutubeText(headlineRaw: string, roteiroRaw: string, participantsRaw: string): string {
    const headlineLines = headlineRaw
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const roteiroLines = roteiroRaw
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const participantLines = participantsRaw
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    const hasHeadline = headlineLines.length > 0;
    const hasRoteiro = roteiroLines.length > 0;
    const hasParticipants = participantLines.length > 0;
    const out: string[] = [];

    if (hasHeadline) {
      const cultName = this.extractCultName(headlineLines);
      const serviceTime = this.extractServiceTime(headlineLines);
      const serviceDate = this.extractServiceDate(headlineLines);
      out.push(`${cultName.toUpperCase()} - ${serviceTime} - ${serviceDate} - SARA SEDE INTERIOR SP`);
    }

    if (hasParticipants) {
      const participants = this.extractParticipants(participantLines);
      if (participants.length > 0) {
        if (out.length > 0) out.push('');
        out.push(...participants);
      }
    }

    const songs = hasRoteiro ? this.extractSongs(roteiroLines) : [];
    if (out.length > 0) out.push('');
    out.push('00:00 ABERTURA');
    if (songs.length > 0) {
      out.push(...songs.map((song) => `00:00 ${song.title.toUpperCase()}`));
    }

    return out.join('\n');
  }

  private extractCultName(lines: string[]): string {
    const line = lines.find((l) => /culto/i.test(l));
    if (!line) return 'CULTO';
    return line.replace(/\s+/g, ' ').trim();
  }

  private extractServiceTime(lines: string[]): string {
    const joined = lines.join(' ');
    const normalizedJoined = this.normalize(joined);

    const explicitHm = joined.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (explicitHm) return `${explicitHm[1].padStart(2, '0')}:${explicitHm[2]}`;

    const compactHm = normalizedJoined.match(/\b([01]?\d|2[0-3])\s*([0-5]\d)\b/);
    if (compactHm) return `${compactHm[1].padStart(2, '0')}:${compactHm[2]}`;

    const cultNameNormalized = this.normalize(this.extractCultName(lines));
    if (cultNameNormalized.includes('culto da familia')) {
      if (cultNameNormalized.includes('manha')) return '10H';
      if (cultNameNormalized.includes('noite')) return '19H';
    }

    if (normalizedJoined.includes('manha')) return '10H';
    if (normalizedJoined.includes('noite')) return '19H';

    return '00:00';
  }

  private extractServiceDate(lines: string[]): string {
    const monthMap: Record<string, string> = {
      JAN: '01', FEV: '02', MAR: '03', ABR: '04', MAI: '05', JUN: '06',
      JUL: '07', AGO: '08', SET: '09', OUT: '10', NOV: '11', DEZ: '12',
    };
    const joined = lines.join(' ').toUpperCase();
    const match = joined.match(/\b(\d{1,2})\s*(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\b/);
    if (!match) return new Date().toLocaleDateString('pt-BR');
    const day = match[1].padStart(2, '0');
    const month = monthMap[match[2]] ?? '01';
    const year = String(new Date().getFullYear());
    return `${day}/${month}/${year}`;
  }

  private extractParticipants(lines: string[]): string[] {
    const participants: ParsedParticipant[] = [];
    const roleSet = ['ministro', 'ministros', 'tenor', 'contralto', 'soprano', 'baixo', 'guitarra', 'teclado', 'violao', 'bateria'];
    for (let i = 0; i < lines.length; i++) {
      const inline = this.extractParticipantFromSingleLine(lines[i], roleSet);
      if (inline.length > 0) {
        participants.push(...inline);
        continue;
      }

      const role = this.normalizeRole(lines[i]);
      if (!roleSet.includes(role)) continue;
      if (this.shouldIgnoreRole(role)) continue;
      const name = this.findPreviousName(lines, i);
      if (!name) continue;
      participants.push({ name, role: this.normalizeRole(role) });
    }

    const uniqueByNameRole = new Set<string>();
    const resolved: ResolvedParticipant[] = [];
    for (const p of participants) {
      if (!this.isValidParticipantName(p.name)) continue;
      const key = `${this.normalize(p.name)}::${p.role}`;
      if (uniqueByNameRole.has(key)) continue;
      uniqueByNameRole.add(key);
      const output = this.resolveParticipantOutput(p.name, p.role);
      resolved.push({
        role: this.normalizeRole(p.role),
        output,
        sortKey: this.normalize(p.name),
      });
    }
    return resolved
      .sort((a, b) => {
        const roleA = PARTICIPANT_ROLE_ORDER[a.role] ?? 99;
        const roleB = PARTICIPANT_ROLE_ORDER[b.role] ?? 99;
        if (roleA !== roleB) return roleA - roleB;
        return a.sortKey.localeCompare(b.sortKey);
      })
      .map((r) => r.output);
  }

  private isValidParticipantName(name: string): boolean {
    const n = this.normalize(name);
    if (!n || n.length < 2) return false;
    if (n.includes('musicas') || n.includes('musica') || n.includes('versao') || n.includes('adoracao')) return false;
    if (n.includes('participantes') || n.includes('membros') || n.includes('funcoes') || n.includes('confirmado')) return false;
    if (n === 'iter') return false;
    return true;
  }

  private extractParticipantFromSingleLine(line: string, roleSet: string[]): ParsedParticipant[] {
    const normalized = this.normalize(line);
    const rolesFound = this.extractRolesFromText(normalized).filter((r) => roleSet.includes(r) && !this.shouldIgnoreRole(r));
    if (rolesFound.length === 0) return [];

    const roleIndex = this.firstRoleIndex(normalized);
    if (roleIndex <= 0) return [];
    const nameRaw = line.slice(0, roleIndex).trim();
    if (!nameRaw || nameRaw.length < 3) return [];
    if (/^(membros|funcoes)$/i.test(this.normalize(nameRaw))) return [];

    return rolesFound.map((role) => ({ name: nameRaw, role }));
  }

  private extractRolesFromText(text: string): string[] {
    const roleRegex = /\b(ministros?|tenor|contralto|soprano|baixo|guitarra|teclado|violao|violão|bateria|mesa de som)\b/g;
    const found: string[] = [];
    let match: RegExpExecArray | null = null;
    while ((match = roleRegex.exec(text))) {
      found.push(this.normalizeRole(match[1]));
    }
    return [...new Set(found)];
  }

  private firstRoleIndex(text: string): number {
    const roleRegex = /\b(ministros?|tenor|contralto|soprano|baixo|guitarra|teclado|violao|violão|bateria|mesa de som)\b/;
    const match = roleRegex.exec(text);
    return match?.index ?? -1;
  }

  private normalizeRole(value: string): string {
    const role = this.normalize(value).replace('violao', 'violao').replace('violão', 'violao');
    if (role === 'ministro') return 'ministros';
    return role;
  }

  private shouldIgnoreRole(role: string): boolean {
    return IGNORE_ROLE_TERMS.some((term) => this.normalize(term) === this.normalize(role));
  }

  private findPreviousName(lines: string[], roleIndex: number): string | null {
    for (let i = roleIndex - 1; i >= Math.max(roleIndex - 3, 0); i--) {
      const candidate = lines[i];
      if (!candidate) continue;
      if (/^(membros|funções|\d+\/\d+)$/i.test(candidate)) continue;
      if (/^[\W_]+$/.test(candidate)) continue;
      return candidate;
    }
    return null;
  }

  private resolveParticipantOutput(name: string, roleRaw: string): string {
    const role = this.normalizeRole(roleRaw);
    const normalizedName = this.normalize(name);
    const roster = LOUVE_ROSTER_MAP[role] ?? [];
    if (role === 'bateria' && (normalizedName.includes('pedro') || normalizedName === 'pb')) return '🥁 - Pedro';

    const best = this.findBestMatch(roster, normalizedName);
    if (best) return best.output;

    const icon = this.iconForRole(role);
    return `${icon} - ${name}`;
  }

  private findBestMatch(candidates: LouveRoleEntry[], normalizedName: string): LouveRoleEntry | null {
    const nameTokens = normalizedName.split(' ').filter((t) => t.length >= 3);
    let best: LouveRoleEntry | null = null;
    let bestScore = 0;
    for (const candidate of candidates) {
      const candidateNorm = this.normalize(candidate.output);
      let score = 0;
      for (const token of nameTokens) {
        if (candidateNorm.includes(token)) score += 1;
      }
      for (const alias of candidate.aliases) {
        const aliasNorm = this.normalize(alias);
        if (normalizedName.includes(aliasNorm) || aliasNorm.includes(normalizedName)) {
          score += 3;
        } else {
          const aliasTokens = aliasNorm.split(' ').filter((t) => t.length >= 3);
          for (const token of aliasTokens) {
            if (nameTokens.includes(token)) score += 1;
          }
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    return bestScore > 0 ? best : null;
  }

  private iconForRole(role: string): string {
    if (role === 'teclado') return '🎹';
    if (role === 'violao') return '🪕';
    if (role === 'bateria') return '🥁';
    if (role === 'baixo' || role === 'guitarra') return '🎸';
    if (role === 'ministro' || role === 'ministros') return '🎙️';
    return '🎤';
  }

  private extractSongs(lines: string[]): ParsedSong[] {
    const fromOrdinals = this.extractSongsFromOrdinalBlocks(lines);
    if (fromOrdinals.length > 0) return fromOrdinals;
    const fromMusicasSection = this.extractSongsFromMusicasSection(lines);
    if (fromMusicasSection.length > 0) return fromMusicasSection;
    const fromRoteiro = this.extractSongsFromRoteiro(lines);
    if (fromRoteiro.length > 0) return fromRoteiro;
    return this.extractSongsFromMusicList(lines);
  }

  private extractSongsFromMusicasSection(lines: string[]): ParsedSong[] {
    const startIdx = lines.findIndex((line) => this.normalize(line).includes('musicas'));
    if (startIdx < 0) return [];
    const expectedCount = this.extractExpectedSongCount(lines[startIdx]);
    const songs: ParsedSong[] = [];
    let parts: string[] = [];

    const flush = () => {
      const title = parts.join(' ').trim();
      if (title) songs.push({ title });
      parts = [];
    };

    for (let i = startIdx + 1; i < lines.length; i++) {
      const raw = lines[i];
      const normalized = this.normalize(raw);
      if (this.isSectionBoundary(normalized) && !normalized.startsWith('musica')) break;

      if (/^\s*\d+\s*[ªaº]?\s*$/.test(raw)) {
        if (parts.length > 0) flush();
        continue;
      }

      if (this.isMusicMetadataLine(normalized, raw)) {
        if (parts.length > 0 && (normalized.includes('versao') || normalized.includes('tom ') || normalized.includes('youtube'))) {
          flush();
          if (expectedCount > 0 && songs.length >= expectedCount) break;
        }
        continue;
      }

      if (this.isLikelyArtistLine(raw) && parts.length > 0) {
        flush();
        if (expectedCount > 0 && songs.length >= expectedCount) break;
        continue;
      }

      const cleaned = this.cleanSongFragment(raw);
      if (!cleaned) continue;
      parts.push(cleaned);
      if (parts.length >= 4) flush();
      if (expectedCount > 0 && songs.length >= expectedCount) break;
    }

    if (parts.length > 0 && (expectedCount === 0 || songs.length < expectedCount)) flush();
    const unique = this.uniqueSongs(songs);
    return expectedCount > 0 ? unique.slice(0, expectedCount) : unique;
  }

  private extractSongsFromRoteiro(lines: string[]): ParsedSong[] {
    const songs: ParsedSong[] = [];
    for (let i = 0; i < lines.length; i++) {
      const marker = this.isRoteiroSongMarker(this.normalize(lines[i]));
      if (!marker) continue;
      const parts: string[] = [];
      for (let j = i + 1; j < lines.length; j++) {
        const candidate = lines[j];
        const n = this.normalize(candidate);
        if (this.isRoteiroSongMarker(n)) break;
        if (this.isSectionBoundary(n)) break;
        if (this.isMusicMetadataLine(n, candidate)) {
          if (parts.length > 0) break;
          continue;
        }
        const cleaned = this.cleanSongFragment(candidate);
        if (!cleaned) continue;
        parts.push(cleaned);
      }
      const title = parts.join(' ').trim();
      if (!title) continue;
      songs.push({ title });
    }
    return this.uniqueSongs(songs);
  }

  private extractSongsFromOrdinalBlocks(lines: string[]): ParsedSong[] {
    const songs: ParsedSong[] = [];
    for (let i = 0; i < lines.length; i++) {
      const ordinal = /^\s*(\d+)\s*[ªaº]?\s*$/.exec(lines[i]);
      if (!ordinal) continue;
      const parts: string[] = [];
      for (let j = i + 1; j < lines.length; j++) {
        const candidate = lines[j];
        const n = this.normalize(candidate);
        if (/^\s*\d+\s*[ªaº]?\s*$/.test(candidate)) break;
        if (this.isSectionBoundary(n)) break;
        if (this.isMusicMetadataLine(n, candidate)) {
          if (parts.length > 0) break;
          continue;
        }
        const cleaned = this.cleanSongFragment(candidate);
        if (!cleaned) continue;
        parts.push(cleaned);
        if (parts.length >= 3) break;
      }
      const title = parts.join(' ').trim();
      if (!title) continue;
      songs.push({ title });
    }
    return this.uniqueSongs(songs);
  }

  private extractSongsFromMusicList(lines: string[]): ParsedSong[] {
    const songs: ParsedSong[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const songMatch = /^\s*(\d+)\s*[ªa]?\s+(.+)$/i.exec(line);
      if (!songMatch) continue;
      const title = this.cleanSongFragment(songMatch[2]);
      if (!title) continue;
      songs.push({ title });
    }
    return this.uniqueSongs(songs);
  }

  private isRoteiroSongMarker(normalizedLine: string): boolean {
    return /^m\w*sica(?:\s*\d+)?$/.test(normalizedLine);
  }

  private extractExpectedSongCount(line: string): number {
    const match = /m[uú]sicas?\s*\((\d+)\)/i.exec(line);
    if (!match) return 0;
    const n = Number.parseInt(match[1], 10);
    return Number.isFinite(n) ? n : 0;
  }

  private isLikelyArtistLine(line: string): boolean {
    const raw = line.trim();
    if (!raw) return false;
    const normalized = this.normalize(raw);
    if (this.isMusicMetadataLine(normalized, raw)) return false;
    if (normalized.includes('/')) return false;
    const words = normalized.split(' ').filter(Boolean);
    if (words.length < 2 || words.length > 4) return false;
    if (words.some((w) => w.length <= 1)) return false;
    return words.every((w) => /^[a-z]+$/.test(w));
  }

  private uniqueSongs(songs: ParsedSong[]): ParsedSong[] {
    const seen = new Set<string>();
    const result: ParsedSong[] = [];
    for (const song of songs) {
      const key = this.normalize(song.title);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(song);
    }
    return result;
  }

  private isSectionBoundary(normalizedLine: string): boolean {
    return [
      'participantes',
      'observacoes',
      'roteiro',
      'escala',
      'culto',
      'historico',
      'membros',
      'funcoes',
      'ministro',
      'tenor',
      'contralto',
      'soprano',
      'bateria',
      'guitarra',
      'baixo',
    ].some((term) => normalizedLine.startsWith(term));
  }

  private isMusicMetadataLine(normalizedLine: string, rawLine?: string): boolean {
    if (!normalizedLine) return true;
    const raw = (rawLine ?? '').trim();
    if (/^\d{1,2}:\d{2}$/.test(raw)) return true;
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(raw)) return true;
    if (/^\d{1,2}[.,]\d{2}$/.test(raw)) return true;
    if (/^\d+\s*[ªaº]?$/.test(normalizedLine)) return true;
    if (/^\d+\/\d+$/.test(normalizedLine)) return true;
    if (/^\d{1,2}\s+\d{2}$/.test(normalizedLine)) return true;
    if (/^\d{1,2}\s+\d{2}\s+\d{2}$/.test(normalizedLine)) return true;
    if (normalizedLine.includes('versao')) return true;
    if (normalizedLine.includes('youtube')) return true;
    if (normalizedLine.includes('adoracao')) return true;
    if (normalizedLine.includes('tom ')) return true;
    if (normalizedLine.includes('confirmado')) return true;
    if (normalizedLine.includes('musicas')) return true;
    if (/^\d+\s*vers/.test(normalizedLine)) return true;
    return false;
  }

  private cleanSongFragment(line: string): string {
    const raw = line.replace(/[•·]/g, ' ').trim();
    if (!raw) return '';
    const normalized = this.normalize(raw);
    if (this.isMusicMetadataLine(normalized, raw)) return '';
    if (normalized.length < 3) return '';
    return raw;
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Mark}/gu, '')
      .replace(/[^\w\s@.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
