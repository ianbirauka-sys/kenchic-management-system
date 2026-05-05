import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeliveries, createDelivery, getAllOrders } from '../../api/employee.api';
import PageWrapper from '../../components/PageWrapper';

const STATUS_STYLES = {
  scheduled:  { color: '#1d4ed8', bg: '#eff6ff', icon: '📦' },
  in_transit: { color: '#c2410c', bg: '#fff7ed', icon: '🚚' },
  delivered:  { color: '#15803d', bg: '#f0fdf4', icon: '✅' },
  failed:     { color: '#dc2626', bg: '#fff5f5', icon: '❌' },
};

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ order_id: '', scheduled_date: '', driver_name: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dRes, oRes] = await Promise.all([getDeliveries(), getAllOrders()]);
      setDeliveries(dRes.data.data);
      setOrders(oRes.data.data.filter(o => o.order_type === 'delivery' && o.status !== 'cancelled'));
    } catch { setError('Failed to load deliveries.'); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.order_id || !form.scheduled_date || !form.driver_name.trim()) { setFormError('All fields are required.'); return; }
    setFormError(''); setSaving(true);
    try {
      await createDelivery({ order_id: Number(form.order_id), scheduled_date: form.scheduled_date, driver_name: form.driver_name });
      setForm({ order_id: '', scheduled_date: '', driver_name: '' });
      setShowForm(false);
      fetchAll();
    } catch (err) { setFormError(err.response?.data?.message || 'Failed to schedule delivery.'); }
    finally { setSaving(false); }
  };

  const filtered = deliveries.filter(d => filter === 'all' || d.status === filter);
  const counts = { all: deliveries.length, scheduled: deliveries.filter(d => d.status === 'scheduled').length, in_transit: deliveries.filter(d => d.status === 'in_transit').length, delivered: deliveries.filter(d => d.status === 'delivered').length, failed: deliveries.filter(d => d.status === 'failed').length };
  const formatDate = (d) => new Date(d).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const today = new Date().toISOString().split('T')[0];

  return (
    <PageWrapper>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Delivery Planning</h1>
          <p style={styles.sub}>Schedule and track all outgoing deliveries</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchAll} style={styles.refreshBtn}>🔄 Refresh</button>
          <button onClick={() => setShowForm(!showForm)} style={styles.primaryBtn}>+ Schedule Delivery</button>
        </div>
      </div>

      {/* Schedule form */}
      {showForm && (
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>Schedule New Delivery</h2>
          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Order</label>
              <select value={form.order_id} onChange={e => setForm({ ...form, order_id: e.target.value })} style={styles.select}>
                <option value="">Select an order...</option>
                {orders.map(o => <option key={o.id} value={o.id}>#{o.id} — {o.customer_name} (KSh {Number(o.total_amount).toLocaleString()})</option>)}
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Scheduled date</label>
              <input type="date" min={today} value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Driver name</label>
              <input type="text" placeholder="Enter driver name..." value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} style={styles.input} />
            </div>
          </div>
          {formError && <p style={styles.errorText}>{formError}</p>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={handleCreate} disabled={saving} style={{ ...styles.primaryBtn, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Scheduling...' : 'Schedule Delivery'}
            </button>
            <button onClick={() => { setShowForm(false); setFormError(''); }} style={styles.outlineBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={styles.tabs}>
        {Object.entries(counts).map(([key, count]) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{ ...styles.tab, ...(filter === key ? styles.tabActive : {}) }}>
            {key.replace('_', ' ')} ({count})
          </button>
        ))}
      </div>

      {loading && <div style={styles.center}><div style={styles.spinner} /></div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ fontSize: '48px' }}>🚚</p>
              <p style={{ color: '#a8a29e', marginTop: '12px', marginBottom: '16px' }}>No deliveries found</p>
              <button onClick={() => setShowForm(true)} style={styles.primaryBtn}>Schedule first delivery</button>
            </div>
          ) : (
            <div style={styles.list}>
              {filtered.map(d => {
                const st = STATUS_STYLES[d.status] || STATUS_STYLES.scheduled;
                const isOverdue = d.status === 'scheduled' && new Date(d.scheduled_date) < new Date();
                return (
                  <div key={d.id} style={{ ...styles.deliveryCard, ...(isOverdue ? { borderColor: '#fecaca', background: '#fff5f5' } : {}) }}>
                    <div style={{ ...styles.deliveryIcon, background: st.bg, color: st.color }}>{st.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <p style={{ fontWeight: 600, color: '#1c0a00', fontSize: '15px' }}>Order #{d.order_id}</p>
                        {isOverdue && <span style={styles.overdueBadge}>Overdue</span>}
                        <span style={{ ...styles.statusBadge, color: st.color, background: st.bg }}>
                          {(d.status || 'scheduled').replace('_', ' ')}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#78716c' }}>{d.customer_name} · {d.delivery_address || 'No address'}</p>
                      <p style={{ fontSize: '13px', color: '#a8a29e', marginTop: '2px' }}>
                        Driver: <span style={{ color: '#44403c', fontWeight: 500 }}>{d.driver_name || '—'}</span>
                        {' · '}Scheduled: <span style={{ color: '#44403c', fontWeight: 500 }}>{formatDate(d.scheduled_date)}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input:focus, select:focus { outline: none; border-color: #d97706 !important; }`}</style>
    </PageWrapper>
  );
}

const styles = {
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' },
  title: { fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 700, color: '#1c0a00' },
  sub: { fontSize: '14px', color: '#78716c', marginTop: '4px' },
  refreshBtn: { background: '#fff', border: '1.5px solid #e7e5e4', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#44403c', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  primaryBtn: { background: 'linear-gradient(135deg, #d97706, #ea580c)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 2px 10px rgba(217,119,6,0.3)' },
  outlineBtn: { background: '#fff', color: '#78716c', border: '1.5px solid #e7e5e4', borderRadius: '10px', padding: '9px 20px', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  formCard: { background: '#fff', borderRadius: '16px', border: '1px solid #ede8e0', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(180,80,0,0.05)' },
  formTitle: { fontSize: '16px', fontWeight: 600, color: '#1c0a00', marginBottom: '16px', fontFamily: "'DM Sans', sans-serif" },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#44403c' },
  select: { border: '1.5px solid #e7e5e4', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", color: '#1c0a00', background: '#fff' },
  input: { border: '1.5px solid #e7e5e4', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", color: '#1c0a00', background: '#fff' },
  errorText: { color: '#dc2626', fontSize: '13px', marginTop: '8px' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid #ede8e0', paddingBottom: '0' },
  tab: { padding: '10px 16px', fontSize: '13px', fontWeight: 500, color: '#78716c', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textTransform: 'capitalize' },
  tabActive: { color: '#d97706', borderBottomColor: '#d97706', fontWeight: 600 },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  deliveryCard: { background: '#fff', borderRadius: '14px', border: '1px solid #ede8e0', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(180,80,0,0.05)' },
  deliveryIcon: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 },
  overdueBadge: { fontSize: '11px', fontWeight: 600, color: '#dc2626', background: '#fff5f5', padding: '2px 8px', borderRadius: '100px' },
  statusBadge: { fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px', textTransform: 'capitalize' },
  emptyState: { background: '#fff', borderRadius: '16px', border: '1px solid #ede8e0', padding: '60px', textAlign: 'center' },
  center: { display: 'flex', justifyContent: 'center', padding: '80px 0' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3ede6', borderTopColor: '#d97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  errorBox: { background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' },
};
