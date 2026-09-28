import { useState, useCallback, useRef } from 'react';
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
    name: '', email: '', password: '', confirmPassword: '', managerCode: '',
  });
  const [errors, setErrors] = useState({});
  const [managerInfo, setManagerInfo] = useState(null); // { name, email } of verified manager
  const [verifyingCode, setVerifyingCode] = useState(false);
  const codeVerifyTimer = useRef(null);

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
    if (form.managerCode.trim()) payload.managerCode = form.managerCode.trim().toUpperCase();

    try {
      await signup(payload).unwrap();
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

  // Live-verify the manager code with a 600ms debounce
  const handleManagerCodeChange = useCallback((e) => {
    const val = e.target.value.trim().toUpperCase();
    setForm((f) => ({ ...f, managerCode: val }));
    setManagerInfo(null);
    setErrors((er) => ({ ...er, managerCode: '' }));

    if (codeVerifyTimer.current) clearTimeout(codeVerifyTimer.current);

    if (!val) return;

    // Basic format check before hitting API
    if (!/^MGR-[A-Z0-9]+-\d{4}$/i.test(val)) {
      setErrors((er) => ({ ...er, managerCode: 'Format: MGR-XXXXX-1234' }));
      return;
    }

    codeVerifyTimer.current = setTimeout(async () => {
      setVerifyingCode(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/users/manager-code/${val}`);
        const json = await res.json();
        if (res.ok && json.data?.manager) {
          setManagerInfo(json.data.manager);
          setErrors((er) => ({ ...er, managerCode: '' }));
        } else {
          setManagerInfo(null);
          setErrors((er) => ({ ...er, managerCode: 'Manager not found. Check the code.' }));
        }
      } catch {
        setManagerInfo(null);
      } finally {
        setVerifyingCode(false);
      }
    }, 600);
  }, []);

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

          {/* Manager Code field with live verification */}
          <div className="form-group">
            <label className="form-label" htmlFor="managerCode">
              Manager Code <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="managerCode" name="managerCode" type="text"
                className={`form-input${errors.managerCode ? ' error' : managerInfo ? '' : ''}`}
                placeholder="MGR-ALEXM-3821"
                value={form.managerCode}
                onChange={handleManagerCodeChange}
                style={{
                  textTransform: 'uppercase',
                  paddingRight: verifyingCode || managerInfo ? '2.5rem' : undefined,
                  borderColor: managerInfo ? 'var(--color-success)' : errors.managerCode ? 'var(--color-danger)' : undefined,
                }}
                autoComplete="off"
              />
              {verifyingCode && (
                <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', opacity: 0.6 }}>
                  🔍
                </span>
              )}
              {managerInfo && !verifyingCode && (
                <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--color-success)' }}>
                  ✅
                </span>
              )}
            </div>
            {errors.managerCode && <p className="form-error">{errors.managerCode}</p>}
            {managerInfo && !errors.managerCode && (
              <p style={{ fontSize: '0.78rem', color: 'var(--color-success)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                ✅ Manager: <strong>{managerInfo.name}</strong> ({managerInfo.email})
              </p>
            )}
            {!managerInfo && !errors.managerCode && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Ask your manager for their Manager Code to join their team automatically.
              </p>
            )}
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

