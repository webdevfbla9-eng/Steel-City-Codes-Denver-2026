import { Link } from 'react-router-dom';

export default function StudentNoAccess() {
  return (
    <section className="section section-cream auth-status">
      <div className="container">
        <div className="auth-status-card">
          <p className="auth-status-kicker">Students</p>
          <h1 className="section-title">You don’t have access to this page</h1>
          <p>The Volunteers page is for volunteers, parents, and administrators. Head back to the Students page to keep learning.</p>
          <div className="auth-status-actions">
            <Link className="arrow-button arrow-button-yellow" to="/students">
              Go back to Students <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
