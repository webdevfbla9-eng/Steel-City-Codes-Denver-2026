import { useId, useState } from 'react';
import { logActivity } from '../data/activity.js';
import { useUser } from '../data/auth.js';

export default function MessageForm({ type, fields, submitLabel, successMessage, className = '', onSubmit }) {
  const baseId = useId();
  const user = useUser();
  const empty = Object.fromEntries(fields.map((field) => [field.name, (user && user[field.name]) || '']));
  const [values, setValues] = useState(empty);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (sending) return;
    const data = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value || '').trim()]));
    const missing = fields.some((field) => field.required && !data[field.name]);
    if (missing) {
      setError('Please complete all required fields.');
      return;
    }
    setSending(true);
    setError('');
    try {
      if (onSubmit) await onSubmit(data);
      else logActivity(type, { ...data, status: 'new' });
      setValues(empty);
      setSent(true);
    } catch (err) {
      setError(err.message || 'That question could not be sent.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className={`message-form message-form-sent ${className}`} role="status">
        <span className="message-form-check" aria-hidden="true">
          ✓
        </span>
        <p>{successMessage}</p>
        <button type="button" className="arrow-button" onClick={() => setSent(false)}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form className={`message-form ${className}`} onSubmit={submit}>
      {fields.map((field) => {
        const id = `${baseId}-${field.name}`;
        const props = {
          id,
          name: field.name,
          value: values[field.name],
          required: field.required,
          placeholder: field.placeholder,
          autoComplete: field.autoComplete,
          disabled: sending,
          onChange: (event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value })),
        };
        return (
          <div key={field.name} className={`message-field${field.multiline ? ' message-field-wide' : ''}`}>
            <label htmlFor={id}>
              {field.label}
              {field.required && <span aria-hidden="true"> *</span>}
            </label>
            {field.multiline ? <textarea rows={4} {...props} /> : <input type={field.type || 'text'} {...props} />}
          </div>
        );
      })}
      {error ? (
        <p className="message-form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="arrow-button arrow-button-yellow message-submit" disabled={sending}>
        {sending ? 'Sending…' : submitLabel} {sending ? null : <span aria-hidden="true">→</span>}
      </button>
    </form>
  );
}
