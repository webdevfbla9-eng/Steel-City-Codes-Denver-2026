import { useEffect, useMemo, useState } from 'react';
import { useInquiries } from '../lib/InquiriesProvider.jsx';
import { formatInquiryTime, INQUIRY_STATUSES, inquiryStatusLabel, respondToInquiry, updateInquiry } from '../lib/inquiries.js';

export default function AdminInquiries() {
  const { inquiries, loading, error, notice, setInquiries, refresh } = useInquiries();
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState('');
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const visible = useMemo(() => {
    const rows = filter === 'all' ? inquiries : inquiries.filter((item) => (item.status || 'pending') === filter);
    return rows;
  }, [filter, inquiries]);

  const selected = inquiries.find((item) => item.id === selectedId) || visible[0] || null;

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  useEffect(() => {
    setResponse(selected?.admin_response || '');
    setActionError('');
  }, [selected?.id]);

  const applyUpdate = async (id, changes) => {
    setBusy(true);
    setActionError('');
    try {
      const row = await updateInquiry(id, changes);
      setInquiries((prev) => prev.map((item) => (item.id === row.id ? row : item)));
      setSelectedId(row.id);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const sendResponse = async (event) => {
    event.preventDefault();
    if (!selected || busy) return;
    setBusy(true);
    setActionError('');
    try {
      const row = await respondToInquiry(selected.id, response);
      setInquiries((prev) => prev.map((item) => (item.id === row.id ? row : item)));
      setResponse('');
      setSelectedId(row.id);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section section-cream">
      <div className="container">
        <h2 className="section-title">Parent Inquiries</h2>
        <p className="body-large section-intro">Questions submitted by parents. Read them here and send a response the parent will see on their dashboard.</p>
        {notice ? (
          <p className="inquiry-notice" role="status">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="inquiry-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="admin-pills" role="group" aria-label="Filter inquiries">
          {[{ id: 'all', label: 'All' }, ...INQUIRY_STATUSES].map((item) => (
            <button
              key={item.id}
              type="button"
              className={filter === item.id ? 'is-active' : ''}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {loading ? (
          <p className="admin-empty">Loading inquiries…</p>
        ) : visible.length === 0 ? (
          <p className="admin-empty">No parent inquiries in this filter.</p>
        ) : (
          <div className="inquiry-board">
            <ul className="inquiry-list">
              {visible.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`inquiry-list-item${item.id === selected?.id ? ' is-active' : ''}`}
                    onClick={() => {
                      setSelectedId(item.id);
                      setResponse(item.admin_response || '');
                      setActionError('');
                    }}
                  >
                    <strong>{item.name || 'Parent'}</strong>
                    <span>{item.email}</span>
                    <span className="inquiry-list-preview">{item.question}</span>
                    <em className={`inquiry-status inquiry-status-${item.status || 'pending'}`}>
                      {inquiryStatusLabel(item.status || 'pending')}
                    </em>
                    <time dateTime={item.created_at}>{formatInquiryTime(item.created_at)}</time>
                  </button>
                </li>
              ))}
            </ul>
            {selected ? (
              <article className="inquiry-detail">
                <header className="inquiry-detail-head">
                  <div>
                    <h3>{selected.name || 'Parent'}</h3>
                    <p>
                      {selected.email} · submitted {formatInquiryTime(selected.created_at)}
                    </p>
                  </div>
                  <em className={`inquiry-status inquiry-status-${selected.status || 'pending'}`}>
                    {inquiryStatusLabel(selected.status || 'pending')}
                  </em>
                </header>
                <p className="inquiry-question">{selected.question}</p>
                <div className="inquiry-status-actions">
                  <button type="button" className="admin-link-button" disabled={busy} onClick={() => applyUpdate(selected.id, { status: 'in_progress' })}>
                    Mark in progress
                  </button>
                  <button type="button" className="admin-link-button" disabled={busy} onClick={() => applyUpdate(selected.id, { status: 'answered' })}>
                    Mark answered
                  </button>
                  <button type="button" className="admin-link-button" disabled={busy} onClick={() => applyUpdate(selected.id, { status: 'closed' })}>
                    Mark closed
                  </button>
                </div>
                {selected.admin_response ? (
                  <div className="inquiry-response-saved">
                    <h4>Administrator response</h4>
                    <p>{selected.admin_response}</p>
                    {selected.responded_at ? <time dateTime={selected.responded_at}>Sent {formatInquiryTime(selected.responded_at)}</time> : null}
                  </div>
                ) : null}
                <form className="inquiry-response-form" onSubmit={sendResponse}>
                  <label htmlFor="inquiry-response">Response</label>
                  <textarea
                    id="inquiry-response"
                    rows={5}
                    value={response}
                    onChange={(event) => setResponse(event.target.value)}
                    placeholder="Write a response the parent will see on their dashboard…"
                  />
                  {actionError ? (
                    <p className="inquiry-error" role="alert">
                      {actionError}
                    </p>
                  ) : null}
                  <button type="submit" className="arrow-button arrow-button-yellow" disabled={busy || !response.trim()}>
                    {busy ? 'Saving…' : 'Send Response'}
                  </button>
                </form>
              </article>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
