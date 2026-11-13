import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';
import { getNavLinks, homePathFor, isAdmin } from '../auth/permissions.js';
import { useInquiries } from '../lib/InquiriesProvider.jsx';

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, profile } = useAuth();
  const { unreadCount } = useInquiries();
  const links = getNavLinks(profile);
  const showInquiryBadge = isAdmin(profile) && unreadCount > 0;

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <button
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="primary-nav"
          aria-label="Toggle navigation"
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav id="primary-nav" className={`nav ${open ? 'is-open' : ''}`}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
              {link.label}
              {link.to === '/admin' && showInquiryBadge ? (
                <span className="inquiry-unread">{unreadCount > 9 ? '9+' : unreadCount}</span>
              ) : null}
            </NavLink>
          ))}
          <NavLink className="nav-account" to={user ? homePathFor(profile) : '/signin'} onClick={() => setOpen(false)}>
            {user?.avatarUrl ? <img className="nav-avatar" src={user.avatarUrl} alt="" /> : null}
            {user ? 'My Dashboard' : 'Sign in'}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
