/**
 * Utilitários compartilhados para exibição/edição do MAPA BACKS (HTML exportado do Google Docs).
 * Usado por Recording e Sync Editor.
 */

/** Seletor dos blocos (parágrafos/divs) no HTML normalizado — deve ser o mesmo nas duas páginas. */
export const MAP_BACKS_BLOCK_SELECTOR = '.doc-fix-wrapper p, .doc-fix-wrapper > div';

/** Padrões que indicam título de seção (Introdução, Interlúdio, Verso 1, etc.). Usado para dividir um &lt;p&gt; em vários blocos. */
const SECTION_HEADER_PATTERNS: RegExp[] = [
  /^Introdução\b/i,
  /^Interlúdio\b/i,
  /^Verso\s*\d/i,
  /^Refrão\b/i,
  /^Ponte\b/i,
  /^Coda\b/i,
  /^Coro\b/i,
  /^Preparação\b/i,
  /^Bridge\b/i,
  / - \(\dº?\s*vez\)/,
  / - \[\s*[\w\s]+\]$/,
];

function isSectionHeaderText(text: string): boolean {
  const t = (text ?? '').trim();
  return t.length > 0 && SECTION_HEADER_PATTERNS.some((p) => p.test(t));
}

/** Retorna o texto do nó (para elemento ou nó de texto). */
function getNodeText(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? '').trim();
  if (node.nodeType === Node.ELEMENT_NODE) return ((node as Element).textContent ?? '').trim();
  return '';
}

/**
 * Se um <p> contiver título de seção (Introdução, Verso 1, Interlúdio, etc.) junto com letra,
 * divide em dois blocos: um só com o título, outro com o resto. Assim "Verso 1 - (2º vez)" e
 * "Socorro Deus" viram <p> separados. Considera elementos e nós de texto (export do Doc pode usar <br>).
 */
function splitParagraphAtSectionHeaders(wrapper: Element): void {
  const selector = MAP_BACKS_BLOCK_SELECTOR;
  let didSplit: boolean;
  do {
    didSplit = false;
    const blocks = wrapper.querySelectorAll(selector);
    for (const el of Array.from(blocks)) {
      if (el.tagName !== 'P') continue;
      const p = el as HTMLParagraphElement;
      const nodes = Array.from(p.childNodes);
      let splitIdx = -1;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const text = getNodeText(node);
        if (text && isSectionHeaderText(text)) {
          splitIdx = i;
          break;
        }
      }
      if (splitIdx < 0 || nodes.length <= 1) continue;
      // Se o título é o primeiro nó, dividir depois dele; senão, dividir antes do título
      const moveFrom = splitIdx === 0 ? 1 : splitIdx;
      const newP = document.createElement('p');
      const style = p.getAttribute('style');
      if (style) newP.setAttribute('style', style);
      while (p.childNodes.length > moveFrom) {
        newP.appendChild(p.childNodes[moveFrom]);
      }
      p.parentNode?.insertBefore(newP, p.nextSibling);
      didSplit = true;
      break;
    }
  } while (didSplit);
}

/**
 * Corrige HTML exportado do Google Docs: remove clip à esquerda, injeta estilo e wrapper.
 * Retorna HTML pronto para [innerHTML] com blocos consistentes para data-block-index.
 */
export function normalizeDocHtml(html: string): string {
  const fixInlineStyles = (raw: string) =>
    raw.replace(/style="([^"]*)"/gi, (_match: string, style: string) => {
      let s = style
        .replace(/\boverflow\s*:\s*(?:hidden|auto|scroll)\b/gi, 'overflow:visible')
        .replace(/\bmax-width\s*:\s*[^;]+;?/gi, '')
        .replace(/\bcontain\s*:\s*[^;]+;?/gi, '');
      s = s.replace(/\bmargin-left\s*:\s*-[^;]+;?/gi, 'margin-left:0 !important;');
      s = s.replace(/\bleft\s*:\s*-[^;]+;?/gi, 'left:0 !important;');
      return `style="${s}"`;
    });

  const fixed = fixInlineStyles(html);
  const wrapOpen =
    '<div class="doc-fix-wrapper" style="overflow:visible;display:block;box-sizing:border-box;">';
  const wrapClose = '</div>';
  const styleOverride =
    '<style data-doc-fix="">.doc-fix-wrapper *{overflow:visible !important;contain:none !important;}.doc-fix-wrapper,.doc-fix-wrapper body{margin-left:0 !important;}</style>';
  return styleOverride + wrapOpen + fixed + wrapClose;
}

/**
 * Enumera os blocos do mapa dentro de .map-html-content (atributo data-block-index)
 * e retorna a quantidade de blocos. Antes, divide parágrafos que tenham título de seção
 * (ex.: "Interlúdio") no meio, para que cada bloco corresponda a uma linha lógica.
 */
export function enumerateMapBlocks(mapHtmlContent: Element | null): number {
  if (!mapHtmlContent) return 0;
  splitParagraphAtSectionHeaders(mapHtmlContent);
  const blocks = mapHtmlContent.querySelectorAll(MAP_BACKS_BLOCK_SELECTOR);
  blocks.forEach((el, i) => ((el as HTMLElement).dataset['blockIndex'] = String(i)));
  return blocks.length;
}
