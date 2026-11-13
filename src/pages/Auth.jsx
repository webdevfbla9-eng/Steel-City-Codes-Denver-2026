import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ShiftHeading from '../components/ShiftHeading.jsx';
import { roles, signIn, signOut, signUp, useAuth } from '../data/auth.js';
import { homePathFor } from '../auth/permissions.js';
import { logActivity } from '../data/activity.js';

const memberPerks = [
  'Track your daily coding challenge streak',
  'See your volunteer assessment progress',
  'Follow up on IDE requests and questions',
  'Quick links picked for students, parents, or volunteers',
];

const adminPerks = [
  'Approve volunteer and parent accounts',
  'Manage roles without changing your own',
  'Open every page on the site',
  'Review activity on the site',
];

function AuthShell({ title, admin = false, children }) {
  return (
    <section className="section section-cream auth-section">
      <div className="container">
        <div className="auth-card">
          <aside className="auth-aside">
            <ShiftHeading text={title} className="auth-title" />
            <p>
              {admin
                ? 'Use this page to create an admin account or sign in to the dashboard.'
                : 'One account for everything Steel City Codes Denver.'}
            </p>
            <ul className="auth-perks">
              {(admin ? adminPerks : memberPerks).map((perk) => (
                <li key={perk}>{perk}</li>
              ))}
            </ul>
          </aside>
          <div className="auth-main">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Field({ id, label, hint, ...props }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...props} aria-describedby={hint ? `${id}-hint` : undefined} />
      {hint && (
        <small id={`${id}-hint`} className="auth-hint">
          {hint}
        </small>
      )}
    </div>
  );
}

function AlreadySignedIn({ user, profile }) {
  return (
    <div className="auth-signed-in">
      <p>
        You're signed in as <strong>{user.name}</strong>.
      </p>
      <Link className="arrow-button arrow-button-yellow" to={homePathFor(profile)}>
        Continue <span aria-hidden="true">→</span>
      </Link>
      <button type="button" className="admin-link-button" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}

export function SignUp() {
  const { user, profile, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const admin = location.pathname.startsWith('/admin/');
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: admin ? 'admin' : 'student',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    setValues((prev) => ({ ...prev, role: admin ? 'admin' : prev.role === 'admin' ? 'student' : prev.role }));
  }, [admin]);

  if (user) {
    return (
      <AuthShell title={admin ? 'Admin sign up' : 'Sign up'} admin={admin}>
        <AlreadySignedIn user={user} profile={profile} />
      </AuthShell>
    );
  }

  const update = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (values.password.length < 8) return setError('Your password needs at least 8 characters.');
    if (values.password !== values.confirm) return setError("Those passwords don't match.");
    setBusy(true);
    try {
      const data = await signUp(values);
      logActivity('account_created', {
        name: values.name,
        email: values.email,
        role: values.role,
      });
      if (!data.session) {
        setCheckEmail(true);
        setBusy(false);
        return;
      }
      navigate(data.profile ? homePathFor(data.profile) : admin ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (checkEmail) {
    return (
      <AuthShell title={admin ? 'Admin sign up' : 'Sign up'} admin={admin}>
        <div className="auth-signed-in">
          <p>Sign in with the account you just created.</p>
          <Link className="arrow-button arrow-button-yellow" to={admin ? '/admin/signin' : '/signin'}>
            Go to sign in <span aria-hidden="true">→</span>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={admin ? 'Admin sign up' : 'Sign up'} admin={admin}>
      <form className="auth-form" onSubmit={submit}>
        {!configured && <p className="auth-error">Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file.</p>}
        {admin ? null : (
          <fieldset className="auth-roles">
            <legend>I am a…</legend>
            {roles.map((role) => (
              <label key={role.id} className={values.role === role.id ? 'is-active' : ''}>
                <input type="radio" name="role" value={role.id} checked={values.role === role.id} onChange={update('role')} />
                {role.label}
              </label>
            ))}
          </fieldset>
        )}
        <Field id="signup-name" label="Full name" value={values.name} onChange={update('name')} required autoComplete="name" />
        <Field id="signup-email" label="Email" type="email" value={values.email} onChange={update('email')} required autoComplete="email" />
        <Field
          id="signup-password"
          label="Password"
          type="password"
          value={values.password}
          onChange={update('password')}
          required
          minLength={8}
          autoComplete="new-password"
          hint="At least 8 characters"
        />
        <Field id="signup-confirm" label="Confirm password" type="password" value={values.confirm} onChange={update('confirm')} required autoComplete="new-password" />
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="arrow-button arrow-button-yellow auth-submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'} <span aria-hidden="true">→</span>
        </button>
        <p className="auth-switch">
          Already have an account? <Link to={admin ? '/admin/signin' : '/signin'}>Sign in</Link>
        </p>
        <p className="auth-switch">
          {admin ? (
            <>
              Not an admin? <Link to="/signup">Create a member account</Link>
            </>
          ) : (
            <>
              Admin? <Link to="/admin/signup">Create an admin account</Link>
            </>
          )}
        </p>
      </form>
    </AuthShell>
  );
}

export function SignIn() {
  const { user, profile, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const admin = location.pathname.startsWith('/admin/');
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const redirected = Boolean(location.state?.from);

  if (user) {
    return (
      <AuthShell title={admin ? 'Admin sign in' : 'Sign in'} admin={admin}>
        <AlreadySignedIn user={user} profile={profile} />
      </AuthShell>
    );
  }

  const update = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await signIn({ ...values, asAdmin: admin });
      const nextPath = location.state?.from || (data.profile ? homePathFor(data.profile) : admin ? '/admin' : '/dashboard');
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthShell title={admin ? 'Admin sign in' : 'Sign in'} admin={admin}>
      <form className="auth-form" onSubmit={submit}>
        {!configured && <p className="auth-error">Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file.</p>}
        {redirected && !admin && <p className="auth-notice">Please sign in to continue.</p>}
        <Field id="signin-email" label="Email" type="email" value={values.email} onChange={update('email')} required autoComplete="email" />
        <Field id="signin-password" label="Password" type="password" value={values.password} onChange={update('password')} required autoComplete="current-password" />
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="arrow-button arrow-button-yellow auth-submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'} <span aria-hidden="true">→</span>
        </button>
        <p className="auth-switch">
          {admin ? (
            <>
              Need an admin account? <Link to="/admin/signup">Create one</Link>
            </>
          ) : (
            <>
              New to Steel City Codes? <Link to="/signup">Create an account</Link>
            </>
          )}
        </p>
        <p className="auth-switch">
          {admin ? (
            <>
              Not an admin? <Link to="/signin">Member sign in</Link>
            </>
          ) : (
            <>
              Admin? <Link to="/admin/signin">Admin sign in</Link>
            </>
          )}
        </p>
      </form>
    </AuthShell>
  );
}
