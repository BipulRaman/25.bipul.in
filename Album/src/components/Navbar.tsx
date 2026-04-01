import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import type { GoogleUser } from '../pages/Unauthorized';

interface NavbarProps {
  user: GoogleUser;
  onSignOut: () => void;
}

export default function Navbar({ user, onSignOut }: NavbarProps) {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <span>Album Viewer</span>
      </Link>
      <div className="nav-actions">
        <button className="theme-toggle" onClick={() => setDark(d => !d)} aria-label="Toggle theme">
          {dark ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
        <div className="nav-user-menu" ref={menuRef}>
          <button className="nav-user-btn" onClick={() => setMenuOpen(o => !o)} title={user.name}>
            <img src={user.picture} alt={user.name} className="nav-avatar" />
          </button>
          {menuOpen && (
            <div className="nav-dropdown">
              <div className="nav-dropdown-header">
                <span className="nav-dropdown-name">{user.name}</span>
                <span className="nav-dropdown-email">{user.email}</span>
              </div>
              <div className="nav-dropdown-divider" />
              <button className="nav-dropdown-item" onClick={() => { setMenuOpen(false); onSignOut(); }}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
