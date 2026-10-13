// Server-side description cleanup. The browser re-sanitises before rendering,
// but a request can be crafted by hand, so nothing hostile is stored either.
// Tags outside the allowlist are dropped and every surviving tag is rewritten
// from scratch, which discards all attributes (onerror=, style=, ...) with them.

export const MAX_DESCRIPTION_LENGTH = 2000;

const ALLOWED_TAGS = new Set(['b', 'strong', 'i', 'em', 'u', 'ol', 'ul', 'li', 'p', 'br', 'a']);

// contentEditable in some browsers emits DIVs for new lines. Dropping the tag
// would run those lines together, so it is renamed rather than discarded.
const RENAMED_TAGS = { div: 'p' };

const SAFE_URL = /^(https?:\/\/|mailto:)/i;

// Tags whose contents must go with them rather than being left as loose text.
const DROP_WITH_CONTENT = /<(script|style|title|textarea|iframe|object|embed|noscript)\b[\s\S]*?<\/\1\s*>/gi;

// A tag name must follow `<` immediately and start with a letter, so prose like
// "5 < 6 and 7 > 2" is treated as text rather than swallowed as markup.
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;

function safeHref(raw) {
    const cleaned = String(raw).replace(/[\u0000-\u0020\u007f-\u00a0]/g, '');
    return SAFE_URL.test(cleaned) ? cleaned : null;
}

// Only angle brackets are escaped: `&` is left alone because the client already
// sends escaped entities and re-escaping would turn `&amp;` into `&amp;amp;`.
function escapeText(value) {
    return value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttribute(value) {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderTag(closing, rawTag, attrs) {
    const tag = RENAMED_TAGS[rawTag.toLowerCase()] || rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return '';
    if (closing) return `</${tag}>`;
    if (tag === 'br') return '<br>';

    if (tag === 'a') {
        const href = /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
        const value = href ? (href[2] ?? href[3] ?? href[4] ?? '') : '';
        const safe = value && safeHref(value);
        if (!safe) return '';
        return `<a href="${escapeAttribute(safe)}" target="_blank" rel="noopener noreferrer nofollow">`;
    }

    return `<${tag}>`;
}

export function sanitizeDescription(input) {
    if (typeof input !== 'string' || !input.trim()) return '';

    let html = input.slice(0, MAX_DESCRIPTION_LENGTH * 2);

    // Comments can hide a payload that re-forms once the comment markers go.
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    html = html.replace(DROP_WITH_CONTENT, '');

    let out = '';
    let lastIndex = 0;
    let match;

    TAG.lastIndex = 0;
    while ((match = TAG.exec(html)) !== null) {
        out += escapeText(html.slice(lastIndex, match.index));
        out += renderTag(match[1], match[2], match[3]);
        lastIndex = TAG.lastIndex;
    }
    out += escapeText(html.slice(lastIndex));

    return out.trim().slice(0, MAX_DESCRIPTION_LENGTH);
}
