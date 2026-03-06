/**
 * Utilitários compartilhados para exibição/edição do MAPA BACKS (HTML exportado do Google Docs).
 * Usado por Recording e Sync Editor.
 */

/** Seletor dos blocos (parágrafos/divs) no HTML normalizado — deve ser o mesmo nas duas páginas. */
export const MAP_BACKS_BLOCK_SELECTOR = '.doc-fix-wrapper p, .doc-fix-wrapper > div';

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
 * e retorna a quantidade de blocos. Use o mesmo seletor em Recording e Sync Editor.
 */
export function enumerateMapBlocks(mapHtmlContent: Element | null): number {
  if (!mapHtmlContent) return 0;
  const blocks = mapHtmlContent.querySelectorAll(MAP_BACKS_BLOCK_SELECTOR);
  blocks.forEach((el, i) => ((el as HTMLElement).dataset['blockIndex'] = String(i)));
  return blocks.length;
}
