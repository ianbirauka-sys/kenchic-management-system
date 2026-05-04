import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../api/auth.api';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
  { value: 'customer', label: 'Customer', icon: '🛒', desc: 'Buy fresh poultry products' },
  { value: 'farmer', label: 'Farmer', desc: 'Order chicks and get support', icon: '🌾' },
];

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await registerUser(form);
      login(res.data.data.user, res.data.data.token);
      if (form.role === 'farmer') navigate('/farmer/chicks');
      else navigate('/customer/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      <div style={styles.bgImage} />
      <div style={styles.bgOverlay} />
      <div style={{ ...styles.blob, top: '-80px', right: '-80px', background: 'rgba(251,191,36,0.18)', width: 340, height: 340 }} />
      <div style={{ ...styles.blob, bottom: '-60px', left: '-60px', background: 'rgba(234,88,12,0.13)', width: 280, height: 280 }} />

      <div style={styles.container}>
        {/* Left branding */}
        <div style={styles.leftPanel}>
          <div style={styles.logoWrap}>
            <span style={styles.logoIcon}>🐔</span>
            <span style={styles.logoText}>Kenchic</span>
          </div>
          <h1 style={styles.tagline}>Join Kenya's<br />favourite poultry<br />platform.</h1>
          <p style={styles.taglineSub}>Whether you're buying fresh chicken or growing your flock, Kenchic has everything you need.</p>
          <div style={styles.statsRow}>
            {[['10K+', 'Happy customers'], ['500+', 'Active farmers'], ['5', 'Product varieties']].map(([num, label]) => (
              <div key={label} style={styles.statItem}>
                <span style={styles.statNum}>{num}</span>
                <span style={styles.statLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right form */}
        <div style={styles.rightPanel}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Create account</h2>
              <p style={styles.cardSub}>Get started with Kenchic today</p>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Role selector */}
            <div style={styles.roleWrap}>
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  style={{
                    ...styles.roleBtn,
                    ...(form.role === r.value ? styles.roleBtnActive : {}),
                  }}
                >
                  <span style={styles.roleIcon}>{r.icon}</span>
                  <span style={styles.roleLabel}>{r.label}</span>
                  <span style={styles.roleDesc}>{r.desc}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Full name</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>👤</span>
                  <input
                    type="text"
                    placeholder="Jane Wanjiku"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email address</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>✉️</span>
                  <input
                    type="email"
                    placeholder="jane@example.com"
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
                    placeholder="Minimum 6 characters"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    style={styles.input}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
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
                    <span style={styles.spinner} /> Creating account...
                  </span>
                ) : `Create ${form.role === 'farmer' ? 'Farmer' : 'Customer'} Account →`}
              </button>
            </form>

            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>Already have an account?</span>
              <span style={styles.dividerLine} />
            </div>

            <Link to="/login" style={styles.loginLink}>Sign in instead</Link>
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
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
    background: '#1a0a00',
  },
  bgImage: {
    position: 'absolute', inset: 0, zIndex: 0,
    backgroundImage: `url('/roosters.jpg')`,
    backgroundSize: 'cover', backgroundPosition: 'center',
    filter: 'brightness(0.35) saturate(0.8)',
  },
  bgOverlay: {
    position: 'absolute', inset: 0, zIndex: 1,
    background: 'linear-gradient(135deg, rgba(120,40,0,0.7) 0%, rgba(0,0,0,0.5) 100%)',
  },
  blob: {
    position: 'absolute', zIndex: 2,
    borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
  },
  container: {
    position: 'relative', zIndex: 3,
    display: 'flex', alignItems: 'center',
    gap: '48px', maxWidth: '980px', width: '100%',
    padding: '32px 24px',
    animation: 'fadeUp 0.6s ease both',
  },
  leftPanel: { flex: 1, color: '#fff', padding: '24px' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' },
  logoIcon: { fontSize: '40px' },
  logoText: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '32px', fontWeight: 800, color: '#fbbf24',
  },
  tagline: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '38px', fontWeight: 700, lineHeight: 1.25,
    color: '#fff', marginBottom: '16px',
  },
  taglineSub: {
    fontSize: '15px', color: 'rgba(255,255,255,0.65)',
    lineHeight: 1.6, marginBottom: '36px', maxWidth: '320px',
  },
  statsRow: { display: 'flex', gap: '28px' },
  statItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  statNum: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '28px', fontWeight: 700, color: '#fbbf24',
  },
  statLabel: { fontSize: '12px', color: 'rgba(255,255,255,0.55)' },
  rightPanel: { flex: '0 0 420px' },
  card: {
    background: 'rgba(255,255,255,0.97)',
    borderRadius: '24px', padding: '36px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
  },
  cardHeader: { marginBottom: '20px' },
  cardTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '26px', fontWeight: 700,
    color: '#1c0a00', marginBottom: '4px',
  },
  cardSub: { fontSize: '14px', color: '#888' },
  errorBox: {
    background: '#fff5f5', border: '1px solid #fecaca',
    borderRadius: '10px', padding: '12px 16px',
    fontSize: '13px', color: '#dc2626',
    marginBottom: '16px', display: 'flex', gap: '8px',
  },
  roleWrap: { display: 'flex', gap: '10px', marginBottom: '20px' },
  roleBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '4px', padding: '14px 10px',
    border: '2px solid #e5e7eb', borderRadius: '14px',
    background: '#fafafa', cursor: 'pointer',
    transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
  },
  roleBtnActive: {
    border: '2px solid #d97706',
    background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    boxShadow: '0 4px 16px rgba(217,119,6,0.2)',
  },
  roleIcon: { fontSize: '24px' },
  roleLabel: { fontSize: '13px', fontWeight: 600, color: '#1c0a00' },
  roleDesc: { fontSize: '11px', color: '#999', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#444' },
  inputWrap: {
    display: 'flex', alignItems: 'center',
    border: '1.5px solid #e5e7eb', borderRadius: '12px',
    overflow: 'hidden', background: '#fafafa',
  },
  inputIcon: { padding: '0 12px', fontSize: '16px' },
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
    gap: '12px', margin: '20px 0',
  },
  dividerLine: { flex: 1, height: '1px', background: '#eee' },
  dividerText: { fontSize: '12px', color: '#aaa', whiteSpace: 'nowrap' },
  loginLink: {
    display: 'block', textAlign: 'center',
    border: '1.5px solid #d97706', borderRadius: '12px',
    padding: '13px', fontSize: '14px', fontWeight: 600,
    color: '#d97706', textDecoration: 'none',
  },
};
