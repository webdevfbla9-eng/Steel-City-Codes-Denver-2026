import FadeIn from './FadeIn.jsx';
import { logActivity } from '../data/activity.js';
import { useUser } from '../data/auth.js';

export default function FormGrid({ forms, audience }) {
  const user = useUser();
  return (
    <div className="forms-grid">
      {forms.map((form, i) => (
        <FadeIn key={form.title} className="form-card" variant={i % 2 === 0 ? 'left' : 'right'}>
          <span className="form-number">{i + 1}</span>
          <h3>{form.title}</h3>
          <p>{form.description}</p>
          <div className="form-frame">
            <iframe src={form.embedUrl} title={form.title} loading="lazy">
              Loading…
            </iframe>
          </div>
          <a
            className="arrow-button"
            href={form.openUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              logActivity('form_open', {
                form: form.title,
                email: user?.email,
                name: user?.name,
                role: user?.role,
                audience,
              })
            }
          >
            Open full form <span aria-hidden="true">↗</span>
          </a>
        </FadeIn>
      ))}
    </div>
  );
}
