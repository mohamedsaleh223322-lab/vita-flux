import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Building2, Phone, MapPin, UserRound,
  ShieldCheck, Eye, EyeOff, Shield, UserPlus, X, CheckCircle,
  ChevronDown
} from 'lucide-react';
import LeftAuthPanel from '../components/auth/LeftAuthPanel.jsx';
import { apiFetch } from '../api/apiFetch.js';
import { setSession } from '../lib/authStorage.js';
import './auth.css';

/* ─── Validation Helpers ────────────────────────────────────────────────── */
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePhone = (phone) => {
  // Simple validation for digit-based numbers
  return /^[0-9+() \-]{7,20}$/.test(phone);
};

/* ─── Shared Field component ─────────────────────────────────────────────── */
function Field({
  id, label, icon, placeholder, type = 'text',
  autoComplete, className = '', children, as = 'input',
  required = false, error, ...props
}) {
  return (
    <div className={`auth-field ${className}`.trim()}>
      <label className="auth-label" htmlFor={id}>
        {label}
        {required && <span className="auth-required"> *</span>}
      </label>
      <div className="auth-input-wrap">
        <span className="auth-input-icon" aria-hidden="true">{icon}</span>
        {as === 'select' ? (
          <select id={id} className={`auth-input ${error ? 'auth-input--error' : ''}`} {...props}>
            {children}
          </select>
        ) : (
          <>
            <input
              id={id}
              type={type}
              className={`auth-input ${error ? 'auth-input--error' : ''}`}
              placeholder={placeholder}
              autoComplete={autoComplete}
              {...props}
            />
            {children}
          </>
        )}
      </div>
      {error && <span className="auth-field-error-text">{error}</span>}
    </div>
  );
}

/* ─── Error banner ───────────────────────────────────────────────────────── */
function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="auth-error" role="alert">{message}</div>;
}

/* ─── Forgot Password Modal ──────────────────────────────────────────────── */
function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Simulate enterprise service timeout & communication
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setSuccess(true);
    } catch (err) {
      setError('Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-card">
        <button className="auth-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {!success ? (
          <form onSubmit={handleSubmit} className="auth-modal-content">
            <h3 className="auth-modal-title">Reset Password</h3>
            <p className="auth-modal-subtitle">
              Enter your email address below and we will send you a link to reset your password.
            </p>

            {error && <div className="auth-error">{error}</div>}

            <Field
              id="reset-email"
              label="Email Address"
              icon={<Mail size={18} />}
              placeholder="admin@hospital.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button type="submit" className="auth-btn-primary" disabled={loading} style={{ marginTop: '16px' }}>
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="auth-modal-success">
            <CheckCircle size={48} color="#10B981" />
            <h3 className="auth-modal-title" style={{ marginTop: '16px' }}>Check Your Email</h3>
            <p className="auth-modal-subtitle" style={{ marginBottom: '24px' }}>
              If the email address <strong>{email}</strong> is registered on our platform, you will receive a secure password reset link shortly.
            </p>
            <button className="auth-btn-primary" onClick={onClose}>
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN PANEL
═══════════════════════════════════════════════════════════════════════════ */
function LoginPanel({ onForgotClick }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [error,    setError]    = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async () => {
    // Validate inputs
    const errors = {};
    if (!email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please resolve the errors below.');
      return;
    }

    setFieldErrors({});
    setLoading(true); 
    setError('');

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSession({ token: data.token, user: data.user, remember });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-right-inner">
      <div className="auth-title-block">
        <h1 className="auth-title">
          <span className="auth-title-dark">Welcome </span>
          <span className="auth-title-red" style={{ color: '#E53935' }}>Back</span>
        </h1>
        <p className="auth-subtitle">Sign in to manage your hospital blood inventory</p>
      </div>

      <ErrorBanner message={error} />

      <div className="auth-form">
        <Field
          id="login-email" label="Email Address"
          icon={<Mail size={18} strokeWidth={2} />}
          placeholder="alaimeiomar@gmail.com" type="email" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />

        <Field
          id="login-password" label="Password"
          icon={<Lock size={18} strokeWidth={2} />}
          placeholder="••••••••"
          type={showPw ? 'text' : 'password'} autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        >
          <button type="button" className="auth-eye"
            onClick={() => setShowPw((p) => !p)}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </Field>

        <div className="auth-meta">
          <label className="auth-remember-label">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>Remember me</span>
          </label>
          <button type="button" className="auth-forgot" onClick={onForgotClick}>Forgot Password?</button>
        </div>

        <button type="button" className="auth-btn-primary" onClick={handleSignIn} disabled={loading}>
          <Lock size={18} strokeWidth={2.5} />
          {loading ? 'Signing in...' : 'Sign In Securely'}
        </button>

        <div className="auth-or">
          <span className="auth-or-line" />
          <span className="auth-or-text">or</span>
          <span className="auth-or-line" />
        </div>
      </div>

      <p className="auth-footer">
        Don&apos;t have an account?
        <Link to="/register" style={{ color: '#E53935', fontWeight: 700 }}>Register Hospital</Link>
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REGISTER PANEL
═══════════════════════════════════════════════════════════════════════════ */
function RegisterPanel() {
  const [fullName,        setFullName]        = useState('');
  const [role,            setRole]            = useState('ADMIN'); // Default ADMIN matching screenshot
  const [email,           setEmail]           = useState('');
  const [adminPhone,      setAdminPhone]      = useState('');
  const [hospitalPhone,   setHospitalPhone]   = useState('');
  const [hospitalName,    setHospitalName]    = useState('');
  const [governorateId,   setGovernorateId]   = useState('');
  const [city,            setCity]            = useState('');
  const [address,         setAddress]         = useState('');
  const [password,        setPassword]        = useState('');
  const [showPw,          setShowPw]          = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirm,     setShowConfirm]     = useState(false);

  const [governorates, setGovernorates] = useState([]);
  const [error,        setError]        = useState('');
  const [fieldErrors,  setFieldErrors]  = useState({});
  const [loading,      setLoading]      = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch('/api/governorates')
      .then(setGovernorates)
      .catch((err) => console.error('Failed to fetch governorates:', err));
  }, []);

  const handleRegister = async () => {
    // Validate inputs
    const errors = {};
    if (!fullName) errors.fullName = 'Full name is required';
    if (!role) errors.role = 'Role selection is required';
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!adminPhone) {
      errors.adminPhone = 'Admin phone is required';
    } else if (!validatePhone(adminPhone)) {
      errors.adminPhone = 'Please enter a valid phone number';
    }

    if (!hospitalPhone) {
      errors.hospitalPhone = 'Hospital phone is required';
    } else if (!validatePhone(hospitalPhone)) {
      errors.hospitalPhone = 'Please enter a valid phone number';
    }

    if (!hospitalName) errors.hospitalName = 'Hospital name is required';
    if (!governorateId) errors.governorateId = 'Governorate selection is required';
    if (!address) errors.address = 'Address is required';
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirmation is required';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fill in all required fields correctly.');
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName, role, email, hospitalName,
          hospitalPhone, adminPhone,
          governorateId: parseInt(governorateId, 10),
          city, address, password,
        }),
      });
      setSession({ token: data.token, user: data.user, remember: false });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-right-inner auth-right-inner--reg">
      <div className="auth-reg-top">
        <div className="auth-title-block">
          <h1 className="auth-title">
            <span className="auth-title-dark">Create </span>
            <span className="auth-title-red" style={{ color: '#E53935' }}>Account</span>
          </h1>
          <p className="auth-subtitle">
            Create your administrator account to get started
          </p>
        </div>
        <div className="auth-step">
          <div className="auth-step__avatar" aria-hidden="true">
            <UserRound size={18} strokeWidth={2.2} color="#DC2626" />
          </div>
          <div className="auth-step__copy">
            <span className="auth-step__title">Step 1 of 1</span>
            <span className="auth-step__subtitle">Administrator Setup</span>
          </div>
        </div>
      </div>

      <ErrorBanner message={error} />

      <div className="auth-form">
        <div className="auth-grid">
          {/* Row 1 — 2col */}
          <Field id="r-fullname" label="Full Name" required
            icon={<UserRound size={15} strokeWidth={2} />}
            placeholder="Dr. John Doe" autoComplete="name"
            value={fullName} onChange={(e) => setFullName(e.target.value)}
            error={fieldErrors.fullName}
          />
          <Field as="select" id="r-role" label="Role" required
            icon={<ChevronDown size={15} strokeWidth={2} />}
            value={role} onChange={(e) => setRole(e.target.value)}
            error={fieldErrors.role}
          >
            <option value="ADMIN">ADMIN</option>
            <option value="STAFF">STAFF</option>
          </Field>

          {/* Row 2 — full width */}
          <Field id="r-email" label="Email Address" required
            icon={<Mail size={15} strokeWidth={2} />}
            placeholder="admin@hospital.com" type="email" autoComplete="email"
            className="auth-col-full"
            value={email} onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />

          {/* Row 3 — 2col */}
          <Field id="r-admin-phone" label="Admin Phone" required
            icon={<Phone size={15} strokeWidth={2} />}
            placeholder="010..." type="tel"
            value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)}
            error={fieldErrors.adminPhone}
          />
          <Field id="r-hosp-phone" label="Hospital Phone" required
            icon={<Phone size={15} strokeWidth={2} />}
            placeholder="02..." type="tel"
            value={hospitalPhone} onChange={(e) => setHospitalPhone(e.target.value)}
            error={fieldErrors.hospitalPhone}
          />

          {/* Row 4 — full width */}
          <Field id="r-hospital" label="Hospital Name" required
            icon={<Building2 size={15} strokeWidth={2} />}
            placeholder="e.g. Cairo Medical Center" autoComplete="organization"
            className="auth-col-full"
            value={hospitalName} onChange={(e) => setHospitalName(e.target.value)}
            error={fieldErrors.hospitalName}
          />

          {/* Row 5 — 2col */}
          <Field as="select" id="r-gov" label="Governorate" required
            icon={<MapPin size={15} strokeWidth={2} />}
            value={governorateId} onChange={(e) => setGovernorateId(e.target.value)}
            error={fieldErrors.governorateId}
          >
            <option value="" disabled>Select Governorate</option>
            {governorates.map((g) => (
              <option key={g.id} value={g.id}>{g.name_en || g.name}</option>
            ))}
          </Field>
          <Field id="r-city" label="City"
            icon={<Building2 size={15} strokeWidth={2} />}
            placeholder="Optional" autoComplete="address-level2"
            value={city} onChange={(e) => setCity(e.target.value)}
          />

          {/* Row 6 — full width */}
          <Field id="r-address" label="Address" required
            icon={<MapPin size={15} strokeWidth={2} />}
            placeholder="e.g. 90 Street, New Cairo, Cairo, Egypt" autoComplete="street-address"
            className="auth-col-full"
            value={address} onChange={(e) => setAddress(e.target.value)}
            error={fieldErrors.address}
          />

          {/* Row 7 — 2col */}
          <Field id="r-password" label="Password" required
            icon={<Lock size={15} strokeWidth={2} />}
            placeholder="Min 8 characters"
            type={showPw ? 'text' : 'password'} autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          >
            <button type="button" className="auth-eye"
              onClick={() => setShowPw((p) => !p)} aria-label="Toggle password"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </Field>
          <Field id="r-confirm" label="Confirm Password" required
            icon={<Lock size={15} strokeWidth={2} />}
            placeholder="••••••••"
            type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
          >
            <button type="button" className="auth-eye"
              onClick={() => setShowConfirm((p) => !p)} aria-label="Toggle confirm"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </Field>
        </div>

        {/* Submit */}
        <button type="button" className="auth-btn-primary" onClick={handleRegister} disabled={loading}>
          <UserPlus size={18} strokeWidth={2.4} />
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </div>

      <p className="auth-footer">
        Already have an account? <Link to="/login" style={{ color: '#E53935', fontWeight: 700 }}>Sign In</Link>
      </p>

      {/* Trust bar */}
      <div className="auth-trust">
        <div className="auth-trust-item">
          <ShieldCheck size={14} color="#DC2626" />
          <span>Your data is protected</span>
        </div>
        <div className="auth-trust-divider" />
        <div className="auth-trust-item">
          <ShieldCheck size={14} color="#DC2626" />
          <span>HIPAA Compliant</span>
        </div>
        <div className="auth-trust-divider" />
        <div className="auth-trust-item">
          <ShieldCheck size={14} color="#DC2626" />
          <span>Trusted by healthcare professionals</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Root ───────────────────────────────────────────────────────────────── */
export default function Auth() {
  const location = useLocation();
  const isRegister = location.pathname === '/register';
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  return (
    <main className="auth-page">
      <section className={`auth-card ${isRegister ? 'auth-card--reg' : 'auth-card--login'}`}>
        <LeftAuthPanel mode={isRegister ? 'register' : 'login'} />
        <div className="auth-right">
          {isRegister ? (
            <RegisterPanel />
          ) : (
            <LoginPanel onForgotClick={() => setIsForgotOpen(true)} />
          )}
        </div>
      </section>

      {/* Interactive Reset Password Modal */}
      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </main>
  );
}
