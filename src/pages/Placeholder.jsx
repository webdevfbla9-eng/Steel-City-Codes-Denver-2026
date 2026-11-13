import { Link } from 'react-router-dom';

export default function Placeholder({ title }) {
  return (
    <section className="section section-cream placeholder">
      <div className="container">
        <h1 className="section-title">{title}</h1>
        <p>This page is coming soon.</p>
        <Link to="/" className="arrow-button">
          Back to home <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
