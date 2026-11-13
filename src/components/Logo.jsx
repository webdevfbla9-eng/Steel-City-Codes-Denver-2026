import { useState } from 'react';
import { Link } from 'react-router-dom';

// Drop the logo file at public/logo.png; until then a text wordmark is shown.
export default function Logo({ className = '' }) {
  const [failed, setFailed] = useState(false);

  return (
    <Link to="/" className={`logo ${className}`} aria-label="Steel City Codes Denver home">
      {failed ? (
        <span className="logo-wordmark">
          Steel City Codes <span className="logo-accent">Denver</span>
        </span>
      ) : (
        <img src="/logo.png" alt="Steel City Codes Denver" onError={() => setFailed(true)} />
      )}
    </Link>
  );
}
