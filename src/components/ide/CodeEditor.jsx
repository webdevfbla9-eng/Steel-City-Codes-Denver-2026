import { useRef } from 'react';

export default function CodeEditor({ value, onChange, readOnly = false, label, indent = '    ' }) {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const escapedRef = useRef(false);
  const lineCount = value.split('\n').length;

  const insert = (text) => {
    const ta = textareaRef.current;
    ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
    onChange(ta.value);
  };

  const handleKeyDown = (event) => {
    if (readOnly) return;

    if (event.key === 'Escape') {
      escapedRef.current = true;
      return;
    }

    if (event.key === 'Tab' && !escapedRef.current) {
      event.preventDefault();
      insert(indent);
      return;
    }
    escapedRef.current = false;

    if (event.key === 'Enter') {
      event.preventDefault();
      const ta = textareaRef.current;
      const before = ta.value.slice(0, ta.selectionStart);
      const currentLine = before.slice(before.lastIndexOf('\n') + 1);
      const leading = currentLine.match(/^\s*/)[0];
      const opensBlock = /[:{([]\s*$/.test(currentLine);
      insert('\n' + leading + (opensBlock ? indent : ''));
    }
  };

  return (
    <div className="code-editor">
      <div className="code-gutter" ref={gutterRef} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={(e) => {
          gutterRef.current.scrollTop = e.target.scrollTop;
        }}
        readOnly={readOnly}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        aria-label={label}
        wrap="off"
      />
    </div>
  );
}
