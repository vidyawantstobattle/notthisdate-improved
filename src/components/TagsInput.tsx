import { useRef, useState, type KeyboardEvent } from 'react';

interface TagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

function TagsInput({ tags, onChange, placeholder = 'Type a name and press Enter', disabled = false, id }: TagsInputProps) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    // Names are the participant's identity on the calendar, so keep duplicates out case-insensitively.
    if (tags.some(t => t.toLowerCase() === name.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...tags, name]);
    setDraft('');
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === 'Backspace' && !draft && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div
      className="tags-input-container"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, index) => (
        <span key={`${tag}-${index}`} className="tag">
          {tag}
          <button
            type="button"
            className="tag-remove"
            aria-label={`Remove ${tag}`}
            onClick={(e) => {
              e.stopPropagation();
              removeTag(index);
            }}
            disabled={disabled}
          >
            &times;
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        className="tags-input"
        value={draft}
        placeholder={tags.length === 0 ? placeholder : ''}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(draft)}
        disabled={disabled}
      />
    </div>
  );
}

export default TagsInput;
