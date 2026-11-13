import { Link, Navigate, useNavigate } from 'react-router-dom';
import { signOut, useAuth } from '../auth/AuthProvider.jsx';
import { APPROVAL, homePathFor } from '../auth/permissions.js';

export default function Pending() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  if (profile && profile.approval_status !== APPROVAL.PENDING) {
    return <Navigate to={homePathFor(profile)} replace />;
  }
  const role = profile?.role || 'account';

  return (
    <section className="section section-cream auth-status">
      <div className="container">
        <div className="auth-status-card">
          <p className="auth-status-kicker">Approval needed</p>
          <h1 className="section-title">Your {role} account is pending</h1>
          <p>
            Thanks{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! An admin still needs to approve your{' '}
            {role} account before you can open {role} pages or your dashboard. We'll email you at{' '}
            <strong>{user?.email}</strong> after that review.
          </p>
          <div className="auth-status-actions">
            <Link className="arrow-button" to="/">
              Back to home <span aria-hidden="true">→</span>
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
