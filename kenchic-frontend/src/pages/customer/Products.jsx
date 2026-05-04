import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../../api/customer.api';
import { useAuth } from '../../context/AuthContext';
import PageWrapper from '../../components/PageWrapper';

const CATEGORY_EMOJI = { chicks: '🐣', poultry: '🍗', feed: '🌾', equipment: '🔧' };

export default function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [added, setAdded] = useState(null);

  useEffect(() => {
    getProducts()
      .then(res => setProducts(res.data.data))
      .catch(() => setError('Failed to load products.'))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      const updated = existing
        ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...product, quantity: 1 }];
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
    setAdded(product.id);
    setTimeout(() => setAdded(null), 1500);
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const categories = ['all', ...new Set(products.map(p => p.category))];
  const filtered = products.filter(p =>
    (filter === 'all' || p.category === filter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PageWrapper cartCount={cartCount}>
      {/* Hero banner */}
      <div style={styles.hero}>
        <div>
          <p style={styles.heroEyebrow}>Fresh & quality assured</p>
          <h1 style={styles.heroTitle}>
            Welcome, <span style={{ color: '#fef9c3' }}>{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p style={styles.heroSub}>Browse our full range of fresh Kenchic products</p>
        </div>
        <span style={{ fontSize: '80px', opacity: 0.9 }}>🐔</span>
      </div>

      {/* Search + filters */}
      <div style={styles.filterRow}>
        <div style={styles.searchWrap}>
          <span>🔍</span>
          <input
            type="text" placeholder="Search products..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.tabs}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ ...styles.tab, ...(filter === cat ? styles.tabActive : {}) }}>
              {cat === 'all' ? '✨ All' : `${CATEGORY_EMOJI[cat] || '📦'} ${cat}`}
            </button>
          ))}
        </div>
      </div>

      {loading && <div style={styles.center}><div style={styles.spinner} /></div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      {!loading && !error && (
        <>
          <p style={styles.count}>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>
          {filtered.length === 0 ? (
            <div style={styles.empty}>
              <p style={{ fontSize: '48px' }}>🔍</p>
              <p style={{ color: '#a8a29e', marginTop: '12px' }}>No products found</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {filtered.map(p => (
                <div key={p.id} style={styles.card}>
                  <div style={styles.cardImg}>
                    <span style={{ fontSize: '52px' }}>{CATEGORY_EMOJI[p.category] || '📦'}</span>
                    <span style={{
                      ...styles.badge,
                      background: p.stock_quantity > 0 ? '#dcfce7' : '#fee2e2',
                      color: p.stock_quantity > 0 ? '#16a34a' : '#dc2626',
                    }}>
                      {p.stock_quantity > 0 ? 'In stock' : 'Out of stock'}
                    </span>
                  </div>
                  <div style={styles.cardBody}>
                    <span style={styles.catLabel}>{p.category}</span>
                    <h3 style={styles.cardName}>{p.name}</h3>
                    <p style={styles.cardDesc}>{p.description || 'Premium quality Kenchic product.'}</p>
                    <div style={styles.cardFooter}>
                      <span style={styles.price}>KSh {Number(p.price).toLocaleString()}</span>
                      <button
                        onClick={() => addToCart(p)}
                        disabled={p.stock_quantity === 0}
                        style={{
                          ...styles.addBtn,
                          ...(added === p.id ? { background: '#16a34a' } : {}),
                          ...(p.stock_quantity === 0 ? styles.addBtnDisabled : {}),
                        }}
                      >
                        {added === p.id ? '✓ Added' : '+ Add'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {cartCount > 0 && (
        <div style={styles.floatingCart} onClick={() => navigate('/customer/cart')}>
          <span>🛒</span>
          <span>{cartCount} item{cartCount > 1 ? 's' : ''} in cart</span>
          <span>→</span>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { outline: none; }
      `}</style>
    </PageWrapper>
  );
}

const styles = {
hero: {
  background: 'linear-gradient(135deg, #431407 0%, #92400e 40%, #d97706 100%)',
  borderRadius: '20px', padding: '40px 48px', marginBottom: '28px',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  heroEyebrow: { fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' },
  heroTitle: { fontFamily: "'Playfair Display', serif", fontSize: '34px', fontWeight: 700, color: '#fff', marginBottom: '8px' },
  heroSub: { fontSize: '15px', color: 'rgba(255,255,255,0.85)' },
  filterRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: '#fff', border: '1.5px solid #e7e5e4',
    borderRadius: '12px', padding: '0 16px', flex: 1, minWidth: '200px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  searchInput: { border: 'none', background: 'transparent', padding: '12px 0', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", color: '#1c0a00', width: '100%' },
  tabs: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  tab: {
    padding: '8px 16px', borderRadius: '100px',
    border: '1.5px solid #e7e5e4', background: '#fff',
    fontSize: '13px', fontWeight: 500, color: '#78716c',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textTransform: 'capitalize',
  },
  tabActive: { background: '#fff7ed', borderColor: '#d97706', color: '#d97706', fontWeight: 600 },
  count: { fontSize: '13px', color: '#a8a29e', marginBottom: '16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
card: {
  background: '#fff', borderRadius: '16px',
  border: '1px solid #e8ddd4', overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(180,80,0,0.1)',
  },
cardImg: {
  background: 'linear-gradient(135deg, #fde8c8, #fdba74)',
  height: '140px', display: 'flex', alignItems: 'center',
  justifyContent: 'center', position: 'relative',
},
  badge: {
    position: 'absolute', top: '12px', right: '12px',
    fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px',
  },
  cardBody: { padding: '16px' },
  catLabel: { fontSize: '11px', fontWeight: 600, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.06em' },
  cardName: { fontSize: '16px', fontWeight: 600, color: '#1c0a00', margin: '4px 0 6px', fontFamily: "'DM Sans', sans-serif" },
  cardDesc: { fontSize: '13px', color: '#6b5c52', lineHeight: 1.5, marginBottom: '16px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  cardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: '18px', fontWeight: 700, color: '#7c2d12', fontFamily: "'DM Sans', sans-serif" },
  addBtn: {
    background: 'linear-gradient(135deg, #d97706, #ea580c)',
    color: '#fff', border: 'none', borderRadius: '8px',
    padding: '8px 16px', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    boxShadow: '0 2px 8px rgba(217,119,6,0.3)', transition: 'all 0.2s',
  },
  addBtnDisabled: { background: '#e7e5e4', color: '#a8a29e', cursor: 'not-allowed', boxShadow: 'none' },
  center: { display: 'flex', justifyContent: 'center', padding: '80px 0' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3ede6', borderTopColor: '#d97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  errorBox: { background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626', fontSize: '14px' },
  empty: { textAlign: 'center', padding: '80px 0' },
  floatingCart: {
    position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #d97706, #ea580c)',
    color: '#fff', borderRadius: '100px', padding: '14px 28px',
    display: 'flex', alignItems: 'center', gap: '10px',
    fontSize: '14px', fontWeight: 600,
    boxShadow: '0 8px 32px rgba(217,119,6,0.45)',
    cursor: 'pointer', zIndex: 50, fontFamily: "'DM Sans', sans-serif",
  },
};
