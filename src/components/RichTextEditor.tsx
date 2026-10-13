import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { sanitizeRichText, MAX_RICH_TEXT_LENGTH } from '../utils/richText';

interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

type Command = 'bold' | 'italic' | 'underline' | 'insertOrderedList';

const COMMANDS: { command: Command; labelKey: string; icon: string }[] = [
  { command: 'bold', labelKey: 'richText.bold', icon: 'B' },
  { command: 'italic', labelKey: 'richText.italic', icon: 'I' },
  { command: 'underline', labelKey: 'richText.underline', icon: 'U' },
  { command: 'insertOrderedList', labelKey: 'richText.numberedList', icon: '1.' }
];

const SAFE_URL = /^(https?:\/\/|mailto:)/i;

function RichTextEditor({ id, value, onChange, placeholder, disabled }: RichTextEditorProps) {
  const { t } = useI18n();
  const editorRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  // execCommand works off the live selection, which is gone once focus moves to
  // the link field, so the range is parked here while the panel is open.
  const savedRange = useRef<Range | null>(null);

  const [isEmpty, setIsEmpty] = useState(true);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [message, setMessage] = useState('');

  // The last HTML this editor handed upwards. Sanitising is lossy, so the value
  // that comes back down rarely matches the DOM character for character; without
  // this record every keystroke would look like an external edit.
  const lastEmitted = useRef<string | null>(null);

  // Writing the prop back into the DOM moves the caret to the start of the
  // field, so it only happens for edits that did not originate here (loading an
  // existing description, a parent reset, etc).
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (value !== lastEmitted.current) {
      editor.innerHTML = sanitizeRichText(value);
      lastEmitted.current = value;
    }
    setIsEmpty(!editor.textContent?.trim());
  }, [value]);

  useEffect(() => {
    if (linkOpen) linkInputRef.current?.focus();
  }, [linkOpen]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    setIsEmpty(!editor.textContent?.trim());
    const html = sanitizeRichText(editor.innerHTML);
    lastEmitted.current = html;
    onChange(html);
  };

  // Caret position stops mattering once focus leaves, so this is the safe moment
  // to replace whatever markup the browser produced with the sanitised version.
  const handleBlur = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = sanitizeRichText(editor.innerHTML);
    if (editor.innerHTML !== html) editor.innerHTML = html;
    lastEmitted.current = html;
    setIsEmpty(!editor.textContent?.trim());
    onChange(html);
  };

  // Chrome and Safari default to wrapping new lines in DIVs, which are not in
  // the allowlist. Paragraphs survive sanitising, so Enter keeps its line break.
  const handleFocus = () => {
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p');
    } catch {
      // Firefox already separates with <p> and may reject the call.
    }
  };

  const runCommand = (command: Command) => {
    editorRef.current?.focus();
    document.execCommand(command);
    emitChange();
  };

  const openLinkPanel = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0 || selection.isCollapsed ||
        !editor.contains(selection.anchorNode)) {
      setMessage(t('richText.selectTextFirst'));
      return;
    }

    savedRange.current = selection.getRangeAt(0).cloneRange();
    setMessage('');
    setLinkUrl('https://');
    setLinkOpen(true);
  };

  const closeLinkPanel = () => {
    setLinkOpen(false);
    setLinkUrl('');
    savedRange.current = null;
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    if (!SAFE_URL.test(url)) {
      setMessage(t('richText.linkInvalid'));
      return;
    }

    const editor = editorRef.current;
    const range = savedRange.current;
    if (!editor || !range) return;

    editor.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    document.execCommand('createLink', false, url);
    emitChange();
    setMessage('');
    closeLinkPanel();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    // Pasting from a web page would otherwise drop a whole foreign DOM in here.
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    emitChange();
  };

  return (
    <div className={`rich-text-editor${disabled ? ' is-disabled' : ''}`}>
      <div className="rich-text-toolbar" role="toolbar" aria-label={t('richText.toolbarLabel')}>
        {COMMANDS.map(({ command, labelKey, icon }) => (
          <button
            key={command}
            type="button"
            className={`rich-text-btn is-${command}`}
            title={t(labelKey)}
            aria-label={t(labelKey)}
            disabled={disabled}
            // Keeps the selection alive: focus must not leave the editable area.
            onMouseDown={e => e.preventDefault()}
            onClick={() => runCommand(command)}
          >
            {icon}
          </button>
        ))}
        <button
          type="button"
          className="rich-text-btn is-link"
          title={t('richText.link')}
          aria-label={t('richText.link')}
          aria-expanded={linkOpen}
          disabled={disabled}
          onMouseDown={e => e.preventDefault()}
          onClick={openLinkPanel}
        >
          🔗
        </button>
      </div>

      {linkOpen && (
        <div className="rich-text-link-panel">
          <input
            ref={linkInputRef}
            type="url"
            className="rich-text-link-input"
            value={linkUrl}
            placeholder="https://example.com"
            aria-label={t('richText.linkPrompt')}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
              if (e.key === 'Escape') closeLinkPanel();
            }}
          />
          <button type="button" className="btn btn-small btn-primary" onClick={applyLink}>
            {t('richText.linkApply')}
          </button>
          <button type="button" className="btn btn-small btn-outline" onClick={closeLinkPanel}>
            {t('common.cancel')}
          </button>
        </div>
      )}

      <div
        id={id}
        ref={editorRef}
        className="rich-text-surface"
        contentEditable={!disabled}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        data-placeholder={placeholder}
        data-empty={isEmpty}
        onInput={emitChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPaste={handlePaste}
        suppressContentEditableWarning
      />

      <p className={`rich-text-hint${message ? ' is-error' : ''}`} role={message ? 'alert' : undefined}>
        {message || t('richText.hint', { max: MAX_RICH_TEXT_LENGTH })}
      </p>
    </div>
  );
}

export default RichTextEditor;
