import { Link, useNavigate } from 'react-router-dom';
import { signOut, useAuth } from '../auth/AuthProvider.jsx';
import { dashboardPathFor, isApproved } from '../auth/permissions.js';

export default function Unauthorized() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const rejected = profile?.approval_status === 'rejected';
  const destination = isApproved(profile) ? dashboardPathFor(profile) : '/';

  return (
    <section className="section section-cream auth-status">
      <div className="container">
        <div className="auth-status-card">
          <p className="auth-status-kicker">{rejected ? 'Access closed' : 'Not allowed'}</p>
          <h1 className="section-title">{rejected ? 'This account was not approved' : "You don't have access to that page"}</h1>
          <p>
            {rejected
              ? `The ${profile.role} account for ${user?.email} was rejected. If you think this is a mistake, email denver@steelcitycodes.org.`
              : 'That page is limited to another role. You can keep using the pages your account is allowed to open.'}
          </p>
          <div className="auth-status-actions">
            <Link className="arrow-button arrow-button-yellow" to={destination}>
              {isApproved(profile) ? 'Go to my dashboard' : 'Back to home'} <span aria-hidden="true">→</span>
            </Link>
            <button
              type="button"
              className="admin-link-button"
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
