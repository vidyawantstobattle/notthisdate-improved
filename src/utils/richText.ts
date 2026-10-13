// ===== RICH TEXT SANITISING =====
// Calendar descriptions are authored by the organiser but read by everyone who
// opens the share link, so the stored markup is untrusted input to every other
// viewer. Nothing here ever hands an attacker-controlled string to innerHTML:
// the output is rebuilt tag by tag from an allowlist walk of a parsed document,
// and all text is escaped on the way out.

const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'OL', 'UL', 'LI', 'A', 'P', 'BR']);

// Tags that carry no meaning on their own but whose children we keep.
const UNWRAPPED_TAGS = new Set(['SPAN', 'FONT', 'SECTION', 'ARTICLE']);

// contentEditable in some browsers wraps each new line in a DIV. Dropping the
// wrapper outright would silently run the lines together, so it is rewritten to
// a paragraph when it holds a single line of inline content.
const LINE_WRAPPER_TAGS = new Set(['DIV']);

const BLOCK_TAGS = new Set(['OL', 'UL', 'LI', 'P']);

// Only schemes that can't execute script. `javascript:`, `data:` and `vbscript:`
// are the classic payload carriers and are rejected along with everything else.
const SAFE_URL = /^(https?:\/\/|mailto:)/i;

export const MAX_RICH_TEXT_LENGTH = 2000;

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Strips the control characters and whitespace that let `java\0script:` style
// payloads slip past a naive prefix check.
function safeHref(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[\u0000-\u0020\u007f-\u00a0]/g, '');
  if (!SAFE_URL.test(cleaned)) return null;
  return cleaned;
}

function serializeChildren(node: Node): string {
  let out = '';
  node.childNodes.forEach(child => {
    out += serializeNode(child);
  });
  return out;
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeText(node.textContent || '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node as Element;
  const tag = element.tagName.toUpperCase();

  if (tag === 'BR') return '<br>';

  if (UNWRAPPED_TAGS.has(tag)) return serializeChildren(element);

  if (LINE_WRAPPER_TAGS.has(tag)) {
    const inner = serializeChildren(element);
    if (!inner.trim()) return '';
    // Already block-structured inside, so adding a paragraph would nest blocks.
    if (/<(p|ol|ul|li)>/i.test(inner)) return inner;
    return `<p>${inner}</p>`;
  }

  // Anything not explicitly allowed (script, style, iframe, img, svg, ...) is
  // dropped entirely along with its contents.
  if (!ALLOWED_TAGS.has(tag)) return '';

  const inner = serializeChildren(element);

  if (tag === 'A') {
    const href = safeHref(element.getAttribute('href'));
    if (!href) return inner;
    return `<a href="${escapeText(href)}" target="_blank" rel="noopener noreferrer nofollow">${inner}</a>`;
  }

  // An empty inline tag is just noise; empty list items keep their slot.
  if (!inner.trim() && !BLOCK_TAGS.has(tag)) return '';

  const lower = tag.toLowerCase();
  return `<${lower}>${inner}</${lower}>`;
}

export function sanitizeRichText(html: string): string {
  if (!html) return '';

  // DOMParser builds an inert document: scripts don't run and lazy resources
  // (img/iframe src) are never fetched, so parsing hostile markup is safe.
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const result = serializeChildren(doc.body).trim();

  return result.slice(0, MAX_RICH_TEXT_LENGTH);
}

export function richTextToPlainText(html: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

export function isRichTextEmpty(html: string): boolean {
  return richTextToPlainText(html).length === 0;
}
