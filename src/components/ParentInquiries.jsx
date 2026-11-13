import RevealHeading from './RevealHeading.jsx';
import { useInquiries } from '../lib/InquiriesProvider.jsx';
import { formatInquiryTime, inquiryStatusLabel } from '../lib/inquiries.js';

export default function ParentInquiries({
  id,
  heading = 'Your Questions',
  intro,
  tone = 'dark',
}) {
  const { inquiries, loading, error } = useInquiries();
  const answered = inquiries.filter((item) => Boolean(item.admin_response));
  const waiting = inquiries.filter((item) => !item.admin_response);

  return (
    <section className={`section ${tone === 'light' ? 'section-cream' : 'section-dark'}`} id={id}>
      <div className="container">
        <RevealHeading className="section-title">{heading}</RevealHeading>
        {intro ? (
          <p className="body-large section-intro">{intro}</p>
        ) : null}
        {error ? (
          <p className="inquiry-error" role="alert">
            {error}
          </p>
        ) : null}
        {loading ? (
          <p className="body-large section-intro">Loading replies…</p>
        ) : inquiries.length === 0 ? (
          <p className="body-large section-intro">
            You have not sent a question yet. Use the form on the Parents page, and an administrator’s reply will show up here.
          </p>
        ) : (
          <div className="parent-inquiry-groups">
            {answered.length > 0 ? (
              <div className="parent-inquiry-group">
                <h3 className="parent-inquiry-group-title">Replies from our team</h3>
                <ul className="parent-inquiry-list">
                  {answered.map((item) => (
                    <InquiryCard key={item.id} item={item} />
                  ))}
                </ul>
              </div>
            ) : (
              <p className="body-large section-intro">
                No administrator replies yet. As soon as someone answers, it will appear in this section.
              </p>
            )}
            {waiting.length > 0 ? (
              <div className="parent-inquiry-group">
                <h3 className="parent-inquiry-group-title">Waiting for a reply</h3>
                <ul className="parent-inquiry-list">
                  {waiting.map((item) => (
                    <InquiryCard key={item.id} item={item} />
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function InquiryCard({ item }) {
  return (
    <li className={`parent-inquiry-card${item.admin_response ? ' has-response' : ''}`}>
      <div className="parent-inquiry-head">
        <time dateTime={item.created_at}>{formatInquiryTime(item.created_at)}</time>
        <em className={`inquiry-status inquiry-status-${item.status || 'pending'}`}>
          {inquiryStatusLabel(item.status || 'pending')}
        </em>
      </div>
      <h4 className="parent-inquiry-label">Your question</h4>
      <p className="inquiry-question">{item.question}</p>
      {item.admin_response ? (
        <div className="inquiry-response-saved">
          <h4>Administrator response</h4>
          <p>{item.admin_response}</p>
          {item.responded_at ? <time dateTime={item.responded_at}>Sent {formatInquiryTime(item.responded_at)}</time> : null}
        </div>
      ) : (
        <p className="parent-inquiry-waiting">No administrator response yet.</p>
      )}
    </li>
  );
}
