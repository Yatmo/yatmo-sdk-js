import type { YatmoSummaryText, YatmoTextParagraph } from './models.js';

export interface RenderTextOptions {
  /** `html` (default), `markdown` or `plain`. */
  format?: 'html' | 'markdown' | 'plain';
  /** HTML heading tag of the paragraph titles (html format). Defaults to `h3`. `null` drops the titles. */
  heading?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | null;
  /**
   * Which title to use: `street-city` (default) names the street in the first title and the city in
   * the second, which reads naturally and helps search engines; `city` never names the street
   * (discreet listings); `generic` uses the plain titles.
   */
  titles?: 'street-city' | 'city' | 'generic';
  /** Only these paragraph types, in this order. Defaults to every paragraph as sent. */
  paragraphs?: string[];
  /** Keep the key places in bold (`<strong>` or `**`). Defaults to true. */
  strong?: boolean;
  /** Extra class of the wrapping `<div>` (html format). */
  className?: string;
}

const STRONG_OPEN = '[STRONG]';
const STRONG_CLOSE = '[/STRONG]';

/** Removes the `[STRONG]` markers. */
export function stripMarkers(text: string): string {
  return text.split(STRONG_OPEN).join('').split(STRONG_CLOSE).join('');
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

/** Escapes a sentence and turns the markers into `<strong>`. */
export function sentenceToHtml(sentence: string, strong = true): string {
  const escaped = escapeHtml(sentence.trim());
  return strong
    ? escaped.split(STRONG_OPEN).join('<strong>').split(STRONG_CLOSE).join('</strong>')
    : stripMarkers(escaped);
}

function sentenceToMarkdown(sentence: string, strong = true): string {
  const trimmed = sentence.trim();
  return strong ? trimmed.split(STRONG_OPEN).join('**').split(STRONG_CLOSE).join('**') : stripMarkers(trimmed);
}

function titleOf(paragraph: YatmoTextParagraph, index: number, mode: RenderTextOptions['titles']): string {
  if (mode === 'generic') return paragraph.title;
  if (mode === 'city') return (index === 0 && paragraph.titleCity) || paragraph.title;
  if (index === 0 && paragraph.titleStreet) return paragraph.titleStreet;
  if (index === 1 && paragraph.titleCity) return paragraph.titleCity;
  return paragraph.title;
}

function selectParagraphs(text: YatmoSummaryText, wanted?: string[]): YatmoTextParagraph[] {
  if (!wanted?.length) return text.paragraphs;
  const lower = wanted.map((w) => w.toLowerCase());
  return text.paragraphs.filter((p) => lower.includes(p.iconId.toLowerCase()));
}

/**
 * Renders a resolved neighbourhood text as HTML (headings and paragraphs, ready to write into a
 * page so search engines index it), Markdown or plain text.
 */
export function renderSummaryText(text: YatmoSummaryText, options: RenderTextOptions = {}): string {
  const format = options.format ?? 'html';
  const strong = options.strong ?? true;
  const titles = options.titles ?? 'street-city';
  const paragraphs = selectParagraphs(text, options.paragraphs);

  if (format === 'html') {
    const heading = options.heading === undefined ? 'h3' : options.heading;
    const parts = paragraphs.map((p, i) => {
      let html = '';
      if (heading) html += `<${heading}>${escapeHtml(titleOf(p, i, titles))}</${heading}>`;
      if (p.sentences.length) html += `<p>${p.sentences.map((s) => sentenceToHtml(s, strong)).join(' ')}</p>`;
      if (p.items.length) html += `<ul>${p.items.map((s) => `<li>${sentenceToHtml(s, strong)}</li>`).join('')}</ul>`;
      return html;
    });
    const className = ['yatmo-text', options.className ?? ''].filter(Boolean).join(' ');
    return `<div class="${escapeHtml(className)}">${parts.join('')}</div>`;
  }

  if (format === 'markdown') {
    return paragraphs
      .map((p, i) => {
        const lines = [`### ${titleOf(p, i, titles)}`, ''];
        if (p.sentences.length) lines.push(p.sentences.map((s) => sentenceToMarkdown(s, strong)).join(' '));
        if (p.items.length) lines.push(...p.items.map((s) => `- ${sentenceToMarkdown(s, strong)}`));
        return lines.join('\n');
      })
      .join('\n\n');
  }

  return paragraphs
    .map((p, i) => [titleOf(p, i, titles), ...p.sentences.map(stripMarkers), ...p.items.map((s) => `- ${stripMarkers(s)}`)].join('\n'))
    .join('\n\n');
}
