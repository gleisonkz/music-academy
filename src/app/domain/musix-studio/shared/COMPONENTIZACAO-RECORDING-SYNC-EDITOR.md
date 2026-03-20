# Componentização: Recording e Sync Editor

Resumo do que **já foi unificado** e do que **ainda pode** ser componentizado entre as páginas **Gravação** e **Editor de Sincronia**.

---

## Já compartilhado

- **`SyncPointsListComponent`** (`ma-sync-points-list`) – lista de pontos com seek e opção de remover. Usado nas duas páginas.
- **`TrackAudioPlayerComponent`** (`ma-track-audio-player`) – player de áudio. Usado nas duas.
- **`RecordingState`** – interface do state ao vir do Kit Ensaio (recording exporta, sync-editor importa).
- **`map-backs-doc.ts`** – `normalizeDocHtml()`, `enumerateMapBlocks()` e `MAP_BACKS_BLOCK_SELECTOR`. Usado nas duas para tratar o HTML do MAPA BACKS e enumerar blocos.

---

## Candidatos a componente / shared (opcional)

### 1. Bloco “Áudio de apoio” na sidebar

- **Recording:** título “Áudio de apoio”, `fileName`, player, botão “Trocar arquivo”, `(timeUpdate)`.
- **Sync Editor:** título “Áudio de apoio”, `fileName`, player (sem trocar arquivo, sem timeUpdate).

Um componente tipo **`BackingAudioSectionComponent`** com inputs `fileName`, `backingAudioUrl`, outputs `timeUpdate`, `removeBacking` (opcional) e um slot para ações extras (ex.: “Trocar arquivo”) reduz duplicação de template e estilos (`.section-label`, `.file-name`, `.backing-audio`).

### 2. Área do mapa (HTML / texto / loading)

- **Recording:** `hasMapBacks()`, `mapBacksIsHtml()`, `mapBacksIsText()`, `mapBacksIsPdf()`, `map-html-content` com `[innerHTML]`, `map-text-content`, iframe, “Abrir em nova aba”, “Carregando mapa...”.
- **Sync Editor:** mesma estrutura para HTML e texto (sem PDF nem link).

Um componente **`MapBacksViewComponent`** com inputs para `html`, `safeHtml`, `text`, `isHtml`, `isText`, `isPdf`, `safeUrl` (e um `#mapContainer` ou output do elemento) permitiria um único template para “mapa em HTML / texto / loading” e estilos comuns (incl. `.map-html-content`, `.map-text-content`, `.map-loading`). Cada página continuaria responsável por buscar dados e passar para o componente.

### 3. State inicial do “contexto” (áudio + mapa)

- As duas leem `Router.getCurrentNavigation()?.extras?.state as RecordingState` e setam os mesmos signals: `backingAudioUrl`, `fileName`, `mapBacksUrl`, `mapBacksFileName`, `mapBacksMimeType` (e no recording também `syncMapUrl`; no sync-editor `driveFolderId`, `driveAccessToken`, `syncMapUrl`).

Uma função shared **`applyRecordingStateToSignals(state: RecordingState, signals: {...})`** ou um pequeno service que expõe esses signals e um método `setFromNavigationState()` reduziria a duplicação no constructor. Opcional: só vale se quiserem evoluir esse state (ex.: restore por URL no sync-editor também).

### 4. Carregamento do mapa por URL

- **Recording:** `loadMapAndSyncFromCurrentUrls()` – fetch do `mapBacksUrl` (text/html ou text/plain) e do `syncMapUrl` (JSON).
- **Sync Editor:** no `ngOnInit`, fetch do `mapBacksUrl` apenas.

A parte “fetch URL → se html então normalizeDocHtml, senão set text” é repetida. Uma função **`loadMapContentFromUrl(url: string, mimeType: string): Promise<{ html: string | null; text: string | null }>`** em `map-backs-doc.ts` (ou em um `map-backs-loader.service.ts`) poderia ser usada pelas duas, com cada uma setando seus signals e, no recording, fazendo em paralelo o fetch do sync JSON.

---

## Estilos CSS repetidos

- `.section-label`, `.section-hint`, `.file-name`, `.backing-section` (e variantes) aparecem nas duas.
- `.map-html-content` e estilos para `.doc-fix-wrapper` são muito parecidos (recording tem mais regras para spotlight e responsivo).

Se criarem **`MapBacksViewComponent`** e/ou **`BackingAudioSectionComponent`**, faz sentido mover esses estilos para os respectivos componentes. Alternativa: um SCSS parcial compartilhado (ex.: `_map-backs-shared.scss`, `_sidebar-sections-shared.scss`) importado nas duas páginas.

---

## Resumo

- **Feito:** lógica do MAPA BACKS (normalize + enumeração de blocos) centralizada em **`map-backs-doc.ts`** e usada em Recording e Sync Editor.
- **Próximos passos opcionais:** extrair “Áudio de apoio” e “área do mapa” em componentes e, se quiserem, shared de state/carregamento de mapa por URL.
