import { useState, useCallback, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, useConfig } from './context/ConfigContext';
import LoginScreen from './components/LoginScreen';
import Navbar from './components/Navbar';
import AlbumList from './pages/AlbumList';
import AccessDenied, { type GoogleUser } from './pages/Unauthorized';
import { accessConfig, getAllowedPages, isEmailAllowed } from './access';

const GOOGLE_CLIENT_ID = '184212477429-11bg6qkc0q5401fqov4hdvett37l3l8g.apps.googleusercontent.com';

function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

const SESSION_KEY = 'album_user';

function loadSession(): { user: GoogleUser; pages: string[] } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.user && Array.isArray(data.pages)) return data;
  } catch { /* ignore */ }
  return null;
}

function saveSession(user: GoogleUser, pages: string[]) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, pages }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function AuthenticatedApp({ user, onSignOut }: { user: GoogleUser; onSignOut: () => void }) {
  const { config } = useConfig();
  if (!config) {
    return (
      <div className="unauthorized-page">
        <div className="unauthorized-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <h1>No Album Token</h1>
          <p>A valid access token is required to view albums.</p>
          <p className="unauthorized-hint">Signed in as {user.email}</p>
          <button className="access-denied-btn" onClick={onSignOut} style={{ marginTop: '16px' }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="app-layout">
      <Navbar user={user} onSignOut={onSignOut} />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<AlbumList />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const saved = loadSession();
  const [user, setUser] = useState<GoogleUser | null>(saved?.user ?? null);
  const [denied, setDenied] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [, setAllowedPages] = useState<string[]>(saved?.pages ?? []);

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => {
          const payload = decodeJwtPayload(response.credential);
          const email = payload.email as string;
          const u: GoogleUser = {
            name: payload.name as string,
            email,
            picture: payload.picture as string,
          };
          if (!isEmailAllowed(accessConfig, email)) {
            setUser(u);
            setDenied(true);
            window.google?.accounts.id.disableAutoSelect();
          } else {
            const pages = getAllowedPages(accessConfig, email);
            setDenied(false);
            setAllowedPages(pages);
            setUser(u);
            saveSession(u, pages);
          }
        },
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
        });
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const check = setInterval(() => {
        if (window.google) {
          clearInterval(check);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(check);
    }
  }, [user]);

  const handleSignOut = useCallback(() => {
    window.google?.accounts.id.disableAutoSelect();
    setUser(null);
    setDenied(false);
    clearSession();
  }, []);

  if (!user) {
    return <LoginScreen googleBtnRef={googleBtnRef} authError="" />;
  }

  if (denied) {
    return <AccessDenied user={user} onSignOut={handleSignOut} />;
  }

  return (
    <BrowserRouter>
      <ConfigProvider>
        <AuthenticatedApp user={user} onSignOut={handleSignOut} />
      </ConfigProvider>
    </BrowserRouter>
  );
}
