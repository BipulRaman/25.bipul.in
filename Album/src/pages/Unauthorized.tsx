export default function Unauthorized() {
  return (
    <div className="unauthorized-page">
      <div className="unauthorized-card">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <h1>Unauthorized</h1>
        <p>A valid access token is required to view this album.</p>
        <p className="unauthorized-hint">Please use an authorized link to access the album viewer.</p>
      </div>
    </div>
  );
}
