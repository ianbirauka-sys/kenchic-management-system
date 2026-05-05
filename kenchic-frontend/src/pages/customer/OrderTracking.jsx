import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyOrders } from '../../api/customer.api';
import PageWrapper from '../../components/PageWrapper';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_INFO = {
  pending:    { label: 'Pending',    color: '#92400e', bg: '#fff7ed', icon: '🕐' },
  confirmed:  { label: 'Confirmed',  color: '#1d4ed8', bg: '#eff6ff', icon: '✅' },
  processing: { label: 'Processing', color: '#6d28d9', bg: '#f5f3ff', icon: '⚙️' },
  shipped:    { label: 'Shipped',    color: '#c2410c', bg: '#fff7ed', icon: '🚚' },
  delivered:  { label: 'Delivered',  color: '#15803d', bg: '#f0fdf4', icon: '🎉' },
  cancelled:  { label: 'Cancelled',  color: '#dc2626', bg: '#fff5f5', icon: '❌' },
};

export default function OrderTracking() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getMyOrders()
      .then(res => setOrders(res.data.data))
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <PageWrapper>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Orders</h1>
          <p style={styles.sub}>Track and manage your Kenchic orders</p>
        </div>
        <button onClick={() => navigate('/customer/products')} style={styles.shopBtn}>
          + Shop More
        </button>
      </div>

      {loading && <div style={styles.center}><div style={styles.spinner} /></div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div style={styles.emptyState}>
          <p style={{ fontSize: '56px' }}>📦</p>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#44403c', marginTop: '16px' }}>No orders yet</p>
          <p style={{ fontSize: '14px', color: '#a8a29e', margin: '8px 0 24px' }}>Your order history will appear here</p>
          <button onClick={() => navigate('/customer/products')} style={styles.primaryBtn}>Start Shopping</button>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div style={styles.ordersList}>
          {orders.map(order => {
            const status = STATUS_INFO[order.status] || STATUS_INFO.pending;
            const stepIndex = STATUS_STEPS.indexOf(order.status);
            const isCancelled = order.status === 'cancelled';
            const isExpanded = expanded === order.id;

            return (
              <div key={order.id} style={styles.orderCard}>
                {/* Order header */}
                <div style={styles.orderHeader} onClick={() => setExpanded(isExpanded ? null : order.id)}>
                  <div style={styles.orderLeft}>
                    <div style={{ ...styles.statusIcon, background: status.bg, color: status.color }}>
                      {status.icon}
                    </div>
                    <div>
                      <p style={styles.orderId}>Order #{order.id}</p>
                      <p style={styles.orderDate}>{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div style={styles.orderRight}>
                    <span style={{ ...styles.statusBadge, color: status.color, background: status.bg }}>
                      {status.label}
                    </span>
                    <span style={styles.orderTotal}>KSh {Number(order.total_amount).toLocaleString()}</span>
                    <span style={{ color: '#a8a29e', fontSize: '13px' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Progress bar */}
                {!isCancelled && (
                  <div style={styles.progressWrap}>
                    <div style={styles.progressTrack}>
                      <div style={{ ...styles.progressFill, width: `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` }} />
                    </div>
                    <div style={styles.stepsRow}>
                      {STATUS_STEPS.map((s, i) => (
                        <div key={s} style={styles.stepItem}>
                          <div style={{
                            ...styles.stepDot,
                            background: i <= stepIndex ? '#d97706' : '#e7e5e4',
                            color: i <= stepIndex ? '#fff' : '#a8a29e',
                          }}>
                            {i < stepIndex ? '✓' : ''}
                          </div>
                          <span style={{ ...styles.stepLabel, color: i <= stepIndex ? '#d97706' : '#a8a29e', fontWeight: i === stepIndex ? 600 : 400 }}>
                            {s}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && (
                  <div style={styles.expandedBody}>
                    <div style={styles.detailGrid}>
                      <div style={styles.detailItem}>
                        <p style={styles.detailLabel}>Order type</p>
                        <p style={styles.detailValue}>{order.order_type}</p>
                      </div>
                      <div style={styles.detailItem}>
                        <p style={styles.detailLabel}>Payment</p>
                        <p style={{ ...styles.detailValue, color: order.payment_status === 'paid' ? '#15803d' : '#d97706', textTransform: 'capitalize' }}>
                          {order.payment_status || 'unpaid'}
                        </p>
                      </div>
                      {order.delivery_address && (
                        <div style={{ ...styles.detailItem, gridColumn: '1 / -1' }}>
                          <p style={styles.detailLabel}>Delivery address</p>
                          <p style={styles.detailValue}>{order.delivery_address}</p>
                        </div>
                      )}
                    </div>
                    <p style={styles.statusNote}>
                      {isCancelled ? 'This order was cancelled.' :
                        order.status === 'delivered' ? '🎉 Your order has been delivered. Enjoy!' :
                        '📦 Your order is being processed. We will keep you updated.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageWrapper>
  );
}

const styles = {
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' },
  title: { fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 700, color: '#1c0a00' },
  sub: { fontSize: '14px', color: '#78716c', marginTop: '4px' },
  shopBtn: { background: 'linear-gradient(135deg, #d97706, #ea580c)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 2px 10px rgba(217,119,6,0.3)' },
  primaryBtn: { background: 'linear-gradient(135deg, #d97706, #ea580c)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px 28px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 16px rgba(217,119,6,0.35)' },
  emptyState: { background: '#fff', borderRadius: '20px', border: '1px solid #ede8e0', padding: '80px 40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(180,80,0,0.05)' },
  errorBox: { background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626', fontSize: '14px' },
  center: { display: 'flex', justifyContent: 'center', padding: '80px 0' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3ede6', borderTopColor: '#d97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  ordersList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  orderCard: { background: '#fff', borderRadius: '16px', border: '1px solid #ede8e0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(180,80,0,0.05)' },
  orderHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', cursor: 'pointer' },
  orderLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  statusIcon: { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 },
  orderId: { fontWeight: 600, color: '#1c0a00', fontSize: '15px' },
  orderDate: { fontSize: '12px', color: '#a8a29e', marginTop: '2px' },
  orderRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  statusBadge: { fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '100px' },
  orderTotal: { fontWeight: 700, color: '#92400e', fontSize: '16px' },
  progressWrap: { padding: '4px 24px 20px' },
  progressTrack: { height: '4px', background: '#f5f0ea', borderRadius: '100px', margin: '0 0 12px', position: 'relative' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #d97706, #ea580c)', borderRadius: '100px', transition: 'width 0.5s ease' },
  stepsRow: { display: 'flex', justifyContent: 'space-between' },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 },
  stepDot: { width: '20px', height: '20px', borderRadius: '50%', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: '10px', textTransform: 'capitalize', textAlign: 'center' },
  expandedBody: { padding: '0 24px 20px', borderTop: '1px solid #f5f0ea' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '16px 0' },
  detailItem: {},
  detailLabel: { fontSize: '11px', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' },
  detailValue: { fontSize: '14px', fontWeight: 500, color: '#1c0a00', textTransform: 'capitalize' },
  statusNote: { fontSize: '13px', color: '#78716c', background: '#faf8f5', borderRadius: '10px', padding: '12px 16px' },
};
