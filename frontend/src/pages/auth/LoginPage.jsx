import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLoginMutation } from '../../features/auth/authApi';
import { parseApiError } from '../../utils/formatters';
import Button from '../../components/common/Button';
import '../../styles/index.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const from = location.state?.from?.pathname || '/';

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    try {
      const res = await login({ email: form.email.trim().toLowerCase(), password: form.password }).unwrap();
      toast.success('Welcome back! 👋');

      const userRole = res?.data?.user?.role;
      const targetDashboard =
        userRole === 'admin'
          ? '/admin/dashboard'
          : userRole === 'manager'
          ? '/manager/dashboard'
          : '/employee/dashboard';

      const redirectTo = from && from !== '/' && from !== '/login' ? from : targetDashboard;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img
            src="/logo.png"
            alt="AttendPro Logo"
            style={{ height: '90px', maxWidth: '220px', width: 'auto', objectFit: 'contain', objectPosition: 'center', marginBottom: '0.5rem', borderRadius: '10px' }}
          />
          <p>Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate id="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              className={`form-input${errors.email ? ' error' : ''}`}
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              autoFocus
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className={`form-input${errors.password ? ' error' : ''}`}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isLoading}
            id="btn-login"
            style={{ marginTop: '0.5rem' }}
          >
            Sign In →
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>
            Sign up
          </Link>
        </p>

        {/* Demo hint */}
        <div className="alert alert-info" style={{ marginTop: '1.5rem', fontSize: '0.8rem' }}>
          <span>💡</span>
          <span>Create an account via Sign Up. Admin account is set up via seed script.</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
