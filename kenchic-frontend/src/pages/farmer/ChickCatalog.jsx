import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChicks } from '../../api/farmer.api';
import { useAuth } from '../../context/AuthContext';
import PageWrapper from '../../components/PageWrapper';

const CHICK_INFO = {
  'Broiler Day-Old Chick': { emoji: '🐥', maturity: '6–8 weeks', purpose: 'Meat production', tip: 'Best for commercial broiler farming', color: '#fff7ed', border: '#fed7aa' },
  'Layer Day-Old Chick':   { emoji: '🐣', maturity: '18–20 weeks', purpose: 'Egg production', tip: 'Starts laying at ~20 weeks', color: '#f0fdf4', border: '#bbf7d0' },
};

export default function ChickCatalog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chicks, setChicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('farmer_cart') || '[]'));
  const [added, setAdded] = useState(null);

  useEffect(() => {
    getChicks()
      .then(res => setChicks(res.data.data))
      .catch(() => setError('Failed to load chick catalog.'))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (chick) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === chick.id);
      const updated = existing
        ? prev.map(i => i.id === chick.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...chick, quantity: 1 }];
      localStorage.setItem('farmer_cart', JSON.stringify(updated));
      return updated;
    });
    setAdded(chick.id);
    setTimeout(() => setAdded(null), 1500);
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <PageWrapper cartCount={0}>
      {/* Hero */}
      <div style={styles.hero}>
        <div>
          <p style={styles.heroEyebrow}>Kenchic Certified Hatchery</p>
          <h1 style={styles.heroTitle}>Welcome, <span style={{ color: '#fef9c3' }}>{user?.name?.split(' ')[0]}</span> 👋</h1>
          <p style={styles.heroSub}>Order quality day-old chicks for your farm</p>
        </div>
        <span style={{ fontSize: '80px', opacity: 0.9 }}>🐔</span>
      </div>

      {loading && <div style={styles.center}><div style={styles.spinner} /></div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      {!loading && !error && (
        <div style={styles.grid}>
          {chicks.map(chick => {
            const info = CHICK_INFO[chick.name] || { emoji: '🐤', maturity: 'Varies', purpose: 'Poultry farming', tip: '', color: '#fff7ed', border: '#fed7aa' };
            return (
              <div key={chick.id} style={styles.card}>
                {/* Card header */}
                <div style={{ ...styles.cardHeader, background: info.color, border: `1px solid ${info.border}` }}>
                  <span style={{ fontSize: '64px' }}>{info.emoji}</span>
                  <div>
                    <h2 style={styles.chickName}>{chick.name}</h2>
                    <p style={styles.chickPrice}>KSh {Number(chick.price).toLocaleString()} / chick</p>
                  </div>
                </div>

                {/* Card body */}
                <div style={styles.cardBody}>
                  <p style={styles.chickDesc}>{chick.description || 'High quality day-old chick from Kenchic certified hatchery.'}</p>
                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <p style={styles.infoLabel}>Purpose</p>
                      <p style={styles.infoValue}>{info.purpose}</p>
                    </div>
                    <div style={styles.infoItem}>
                      <p style={styles.infoLabel}>Maturity</p>
                      <p style={styles.infoValue}>{info.maturity}</p>
                    </div>
                    <div style={{ ...styles.infoItem, gridColumn: '1 / -1' }}>
                      <p style={styles.infoLabel}>Available</p>
                      <p style={{ ...styles.infoValue, color: chick.stock_quantity > 0 ? '#15803d' : '#dc2626' }}>
                        {chick.stock_quantity > 0 ? `${chick.stock_quantity} chicks in stock` : 'Currently out of stock'}
                      </p>
                    </div>
                  </div>
                  {info.tip && (
                    <div style={styles.tip}>
                      <span>💡</span>
                      <span style={{ fontSize: '13px', color: '#92400e' }}>{info.tip}</span>
                    </div>
                  )}
                  <button
                    onClick={() => addToCart(chick)}
                    disabled={chick.stock_quantity === 0}
                    style={{
                      ...styles.addBtn,
                      ...(added === chick.id ? { background: '#16a34a', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' } : {}),
                      ...(chick.stock_quantity === 0 ? styles.addBtnDisabled : {}),
                    }}
                  >
                    {added === chick.id ? '✓ Added to order!' : 'Add to Order'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cartCount > 0 && (
        <div style={styles.floatingBtn} onClick={() => navigate('/farmer/order')}>
          <span>🐣</span>
          <span>{cartCount} chick{cartCount > 1 ? 's' : ''} in order</span>
          <span>→ Review Order</span>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageWrapper>
  );
}

const styles = {
  hero: { background: 'linear-gradient(135deg, #431407 0%, #92400e 40%, #d97706 100%)', borderRadius: '20px', padding: '40px 48px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  heroEyebrow: { fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' },
  heroTitle: { fontFamily: "'Playfair Display', serif", fontSize: '34px', fontWeight: 700, color: '#fff', marginBottom: '8px' },
  heroSub: { fontSize: '15px', color: 'rgba(255,255,255,0.85)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' },
  card: { background: '#fff', borderRadius: '20px', border: '1px solid #ede8e0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(180,80,0,0.08)' },
  cardHeader: { padding: '28px 28px', display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid #f5f0ea' },
  chickName: { fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 700, color: '#1c0a00' },
  chickPrice: { fontSize: '16px', fontWeight: 700, color: '#d97706', marginTop: '4px' },
  cardBody: { padding: '24px' },
  chickDesc: { fontSize: '14px', color: '#78716c', lineHeight: 1.6, marginBottom: '16px' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' },
  infoItem: { background: '#faf8f5', borderRadius: '10px', padding: '10px 14px' },
  infoLabel: { fontSize: '11px', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' },
  infoValue: { fontSize: '14px', fontWeight: 600, color: '#1c0a00' },
  tip: { background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '16px' },
  addBtn: { width: '100%', background: 'linear-gradient(135deg, #d97706, #ea580c)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 16px rgba(217,119,6,0.3)', transition: 'all 0.2s' },
  addBtnDisabled: { background: '#e7e5e4', color: '#a8a29e', cursor: 'not-allowed', boxShadow: 'none' },
  center: { display: 'flex', justifyContent: 'center', padding: '80px 0' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3ede6', borderTopColor: '#d97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  errorBox: { background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626', fontSize: '14px' },
  floatingBtn: { position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #d97706, #ea580c)', color: '#fff', borderRadius: '100px', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, boxShadow: '0 8px 32px rgba(217,119,6,0.45)', cursor: 'pointer', zIndex: 50, fontFamily: "'DM Sans', sans-serif" },
};
