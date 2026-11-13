import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';
import { getNavLinks } from '../auth/permissions.js';

export default function Footer() {
  const { profile } = useAuth();
  const links = getNavLinks(profile);

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Logo />
        <nav className="footer-column" aria-label="Footer">
          <p className="footer-heading">Pages</p>
          <ul className="footer-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            {links.map((page) => (
              <li key={page.to}>
                <Link to={page.to}>{page.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="footer-column">
          <p className="footer-heading">Contact</p>
          <ul className="footer-links">
            <li>
              <span className="footer-label">Email:</span>{' '}
              <a href="mailto:denver@steelcitycodes.org">denver@steelcitycodes.org</a>
            </li>
            <li>
              <span className="footer-label">Instagram:</span>{' '}
              <a
                href="https://www.instagram.com/steelcitycodesdenver?cplk=MXY3NjdjODcyd2MwMQ=="
                target="_blank"
                rel="noopener noreferrer"
              >
                steelcitycodesdenver
              </a>
            </li>
          </ul>
        </div>
      </div>
      <p className="container footer-note">
        © {new Date().getFullYear()} Steel City Codes Denver. A region of Steel City Codes, a 501(c)(3)
        nonprofit.
      </p>
    </footer>
  );
}
