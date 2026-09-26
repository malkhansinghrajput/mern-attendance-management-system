const UnauthorizedPage = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
    <h1>403 — Unauthorized</h1>
    <p>You do not have permission to access this page.</p>
    <a href="/login">← Back to Login</a>
  </div>
);
export default UnauthorizedPage;
