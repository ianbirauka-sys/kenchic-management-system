import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../../api/auth.api';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(form);
      login(res.data.data.user, res.data.data.token);
      const role = res.data.data.user.role;
      if (role === 'customer') navigate('/customer/products');
      else if (role === 'farmer') navigate('/farmer/chicks');
      else navigate('/employee/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      {/* Background image overlay */}
      <div style={styles.bgImage} />
      <div style={styles.bgOverlay} />

      {/* Floating shapes for warmth */}
      <div style={{ ...styles.blob, top: '-80px', right: '-80px', background: 'rgba(251,191,36,0.18)', width: 340, height: 340 }} />
      <div style={{ ...styles.blob, bottom: '-60px', left: '-60px', background: 'rgba(234,88,12,0.13)', width: 280, height: 280 }} />

      <div style={styles.container}>
        {/* Left panel — branding */}
        <div style={styles.leftPanel}>
          <div style={styles.logoWrap}>
            <span style={styles.logoIcon}>🐔</span>
            <span style={styles.logoText}>Kenchic</span>
          </div>
          <h1 style={styles.tagline}>Fresh from farm<br />to your table.</h1>
          <p style={styles.taglineSub}>Kenya's trusted poultry brand — serving customers, farmers, and communities since 1970.</p>

          <div style={styles.pillsWrap}>
            {['🛒 Shop fresh products', '🐣 Order quality chicks', '🚚 Track your delivery'].map((t, i) => (
              <div key={i} style={styles.pill}>{t}</div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div style={styles.rightPanel}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Welcome back</h2>
              <p style={styles.cardSub}>Sign in to your Kenchic account</p>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email address</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>✉️</span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <span style={styles.loadingRow}>
                    <span style={styles.spinner} /> Signing in...
                  </span>
                ) : 'Sign in →'}
              </button>
            </form>

            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>New to Kenchic?</span>
              <span style={styles.dividerLine} />
            </div>

            <Link to="/register" style={styles.registerLink}>
              Create a free account
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; border-color: #d97706 !important; box-shadow: 0 0 0 3px rgba(217,119,6,0.15); }
        input::placeholder { color: #bbb; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
    background: '#1a0a00',
  },
  bgImage: {
    position: 'absolute', inset: 0, zIndex: 0,
    backgroundImage: `url('/roosters.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'brightness(0.35) saturate(0.8)',
  },
  bgOverlay: {
    position: 'absolute', inset: 0, zIndex: 1,
    background: 'linear-gradient(135deg, rgba(120,40,0,0.7) 0%, rgba(0,0,0,0.5) 100%)',
  },
  blob: {
    position: 'absolute', zIndex: 2,
    borderRadius: '50%',
    filter: 'blur(60px)',
    pointerEvents: 'none',
  },
  container: {
    position: 'relative', zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    gap: '48px',
    maxWidth: '960px',
    width: '100%',
    padding: '32px 24px',
    animation: 'fadeUp 0.6s ease both',
  },
  leftPanel: {
    flex: 1,
    color: '#fff',
    padding: '24px',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: '12px',
    marginBottom: '32px',
  },
  logoIcon: { fontSize: '40px' },
  logoText: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '32px', fontWeight: 800,
    color: '#fbbf24',
    letterSpacing: '-0.5px',
  },
  tagline: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '42px', fontWeight: 700,
    lineHeight: 1.2,
    color: '#fff',
    marginBottom: '16px',
  },
  taglineSub: {
    fontSize: '15px', color: 'rgba(255,255,255,0.65)',
    lineHeight: 1.6, marginBottom: '32px',
    maxWidth: '340px',
  },
  pillsWrap: { display: 'flex', flexDirection: 'column', gap: '10px' },
  pill: {
    display: 'inline-flex', alignItems: 'center',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '100px',
    padding: '8px 16px',
    fontSize: '13px', color: 'rgba(255,255,255,0.85)',
    width: 'fit-content',
  },
  rightPanel: { flex: '0 0 400px' },
  card: {
    background: 'rgba(255,255,255,0.97)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
  },
  cardHeader: { marginBottom: '28px' },
  cardTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '28px', fontWeight: 700,
    color: '#1c0a00', marginBottom: '6px',
  },
  cardSub: { fontSize: '14px', color: '#888' },
  errorBox: {
    background: '#fff5f5', border: '1px solid #fecaca',
    borderRadius: '10px', padding: '12px 16px',
    fontSize: '13px', color: '#dc2626',
    marginBottom: '20px', display: 'flex', gap: '8px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#444' },
  inputWrap: {
    display: 'flex', alignItems: 'center',
    border: '1.5px solid #e5e7eb', borderRadius: '12px',
    overflow: 'hidden', background: '#fafafa',
    transition: 'border-color 0.2s',
  },
  inputIcon: {
    padding: '0 12px', fontSize: '16px',
    background: 'transparent', flexShrink: 0,
  },
  input: {
    flex: 1, border: 'none', background: 'transparent',
    padding: '13px 12px 13px 0',
    fontSize: '14px', color: '#1c0a00',
    fontFamily: "'DM Sans', sans-serif",
  },
  eyeBtn: {
    background: 'none', border: 'none',
    padding: '0 14px', cursor: 'pointer', fontSize: '16px',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #d97706, #ea580c)',
    color: '#fff', border: 'none',
    borderRadius: '12px', padding: '14px',
    fontSize: '15px', fontWeight: 600,
    cursor: 'pointer', marginTop: '4px',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'transform 0.1s, box-shadow 0.2s',
    boxShadow: '0 4px 20px rgba(217,119,6,0.4)',
  },
  loadingRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  spinner: {
    display: 'inline-block', width: '16px', height: '16px',
    border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  divider: {
    display: 'flex', alignItems: 'center',
    gap: '12px', margin: '24px 0',
  },
  dividerLine: { flex: 1, height: '1px', background: '#eee' },
  dividerText: { fontSize: '12px', color: '#aaa', whiteSpace: 'nowrap' },
  registerLink: {
    display: 'block', textAlign: 'center',
    border: '1.5px solid #d97706',
    borderRadius: '12px', padding: '13px',
    fontSize: '14px', fontWeight: 600,
    color: '#d97706', textDecoration: 'none',
    transition: 'background 0.2s',
  },
};
