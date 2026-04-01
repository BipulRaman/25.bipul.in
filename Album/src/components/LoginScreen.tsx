import type { RefObject } from 'react';

interface LoginScreenProps {
  googleBtnRef: RefObject<HTMLDivElement | null>;
  authError: string;
}

export default function LoginScreen({ googleBtnRef, authError }: LoginScreenProps) {
  return (
    <div className="login-screen">
      <div className="login-card">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64" className="login-logo-icon">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <h1 className="login-title">Album Viewer</h1>
        <p className="login-subtitle">Sign in to continue</p>
        <div ref={googleBtnRef} className="login-btn-container" />
        {authError && <p className="login-error">{authError}</p>}
      </div>
    </div>
  );
}
