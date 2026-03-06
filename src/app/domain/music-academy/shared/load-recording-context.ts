/**
 * Carrega o contexto da Gravação (áudio + mapa + sync) a partir do Drive usando token e IDs.
 * Usado pela página de Gravação para restaurar estado após F5 (queryParams na URL).
 */

const FOLDER_MIME = 'application/vnd.google-apps.folder';
const GOOGLE_DOCS_MIME = 'application/vnd.google-apps.document';
const MAPA_BACKS_NAME = 'MAPA BACKS';
const SYNC_MAP_NAME_PART = 'sync-map';

export interface RecordingContextResult {
  backingAudioUrl: string;
  fileName: string;
  mapBacksUrl: string;
  mapBacksFileName: string;
  mapBacksMimeType: string;
  syncMapUrl: string | null;
}

interface DriveFile {
  id: string;
  name?: string;
  mimeType?: string;
}

function apiFetch<T>(url: string, token: string): Promise<T> {
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => {
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res.json() as Promise<T>;
  });
}

export async function loadRecordingContextFromDrive(
  token: string,
  audioId: string,
  folderIds: string
): Promise<RecordingContextResult> {
  const breadcrumb = folderIds
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => ({ id, name: '' }));
  if (breadcrumb.length === 0) throw new Error('folderIds inválido.');

  const fileMeta = await apiFetch<DriveFile>(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(audioId)}?fields=name`,
    token
  );
  const fileName = fileMeta.name ?? 'Áudio do Kit Ensaio';

  const audioRes = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(audioId)}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!audioRes.ok) throw new Error(`Erro ${audioRes.status} ao baixar o áudio.`);
  const audioBlob = await audioRes.blob();
  const backingAudioUrl = URL.createObjectURL(audioBlob);

  const searchName = MAPA_BACKS_NAME.toUpperCase();
  let mapBacksUrl = '';
  let mapBacksFileName = '';
  let mapBacksMimeType = '';
  for (let i = breadcrumb.length - 1; i >= 0; i--) {
    const folderId = breadcrumb[i].id;
    const data = await apiFetch<{ files?: DriveFile[] }>(
      `https://www.googleapis.com/drive/v3/files?q='${encodeURIComponent(folderId)}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)`,
      token
    ).catch(() => ({ files: [] }));
    const files = data.files ?? [];
    const mapBacks = files.find((f) => (f.name ?? '').toUpperCase().includes(searchName));
    if (!mapBacks) continue;
    const isGoogleDoc = (mapBacks.mimeType ?? '').includes(GOOGLE_DOCS_MIME);
    const downloadUrl = isGoogleDoc
      ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(mapBacks.id)}/export?mimeType=text%2Fhtml`
      : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(mapBacks.id)}?alt=media`;
    const res = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Erro ${res.status} ao baixar o MAPA BACKS.`);
    const blob = await res.blob();
    mapBacksUrl = URL.createObjectURL(blob);
    mapBacksFileName = mapBacks.name ?? 'MAPA BACKS';
    mapBacksMimeType = isGoogleDoc ? 'text/html' : (mapBacks.mimeType ?? '');
    break;
  }
  if (!mapBacksUrl) {
    throw new Error('MAPA BACKS não encontrado. Abra pelo Kit Ensaio.');
  }

  const searchPart = SYNC_MAP_NAME_PART.toUpperCase();
  let syncMapUrl: string | null = null;
  for (let i = breadcrumb.length - 1; i >= 0; i--) {
    const folderId = breadcrumb[i].id;
    const data = await apiFetch<{ files?: DriveFile[] }>(
      `https://www.googleapis.com/drive/v3/files?q='${encodeURIComponent(folderId)}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)`,
      token
    ).catch(() => ({ files: [] }));
    const files = data.files ?? [];
    const syncMapFile = files.find((f) => {
      const name = (f.name ?? '').toUpperCase();
      const mime = (f.mimeType ?? '').toLowerCase();
      return name.includes(searchPart) && (name.endsWith('.JSON') || mime.includes('json'));
    });
    if (!syncMapFile) continue;
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(syncMapFile.id)}?alt=media`;
    const res = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) continue;
    const blob = await res.blob();
    syncMapUrl = URL.createObjectURL(blob);
    break;
  }

  return {
    backingAudioUrl,
    fileName,
    mapBacksUrl,
    mapBacksFileName,
    mapBacksMimeType,
    syncMapUrl,
  };
}
