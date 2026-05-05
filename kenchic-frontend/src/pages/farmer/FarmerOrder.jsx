import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { placeChickOrder, getFarmerOrders } from '../../api/farmer.api';
import { useAuth } from '../../context/AuthContext';
import PageWrapper from '../../components/PageWrapper';

const STATUS_STYLES = {
  pending:    { color: '#92400e', bg: '#fff7ed' },
  confirmed:  { color: '#1d4ed8', bg: '#eff6ff' },
  processing: { color: '#6d28d9', bg: '#f5f3ff' },
  shipped:    { color: '#c2410c', bg: '#fff7ed' },
  delivered:  { color: '#15803d', bg: '#f0fdf4' },
  cancelled:  { color: '#dc2626', bg: '#fff5f5' },
};

export default function FarmerOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('farmer_cart') || '[]'));
  const [step, setStep] = useState('order');
  const [orderType, setOrderType] = useState('delivery');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [pastOrders, setPastOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    getFarmerOrders()
      .then(res => setPastOrders(res.data.data))
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, []);

  const updateQty = (id, delta) => {
    setCart(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0);
      localStorage.setItem('farmer_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const removeItem = (id) => {
    setCart(prev => {
      const updated = prev.filter(i => i.id !== id);
      localStorage.setItem('farmer_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalChicks = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) { setError('Your order is empty. Please add chicks from the catalog.'); return; }
    if (orderType === 'delivery' && !address.trim()) { setError('Please enter a delivery address.'); return; }
    setError(''); setLoading(true);
    try {
      const items = cart.map(i => ({ product_id: i.id, quantity: i.quantity, unit_price: i.price }));
      const res = await placeChickOrder({ items, delivery_address: address, order_type: orderType });
      setOrderId(res.data.data.order_id);
      localStorage.removeItem('farmer_cart');
      setCart([]);
      setStep('confirmation');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally { setLoading(false); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

  // ── Confirmation ──────────────────────────────────────────────────────────
  if (step === 'confirmation') return (
    <PageWrapper>
      <div style={styles.centerPage}>
        <div style={styles.resultCard}>
          <div style={styles.resultIcon}>✅</div>
          <h1 style={styles.resultTitle}>Order Placed!</h1>
          <p style={styles.resultSub}>Your chick order has been received. Our team will confirm it shortly.</p>
          <div style={styles.orderIdBadge}>Order #{orderId}</div>
          <div style={styles.deliveryNote}>
            {orderType === 'pickup'
              ? '📍 You selected pickup — we will contact you when ready for collection.'
              : '🚚 Your chicks will be delivered to the address provided.'}
          </div>
          <div style={styles.resultActions}>
            <button onClick={() => navigate('/farmer/chicks')} style={styles.primaryBtn}>Back to Catalog</button>
            <button onClick={() => setStep('order')} style={styles.outlineBtn}>View My Orders</button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );

  return (
    <PageWrapper>
      <h1 style={styles.pageTitle}>Place Order</h1>
      <p style={styles.pageSub}>Review your chicks and choose how you'd like to receive them</p>

      <div style={styles.layout}>
        {/* Left column */}
        <div style={styles.leftCol}>
          {/* Cart items */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Your Order</h2>
            {cart.length === 0 ? (
              <div style={styles.emptyCart}>
                <p style={{ fontSize: '40px' }}>🐣</p>
                <p style={{ color: '#a8a29e', margin: '10px 0 16px', fontSize: '14px' }}>No chicks added yet</p>
                <button onClick={() => navigate('/farmer/chicks')} style={styles.primaryBtn}>Browse Catalog</button>
              </div>
            ) : (
              <div>
                {cart.map(item => (
                  <div key={item.id} style={styles.cartItem}>
                    <div style={styles.chickIcon}>{item.name.includes('Broiler') ? '🐥' : '🐣'}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, color: '#1c0a00', fontSize: '15px' }}>{item.name}</p>
                      <p style={{ fontSize: '13px', color: '#78716c', marginTop: '2px' }}>KSh {Number(item.price).toLocaleString()} / chick</p>
                    </div>
                    <div style={styles.qtyRow}>
                      <button onClick={() => updateQty(item.id, -1)} style={styles.qtyBtn}>−</button>
                      <span style={{ fontWeight: 600, color: '#1c0a00', minWidth: '28px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={styles.qtyBtn}>+</button>
                    </div>
                    <p style={{ fontWeight: 700, color: '#92400e', minWidth: '110px', textAlign: 'right' }}>
                      KSh {(item.price * item.quantity).toLocaleString()}
                    </p>
                    <button onClick={() => removeItem(item.id)} style={styles.removeBtn}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery / Pickup */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>How would you like to receive your chicks?</h2>
            <div style={styles.toggleRow}>
              {[
                { value: 'delivery', icon: '🚚', label: 'Delivery', desc: 'Chicks delivered to your farm' },
                { value: 'pickup',   icon: '🏪', label: 'Pickup',   desc: 'Collect from nearest outlet' },
              ].map(opt => (
                <label key={opt.value} style={{ ...styles.toggleOpt, ...(orderType === opt.value ? styles.toggleOptActive : {}) }}>
                  <input type="radio" name="orderType" value={opt.value} checked={orderType === opt.value} onChange={() => setOrderType(opt.value)} style={{ display: 'none' }} />
                  <span style={{ fontSize: '32px' }}>{opt.icon}</span>
                  <span style={{ fontWeight: 600, color: '#1c0a00', fontSize: '15px' }}>{opt.label}</span>
                  <span style={{ fontSize: '12px', color: '#78716c', textAlign: 'center' }}>{opt.desc}</span>
                </label>
              ))}
            </div>
            {orderType === 'delivery' && (
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Farm / Delivery address</label>
                <textarea rows={3} placeholder="Enter your farm address or delivery location..."
                  value={address} onChange={e => setAddress(e.target.value)} style={styles.textarea} />
              </div>
            )}
            {orderType === 'pickup' && (
              <div style={styles.pickupNote}>
                <span>📍</span>
                <span style={{ fontSize: '13px', color: '#1d4ed8' }}>You can collect from any Kenchic outlet. We will call you when your order is ready.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right — summary */}
        <div style={styles.rightCol}>
          <div style={{ ...styles.section, position: 'sticky', top: '80px' }}>
            <h2 style={styles.sectionTitle}>Order Summary</h2>
            <div style={styles.summaryRows}>
              {[
                ['Total chicks', totalChicks],
                ['Delivery type', orderType],
                ['Farmer', user?.name],
              ].map(([label, value]) => (
                <div key={label} style={styles.summaryRow}>
                  <span style={{ color: '#78716c', fontSize: '14px' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: '#1c0a00', fontSize: '14px', textTransform: 'capitalize' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={styles.totalRow}>
              <span>Total</span>
              <span style={{ color: '#d97706', fontSize: '22px' }}>KSh {total.toLocaleString()}</span>
            </div>
            {error && <p style={styles.errorText}>{error}</p>}
            <button onClick={handlePlaceOrder} disabled={loading || cart.length === 0}
              style={{ ...styles.primaryBtn, width: '100%', marginTop: '16px', opacity: (loading || cart.length === 0) ? 0.6 : 1 }}>
              {loading ? 'Placing order...' : 'Place Order'}
            </button>
            <button onClick={() => navigate('/farmer/chicks')} style={{ ...styles.outlineBtn, width: '100%', marginTop: '10px' }}>
              ← Add more chicks
            </button>
          </div>
        </div>
      </div>

      {/* Past orders */}
      {!loadingOrders && pastOrders.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ ...styles.sectionTitle, fontSize: '20px', marginBottom: '16px' }}>My Past Orders</h2>
          <div style={styles.section}>
            {pastOrders.map(order => {
              const st = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
              return (
                <div key={order.id} style={styles.pastOrderRow}>
                  <div>
                    <p style={{ fontWeight: 600, color: '#1c0a00', fontSize: '15px' }}>Order #{order.id}</p>
                    <p style={{ fontSize: '13px', color: '#a8a29e', marginTop: '2px' }}>
                      {formatDate(order.created_at)} · <span style={{ textTransform: 'capitalize' }}>{order.order_type}</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ ...styles.statusBadge, color: st.color, background: st.bg }}>{order.status}</span>
                    <span style={{ fontWeight: 700, color: '#92400e' }}>KSh {Number(order.total_amount).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`input:focus, textarea:focus { outline: none; border-color: #d97706 !important; }`}</style>
    </PageWrapper>
  );
}

const styles = {
  pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 700, color: '#1c0a00', marginBottom: '6px' },
  pageSub: { fontSize: '14px', color: '#78716c', marginBottom: '28px' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' },
  leftCol: {},
  rightCol: {},
  section: { background: '#fff', borderRadius: '16px', border: '1px solid #ede8e0', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(180,80,0,0.05)' },
  sectionTitle: { fontSize: '16px', fontWeight: 600, color: '#1c0a00', marginBottom: '16px', fontFamily: "'DM Sans', sans-serif" },
  emptyCart: { textAlign: 'center', padding: '32px 0' },
  cartItem: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0', borderBottom: '1px solid #f5f0ea' },
  chickIcon: { width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #fde8c8, #fdba74)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 },
  qtyRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  qtyBtn: { width: '32px', height: '32px', borderRadius: '50%', border: '1.5px solid #e7e5e4', background: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#44403c' },
  removeBtn: { background: 'none', border: 'none', color: '#a8a29e', cursor: 'pointer', fontSize: '16px', padding: '4px' },
  toggleRow: { display: 'flex', gap: '12px', marginBottom: '16px' },
  toggleOpt: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '18px', border: '2px solid #e7e5e4', borderRadius: '14px', cursor: 'pointer', background: '#fafafa', transition: 'all 0.15s' },
  toggleOptActive: { border: '2px solid #d97706', background: '#fff7ed', boxShadow: '0 4px 16px rgba(217,119,6,0.15)' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#44403c' },
  textarea: { border: '1.5px solid #e7e5e4', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", color: '#1c0a00', resize: 'none', background: '#fafafa' },
  pickupNote: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' },
  summaryRows: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '17px', color: '#1c0a00', borderTop: '1px solid #f5f0ea', paddingTop: '16px', marginTop: '4px' },
  errorText: { color: '#dc2626', fontSize: '13px', marginTop: '8px' },
  primaryBtn: { background: 'linear-gradient(135deg, #d97706, #ea580c)', color: '#fff', border: 'none', borderRadius: '12px', padding: '13px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 16px rgba(217,119,6,0.3)', textAlign: 'center' },
  outlineBtn: { background: '#fff', color: '#78716c', border: '1.5px solid #e7e5e4', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'center' },
  pastOrderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f5f0ea' },
  statusBadge: { fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '100px', textTransform: 'capitalize' },
  centerPage: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  resultCard: { background: '#fff', borderRadius: '24px', padding: '48px 40px', textAlign: 'center', maxWidth: '460px', width: '100%', boxShadow: '0 8px 40px rgba(180,80,0,0.1)', border: '1px solid #ede8e0' },
  resultIcon: { fontSize: '56px', marginBottom: '16px' },
  resultTitle: { fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: 700, color: '#1c0a00', marginBottom: '8px' },
  resultSub: { fontSize: '14px', color: '#78716c', marginBottom: '16px', lineHeight: 1.6 },
  orderIdBadge: { background: '#fff7ed', color: '#d97706', fontWeight: 700, fontSize: '15px', padding: '8px 20px', borderRadius: '100px', display: 'inline-block', marginBottom: '12px' },
  deliveryNote: { fontSize: '13px', color: '#78716c', background: '#faf8f5', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px' },
  resultActions: { display: 'flex', gap: '12px', justifyContent: 'center' },
};
