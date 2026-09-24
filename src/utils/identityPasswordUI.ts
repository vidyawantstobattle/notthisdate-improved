// ===== NETLIFY IDENTITY PASSWORD UI =====
// The Identity widget renders its form inside a same-origin `about:blank` iframe,
// so this enhancement has to reach into `iframe.contentDocument` and can't rely on
// the app's stylesheets (the iframe inherits none of them).
//
// Note: the vanilla implementation queried the *parent* document, which never
// matched the widget's inputs — this is the first working version.

import { PASSWORD_RULES, validatePassword } from '../core/password';

const IFRAME_SELECTOR = 'iframe#netlify-identity-widget';
const ENHANCED_ATTR = 'data-ntd-pw-enhanced';
const STYLE_ID = 'ntd-password-styles';

const STYLES = `
.ntd-pw-host { position: relative; }
.ntd-pw-host input { padding-right: 40px !important; }
.ntd-pw-toggle {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: #8a9a86;
  padding: 4px; line-height: 0; z-index: 2;
}
.ntd-pw-toggle:hover { color: #2c3529; }
.ntd-pw-rules {
  margin-top: 8px; padding: 10px; background: #f5f4f0;
  border-radius: 6px; font-size: 12px;
}
.ntd-pw-rules p { margin: 0 0 6px 0; font-weight: 500; color: #2c3529; }
.ntd-pw-rules ul { margin: 0; padding: 0; list-style: none; }
.ntd-pw-rules li {
  display: flex; align-items: center; gap: 6px; padding: 2px 0;
  color: #8a9a86; transition: color 0.15s;
}
.ntd-pw-rules li[data-valid="true"] { color: #30c67c; }
.ntd-pw-rules .ntd-pw-icon { width: 14px; text-align: center; }
`;

const EYE_OPEN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_CLOSED = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

function injectStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  doc.head?.appendChild(style);
}

// Signup asks for a name as well; login only has email + password. The name field
// carries no `type` attribute, so match on the property rather than a selector.
function isSignupForm(input: HTMLInputElement): boolean {
  const scope = input.closest('form') ?? input.ownerDocument.body;
  return [...scope.querySelectorAll('input')].some(i => (i as HTMLInputElement).type === 'text');
}

// The widget is itself React-driven, so the input is never re-parented — doing so
// makes its reconciler duplicate the field. Additions are appended as siblings.
function addToggle(input: HTMLInputElement, doc: Document): void {
  const host = input.parentElement;
  if (!host || host.querySelector('.ntd-pw-toggle')) return;
  host.classList.add('ntd-pw-host');

  const button = doc.createElement('button');
  button.type = 'button';
  button.className = 'ntd-pw-toggle';
  button.setAttribute('aria-label', 'Show password');
  button.innerHTML = EYE_OPEN;
  host.appendChild(button);

  button.addEventListener('click', e => {
    e.preventDefault();
    const revealing = input.type === 'password';
    input.type = revealing ? 'text' : 'password';
    input.dataset.ntdPwRevealed = String(revealing);
    button.innerHTML = revealing ? EYE_CLOSED : EYE_OPEN;
    button.setAttribute('aria-label', revealing ? 'Hide password' : 'Show password');
  });
}

function addRequirements(input: HTMLInputElement, doc: Document): void {
  const host = input.parentElement;
  if (!host || host.parentElement?.querySelector('.ntd-pw-rules')) return;

  const panel = doc.createElement('div');
  panel.className = 'ntd-pw-rules';

  const heading = doc.createElement('p');
  heading.textContent = 'Password must contain:';
  panel.appendChild(heading);

  const list = doc.createElement('ul');
  const items = new Map<string, HTMLElement>();

  for (const rule of PASSWORD_RULES) {
    const li = doc.createElement('li');
    li.dataset.valid = 'false';

    const icon = doc.createElement('span');
    icon.className = 'ntd-pw-icon';
    icon.textContent = '○';

    const label = doc.createElement('span');
    label.textContent = rule.message;

    li.append(icon, label);
    list.appendChild(li);
    items.set(rule.id, li);
  }

  panel.appendChild(list);
  host.parentNode?.insertBefore(panel, host.nextSibling);

  const sync = () => {
    for (const { id, valid } of validatePassword(input.value)) {
      const li = items.get(id);
      if (!li) continue;
      li.dataset.valid = String(valid);
      const icon = li.querySelector('.ntd-pw-icon');
      if (icon) icon.textContent = valid ? '✓' : '○';
    }
  };

  input.addEventListener('input', sync);
  sync(); // the widget can re-render with a value already in the field
}

// The widget recycles input nodes when swapping between its login and signup
// forms, which drags our markers onto unrelated fields (e.g. the email box).
// Drop enhancements from any input that is no longer a password field.
function pruneRecycled(doc: Document): void {
  doc.querySelectorAll<HTMLInputElement>(`input[${ENHANCED_ATTR}]`).forEach(input => {
    const revealed = input.dataset.ntdPwRevealed === 'true';
    if (input.type === 'password' || (revealed && input.type === 'text')) return;

    input.removeAttribute(ENHANCED_ATTR);
    delete input.dataset.ntdPwRevealed;
    const host = input.parentElement;
    host?.querySelectorAll('.ntd-pw-toggle').forEach(node => node.remove());
    host?.classList.remove('ntd-pw-host');
    host?.parentElement?.querySelectorAll(':scope > .ntd-pw-rules').forEach(node => node.remove());
  });
}

function enhance(doc: Document): void {
  pruneRecycled(doc);

  const inputs = doc.querySelectorAll<HTMLInputElement>(`input[type="password"]:not([${ENHANCED_ATTR}])`);
  if (inputs.length === 0) return;

  injectStyles(doc);
  for (const input of inputs) {
    input.setAttribute(ENHANCED_ATTR, 'true');
    const signup = isSignupForm(input);
    addToggle(input, doc);
    if (signup) addRequirements(input, doc);
  }
}

// Watches for the widget iframe and, once present, for its form re-rendering
// (the widget swaps between login/signup without recreating the iframe).
export function observeIdentityPasswordFields(): () => void {
  const innerObservers = new Map<HTMLIFrameElement, MutationObserver>();

  const attach = (frame: HTMLIFrameElement) => {
    if (innerObservers.has(frame)) return;
    const doc = frame.contentDocument;
    if (!doc) return;

    const inner = new MutationObserver(() => enhance(doc));
    inner.observe(doc.body ?? doc, { childList: true, subtree: true });
    innerObservers.set(frame, inner);
    enhance(doc);
  };

  const scan = () => {
    document.querySelectorAll<HTMLIFrameElement>(IFRAME_SELECTOR).forEach(frame => {
      if (frame.contentDocument?.body) {
        attach(frame);
      } else {
        frame.addEventListener('load', () => attach(frame), { once: true });
      }
    });
  };

  const outer = new MutationObserver(scan);
  outer.observe(document.body, { childList: true, subtree: true });
  scan();

  return () => {
    outer.disconnect();
    innerObservers.forEach(o => o.disconnect());
    innerObservers.clear();
  };
}
