import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSignupMutation } from '../../features/auth/authApi';
import { parseApiError } from '../../utils/formatters';
import Button from '../../components/common/Button';
import '../../styles/index.css';


const SignupPage = () => {
  const navigate = useNavigate();
  const [signup, { isLoading }] = useSignupMutation();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', managerId: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      // role is always 'employee' — handled server-side
    };
    if (form.managerId.trim()) payload.managerId = form.managerId.trim();

    try {
      const res = await signup(payload).unwrap();
      toast.success('Account created! Welcome 🎉');
      // New signups are always employees
      navigate('/employee/dashboard', { replace: true });
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
            style={{ maxHeight: '70px', width: 'auto', objectFit: 'contain', marginBottom: '0.5rem' }}
          />
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate id="signup-form">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name" name="name" type="text"
              className={`form-input${errors.name ? ' error' : ''}`}
              placeholder="John Doe"
              value={form.name} onChange={handleChange}
              autoFocus
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email Address</label>
            <input
              id="signup-email" name="email" type="email"
              className={`form-input${errors.email ? ' error' : ''}`}
              placeholder="you@company.com"
              value={form.email} onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">Password</label>
              <input
                id="signup-password" name="password" type="password"
                className={`form-input${errors.password ? ' error' : ''}`}
                placeholder="Min. 6 characters"
                value={form.password} onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">Confirm</label>
              <input
                id="confirm-password" name="confirmPassword" type="password"
                className={`form-input${errors.confirmPassword ? ' error' : ''}`}
                placeholder="Repeat password"
                value={form.confirmPassword} onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
            </div>
          </div>

          {/* Info: signup always creates employee account */}
          <div className="alert alert-info" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            <span>💡</span>
            <span>All new accounts are created as <strong>Employee</strong>. Your admin can update your role later.</span>
          </div>

          <div className="form-group">
              <label className="form-label" htmlFor="managerId">
                Manager ID <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
              </label>
              <input
                id="managerId" name="managerId" type="text"
                className="form-input"
                placeholder="MongoDB ObjectId of your manager"
                value={form.managerId} onChange={handleChange}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Ask your admin for the Manager ID to link to your team.
              </p>
            </div>

          <Button type="submit" fullWidth size="lg" loading={isLoading} id="btn-signup">
            Create Account →
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
