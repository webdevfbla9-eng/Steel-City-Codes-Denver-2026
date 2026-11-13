export default function AuthLoading({ message = 'Checking your account…' }) {
  return (
    <section className="section section-cream auth-status" aria-busy="true" aria-live="polite">
      <div className="container">
        <div className="auth-status-card">
          <span className="auth-spinner" aria-hidden="true" />
          <h1 className="section-title">{message}</h1>
          <p>This only takes a moment.</p>
        </div>
      </div>
    </section>
  );
}
