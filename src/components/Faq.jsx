import { useId, useState } from 'react';

export default function Faq({ items }) {
  const [open, setOpen] = useState(null);
  const baseId = useId();

  return (
    <div className="faq">
      {items.map((item, i) => {
        const isOpen = open === i;
        const buttonId = `${baseId}-q${i}`;
        const panelId = `${baseId}-a${i}`;
        return (
          <div key={item.question} className={`faq-item${isOpen ? ' is-open' : ''}`}>
            <h3 className="faq-question">
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span>{item.question}</span>
                <span className="faq-icon" aria-hidden="true" />
              </button>
            </h3>
            <div className="faq-panel" id={panelId} role="region" aria-labelledby={buttonId}>
              <div className="faq-answer">{item.answer}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
