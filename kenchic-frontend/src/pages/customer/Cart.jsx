import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { placeOrder } from '../../api/customer.api';
import { initiatePayment, checkPaymentStatus } from '../../api/payment.api';
import { useAuth } from '../../context/AuthContext';
import PageWrapper from '../../components/PageWrapper';

const CATEGORY_EMOJI = { chicks: '🐣', poultry: '🍗', feed: '🌾', equipment: '🔧' };

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  const [step, setStep] = useState('cart');
  const [orderType, setOrderType] = useState('delivery');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [pollCount, setPollCount] = useState(0);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const updateQty = (id, delta) => {
    setCart(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0);
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const removeItem = (id) => {
    setCart(prev => {
      const updated = prev.filter(i => i.id !== id);
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCheckout = async () => {
    if (orderType === 'delivery' && !address.trim()) { setError('Please enter a delivery address'); return; }
    setError(''); setLoading(true);
    try {
      const items = cart.map(i => ({ product_id: i.id, quantity: i.quantity, unit_price: i.price }));
      const res = await placeOrder({ items, delivery_address: address, order_type: orderType });
      setOrderId(res.data.data.order_id);
      localStorage.removeItem('cart');
      setCart([]);
      setStep('payment');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally { setLoading(false); }
  };

  const handlePayment = async () => {
    if (!phone.trim()) { setError('Please enter your M-Pesa phone number'); return; }
    setError(''); setLoading(true);
    try {
      const res = await initiatePayment({ order_id: orderId, phone_number: phone });
      setCheckoutRequestId(res.data.data.checkout_request_id);
      setStep('polling');
      pollPaymentStatus(res.data.data.checkout_request_id, 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment.');
    } finally { setLoading(false); }
  };

  const pollPaymentStatus = (reqId, count) => {
    if (count >= 12) { setStep('payment'); setError('Payment timed out. Please try again.'); return; }
    setPollCount(count);
    setTimeout(async () => {
      try {
        const res = await checkPaymentStatus(reqId);
        const status = res.data.data.status;
        if (status === 'completed') setStep('confirmation');
        else if (status === 'failed') { setStep('payment'); setError('Payment failed. Please try again.'); }
        else pollPaymentStatus(reqId, count + 1);
      } catch { pollPaymentStatus(reqId, count + 1); }
    }, 5000);
  };

  // ── Confirmation ──────────────────────────────────────────────────────────
  if (step === 'confirmation') return (
    <PageWrapper cartCount={0}>
      <div style={styles.centerPage}>
        <div style={styles.resultCard}>
          <div style={styles.resultIcon}>🎉</div>
          <h1 style={styles.resultTitle}>Payment Successful!</h1>
          <p style={styles.resultSub}>Your M-Pesa payment was received and your order is confirmed.</p>
          <div style={styles.orderIdBadge}>Order #{orderId}</div>
          <div style={styles.resultActions}>
            <button onClick={() => navigate('/customer/orders')} style={styles.primaryBtn}>Track Order</button>
            <button onClick={() => navigate('/customer/products')} style={styles.outlineBtn}>Continue Shopping</button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );

  // ── Polling ───────────────────────────────────────────────────────────────
  if (step === 'polling') return (
    <PageWrapper cartCount={0}>
      <div style={styles.centerPage}>
        <div style={styles.resultCard}>
          <div style={styles.resultIcon}>📱</div>
          <h1 style={styles.resultTitle}>Check your phone</h1>
          <p style={styles.resultSub}>An M-Pesa prompt has been sent to <strong>{phone}</strong>. Enter your PIN to complete payment.</p>
          <div style={styles.pollingRow}>
            <div style={styles.spinner} />
            <span style={{ fontSize: '14px', color: '#78716c' }}>Waiting for confirmation...</span>
          </div>
          <div style={styles.dots}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ ...styles.dot, background: i < pollCount ? '#d97706' : '#e7e5e4' }} />
            ))}
          </div>
          <p style={{ fontSize: '13px', color: '#a8a29e', marginTop: '8px' }}>
            KSh {total.toLocaleString()} · Order #{orderId}
          </p>
          <button onClick={() => { setStep('payment'); setError(''); }} style={{ ...styles.outlineBtn, marginTop: '20px' }}>
            Cancel and try again
          </button>
        </div>
      </div>
    </PageWrapper>
  );

  // ── Payment ───────────────────────────────────────────────────────────────
  if (step === 'payment') return (
    <PageWrapper cartCount={0}>
      <div style={styles.narrowPage}>
        <button onClick={() => setStep('checkout')} style={styles.backBtn}>← Back</button>
        <h1 style={styles.pageTitle}>Pay with M-Pesa</h1>
        <div style={styles.payCard}>
          <div style={styles.mpesaHeader}>
            <div style={styles.mpesaLogo}>M</div>
            <div>
              <p style={{ fontWeight: 600, color: '#1c0a00', fontSize: '15px' }}>M-Pesa STK Push</p>
              <p style={{ fontSize: '13px', color: '#78716c' }}>You will receive a prompt on your phone</p>
            </div>
          </div>
          <div style={styles.amountBox}>
            <p style={{ fontSize: '13px', color: '#78716c' }}>Amount to pay</p>
            <p style={styles.amountFig}>KSh {total.toLocaleString()}</p>
            <p style={{ fontSize: '12px', color: '#a8a29e' }}>Order #{orderId}</p>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>M-Pesa phone number</label>
            <div style={styles.phoneRow}>
              <div style={styles.countryCode}>🇰🇪 +254</div>
              <input
                type="tel" placeholder="0712 345 678"
                value={phone} onChange={e => setPhone(e.target.value)}
                style={styles.phoneInput}
              />
            </div>
            <p style={{ fontSize: '12px', color: '#a8a29e', marginTop: '4px' }}>Enter the Safaricom number registered for M-Pesa</p>
          </div>
          {error && <p style={styles.errorText}>{error}</p>}
          <button onClick={handlePayment} disabled={loading} style={{ ...styles.primaryBtn, width: '100%', marginTop: '8px' }}>
            {loading ? 'Sending prompt...' : '📱 Send M-Pesa Prompt'}
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#a8a29e', marginTop: '16px' }}>
          Secured by Safaricom M-Pesa. Your PIN is never shared with Kenchic.
        </p>
      </div>
    </PageWrapper>
  );

  // ── Checkout ──────────────────────────────────────────────────────────────
  if (step === 'checkout') return (
    <PageWrapper cartCount={cartCount}>
      <div style={styles.narrowPage}>
        <button onClick={() => setStep('cart')} style={styles.backBtn}>← Back to cart</button>
        <h1 style={styles.pageTitle}>Checkout</h1>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Delivery options</h2>
          <div style={styles.toggleRow}>
            {[{ value: 'delivery', icon: '🚚', label: 'Delivery', desc: 'Delivered to your address' },
              { value: 'pickup', icon: '🏪', label: 'Pickup', desc: 'Collect from our outlet' }].map(opt => (
              <label key={opt.value} style={{ ...styles.toggleOpt, ...(orderType === opt.value ? styles.toggleOptActive : {}) }}>
                <input type="radio" name="orderType" value={opt.value} checked={orderType === opt.value} onChange={() => setOrderType(opt.value)} style={{ display: 'none' }} />
                <span style={{ fontSize: '28px' }}>{opt.icon}</span>
                <span style={{ fontWeight: 600, color: '#1c0a00', fontSize: '15px' }}>{opt.label}</span>
                <span style={{ fontSize: '12px', color: '#78716c' }}>{opt.desc}</span>
              </label>
            ))}
          </div>
          {orderType === 'delivery' && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Delivery address</label>
              <textarea rows={3} placeholder="Enter your full delivery address..."
                value={address} onChange={e => setAddress(e.target.value)}
                style={styles.textarea} />
            </div>
          )}
        </div>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Order summary</h2>
          {cart.map(item => (
            <div key={item.id} style={styles.summaryRow}>
              <span style={{ color: '#44403c' }}>{item.name} × {item.quantity}</span>
              <span style={{ fontWeight: 600, color: '#92400e' }}>KSh {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div style={styles.totalRow}>
            <span>Total</span>
            <span style={{ color: '#92400e', fontSize: '20px' }}>KSh {total.toLocaleString()}</span>
          </div>
        </div>
        {error && <p style={styles.errorText}>{error}</p>}
        <button onClick={handleCheckout} disabled={loading} style={{ ...styles.primaryBtn, width: '100%' }}>
          {loading ? 'Processing...' : `Continue to Payment — KSh ${total.toLocaleString()}`}
        </button>
      </div>
    </PageWrapper>
  );

  // ── Cart ──────────────────────────────────────────────────────────────────
  return (
    <PageWrapper cartCount={cartCount}>
      <h1 style={styles.pageTitle}>Your Cart</h1>
      {cart.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={{ fontSize: '56px' }}>🛒</p>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#44403c', marginTop: '16px' }}>Your cart is empty</p>
          <p style={{ fontSize: '14px', color: '#a8a29e', margin: '8px 0 24px' }}>Browse our products and add items to get started</p>
          <button onClick={() => navigate('/customer/products')} style={styles.primaryBtn}>Browse Products</button>
        </div>
      ) : (
        <div style={styles.cartLayout}>
          {/* Items */}
          <div style={styles.itemsCol}>
            <div style={styles.section}>
              {cart.map(item => (
                <div key={item.id} style={styles.cartItem}>
                  <div style={styles.itemImg}>
                    <span style={{ fontSize: '28px' }}>{CATEGORY_EMOJI[item.category] || '📦'}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: '#1c0a00', fontSize: '15px' }}>{item.name}</p>
                    <p style={{ fontSize: '13px', color: '#78716c', marginTop: '2px' }}>KSh {Number(item.price).toLocaleString()} each</p>
                  </div>
                  <div style={styles.qtyRow}>
                    <button onClick={() => updateQty(item.id, -1)} style={styles.qtyBtn}>−</button>
                    <span style={{ fontWeight: 600, color: '#1c0a00', minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)} style={styles.qtyBtn}>+</button>
                  </div>
                  <p style={{ fontWeight: 700, color: '#92400e', fontSize: '16px', minWidth: '100px', textAlign: 'right' }}>
                    KSh {(item.price * item.quantity).toLocaleString()}
                  </p>
                  <button onClick={() => removeItem(item.id)} style={styles.removeBtn}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div style={styles.summaryCol}>
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Order total</h2>
              <div style={styles.totalRow}>
                <span>Total</span>
                <span style={{ color: '#92400e', fontSize: '22px' }}>KSh {total.toLocaleString()}</span>
              </div>
              <button onClick={() => setStep('checkout')} style={{ ...styles.primaryBtn, width: '100%', marginTop: '16px' }}>
                Proceed to Checkout
              </button>
              <button onClick={() => navigate('/customer/products')} style={{ ...styles.outlineBtn, width: '100%', marginTop: '10px' }}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageWrapper>
  );
}

const styles = {
  pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 700, color: '#1c0a00', marginBottom: '24px' },
  backBtn: { background: 'none', border: 'none', color: '#78716c', fontSize: '14px', cursor: 'pointer', padding: '0 0 16px', fontFamily: "'DM Sans', sans-serif" },
  narrowPage: { maxWidth: '560px', margin: '0 auto' },
  centerPage: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  section: { background: '#fff', borderRadius: '16px', border: '1px solid #ede8e0', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(180,80,0,0.05)' },
  sectionTitle: { fontSize: '16px', fontWeight: 600, color: '#1c0a00', marginBottom: '16px', fontFamily: "'DM Sans', sans-serif" },
  cartLayout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' },
  itemsCol: {},
  summaryCol: { position: 'sticky', top: '80px' },
  cartItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #f5f0ea' },
  itemImg: { width: '56px', height: '56px', borderRadius: '12px', background: 'linear-gradient(135deg, #fde8c8, #fdba74)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  qtyRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  qtyBtn: { width: '32px', height: '32px', borderRadius: '50%', border: '1.5px solid #e7e5e4', background: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#44403c' },
  removeBtn: { background: 'none', border: 'none', color: '#a8a29e', cursor: 'pointer', fontSize: '16px', padding: '4px', transition: 'color 0.15s' },
  toggleRow: { display: 'flex', gap: '12px', marginBottom: '16px' },
  toggleOpt: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px', border: '2px solid #e7e5e4', borderRadius: '14px', cursor: 'pointer', background: '#fafafa', transition: 'all 0.15s' },
  toggleOptActive: { border: '2px solid #d97706', background: '#fff7ed', boxShadow: '0 4px 16px rgba(217,119,6,0.15)' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '17px', color: '#1c0a00', borderTop: '1px solid #f5f0ea', paddingTop: '16px', marginTop: '8px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#44403c' },
  textarea: { border: '1.5px solid #e7e5e4', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", color: '#1c0a00', resize: 'none', background: '#fafafa' },
  primaryBtn: { background: 'linear-gradient(135deg, #d97706, #ea580c)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px 24px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 16px rgba(217,119,6,0.35)', display: 'inline-block', textAlign: 'center' },
  outlineBtn: { background: '#fff', color: '#78716c', border: '1.5px solid #e7e5e4', borderRadius: '12px', padding: '13px 24px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'inline-block', textAlign: 'center' },
  emptyState: { background: '#fff', borderRadius: '20px', border: '1px solid #ede8e0', padding: '80px 40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(180,80,0,0.05)' },
  resultCard: { background: '#fff', borderRadius: '24px', padding: '48px 40px', textAlign: 'center', maxWidth: '460px', width: '100%', boxShadow: '0 8px 40px rgba(180,80,0,0.1)', border: '1px solid #ede8e0' },
  resultIcon: { fontSize: '56px', marginBottom: '16px' },
  resultTitle: { fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: 700, color: '#1c0a00', marginBottom: '8px' },
  resultSub: { fontSize: '14px', color: '#78716c', marginBottom: '20px', lineHeight: 1.6 },
  orderIdBadge: { background: '#fff7ed', color: '#d97706', fontWeight: 700, fontSize: '15px', padding: '8px 20px', borderRadius: '100px', display: 'inline-block', marginBottom: '24px' },
  resultActions: { display: 'flex', gap: '12px', justifyContent: 'center' },
  pollingRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '16px 0' },
  dots: { display: 'flex', justifyContent: 'center', gap: '6px', margin: '8px 0' },
  dot: { width: '8px', height: '8px', borderRadius: '50%' },
  spinner: { width: '20px', height: '20px', border: '3px solid #f3ede6', borderTopColor: '#d97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  payCard: { background: '#fff', borderRadius: '16px', border: '1px solid #ede8e0', padding: '28px', boxShadow: '0 2px 8px rgba(180,80,0,0.05)' },
  mpesaHeader: { display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '20px', borderBottom: '1px solid #f5f0ea', marginBottom: '20px' },
  mpesaLogo: { width: '48px', height: '48px', background: 'linear-gradient(135deg, #16a34a, #15803d)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: 800 },
  amountBox: { background: '#fff7ed', borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'center' },
  amountFig: { fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 700, color: '#d97706', margin: '4px 0' },
  phoneRow: { display: 'flex', gap: '8px' },
  countryCode: { background: '#f5f0ea', border: '1.5px solid #e7e5e4', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#44403c', whiteSpace: 'nowrap' },
  phoneInput: { flex: 1, border: '1.5px solid #e7e5e4', borderRadius: '10px', padding: '12px 16px', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", color: '#1c0a00', background: '#fafafa' },
  errorText: { color: '#dc2626', fontSize: '13px', margin: '8px 0' },
};
