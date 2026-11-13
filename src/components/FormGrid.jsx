import { useEffect, useRef } from 'react';
import FadeIn from './FadeIn.jsx';
import { logActivity } from '../data/activity.js';
import { useUser } from '../data/auth.js';

function logFormOpen(form, user, audience, { once = true } = {}) {
  const key = `scc-form-open:${form.title}`;
  if (once) {
    try {
      if (sessionStorage.getItem(key) === '1') return;
      sessionStorage.setItem(key, '1');
    } catch {
      // Private mode: still log.
    }
  }
  logActivity('form_open', {
    form: form.title,
    email: user?.email,
    name: user?.name,
    role: user?.role,
    audience,
    path: window.location.pathname,
  });
}

function FormCard({ form, index, user, audience }) {
  const frameRef = useRef(null);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) logFormOpen(form, user, audience);
      },
      { threshold: 0.45 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [audience, form, user]);

  return (
    <FadeIn className="form-card" variant={index % 2 === 0 ? 'left' : 'right'}>
      <span className="form-number">{index + 1}</span>
      <h3>{form.title}</h3>
      <p>{form.description}</p>
      <div className="form-frame" ref={frameRef}>
        <iframe src={form.embedUrl} title={form.title} loading="lazy">
          Loading…
        </iframe>
      </div>
      <a
        className="arrow-button"
        href={form.openUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => logFormOpen(form, user, audience, { once: false })}
      >
        Open full form <span aria-hidden="true">↗</span>
      </a>
    </FadeIn>
  );
}

export default function FormGrid({ forms, audience }) {
  const user = useUser();
  return (
    <div className="forms-grid">
      {forms.map((form, i) => (
        <FormCard key={form.title} form={form} index={i} user={user} audience={audience} />
      ))}
    </div>
  );
}
