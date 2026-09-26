import { Link } from 'react-router-dom';
import '../../styles/index.css';

const UnauthorizedPage = () => (
  <div className="auth-page">
    <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🔒</div>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>403 — Unauthorized</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        You don't have permission to access this page.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.65rem 1.5rem', background: 'var(--gradient-primary)',
          color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        ← Go to Dashboard
      </Link>
    </div>
  </div>
);

export default UnauthorizedPage;
