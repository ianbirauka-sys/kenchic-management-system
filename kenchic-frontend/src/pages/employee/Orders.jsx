import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllOrders, updateOrderStatus } from '../../api/employee.api';
import PageWrapper from '../../components/PageWrapper';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_STYLES = {
  pending:    { color: '#92400e', bg: '#fff7ed' },
  confirmed:  { color: '#1d4ed8', bg: '#eff6ff' },
  processing: { color: '#6d28d9', bg: '#f5f3ff' },
  shipped:    { color: '#c2410c', bg: '#fff7ed' },
  delivered:  { color: '#15803d', bg: '#f0fdf4' },
  cancelled:  { color: '#dc2626', bg: '#fff5f5' },
};

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = () => {
    setLoading(true);
    getAllOrders()
      .then(res => setOrders(res.data.data))
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false));
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch { alert('Failed to update status.'); }
    finally { setUpdating(null); }
  };

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter;
    const matchSearch = !search || o.customer_name?.toLowerCase().includes(search.toLowerCase()) || String(o.id).includes(search);
    return matchFilter && matchSearch;
  });

  const counts = STATUSES.reduce((acc, s) => { acc[s] = orders.filter(o => o.status === s).length; return acc; }, {});
  const formatDate = (d) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <PageWrapper>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>All Orders</h1>
          <p style={styles.sub}>{orders.length} total orders across all portals</p>
        </div>
        <button onClick={fetchOrders} style={styles.refreshBtn}>🔄 Refresh</button>
      </div>

      {/* Status cards */}
      <div style={styles.statusCards}>
        {STATUSES.map(s => {
          const st = STATUS_STYLES[s];
          return (
            <button key={s} onClick={() => setFilter(filter === s ? 'all' : s)}
              style={{ ...styles.statusCard, ...(filter === s ? { ...styles.statusCardActive, borderColor: st.color } : {}) }}>
              <p style={{ fontSize: '22px', fontWeight: 700, color: st.color }}>{counts[s] || 0}</p>
              <p style={{ fontSize: '11px', color: '#78716c', textTransform: 'capitalize', marginTop: '2px' }}>{s}</p>
            </button>
          );
        })}
      </div>

      {/* Search + filter */}
      <div style={styles.filterRow}>
        <div style={styles.searchWrap}>
          <span>🔍</span>
          <input type="text" placeholder="Search by customer name or order ID..." value={search} onChange={e => setSearch(e.target.value)} style={styles.searchInput} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={styles.select}>
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
        </select>
      </div>

      {loading && <div style={styles.center}><div style={styles.spinner} /></div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      {!loading && !error && (
        <div style={styles.tableWrap}>
          {filtered.length === 0 ? (
            <div style={styles.emptyState}><p style={{ fontSize: '48px' }}>📋</p><p style={{ color: '#a8a29e', marginTop: '12px' }}>No orders found</p></div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  {['Order', 'Customer', 'Type', 'Total', 'Status', 'Update', 'Date'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const st = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
                  return (
                    <>
                      <tr key={order.id} style={styles.tr} onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                        <td style={styles.td}><span style={styles.orderId}>#{order.id}</span></td>
                        <td style={styles.td}>
                          <p style={{ fontWeight: 600, color: '#1c0a00', fontSize: '14px' }}>{order.customer_name}</p>
                          <p style={{ fontSize: '12px', color: '#a8a29e' }}>{order.customer_email}</p>
                        </td>
                        <td style={styles.td}><span style={styles.typeBadge}>{order.order_type}</span></td>
                        <td style={styles.td}><span style={styles.amount}>KSh {Number(order.total_amount).toLocaleString()}</span></td>
                        <td style={styles.td}>
                          <span style={{ ...styles.statusBadge, color: st.color, background: st.bg }}>{order.status}</span>
                        </td>
                        <td style={styles.td} onClick={e => e.stopPropagation()}>
                          <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)} disabled={updating === order.id} style={styles.statusSelect}>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td style={styles.td}><span style={{ fontSize: '12px', color: '#a8a29e' }}>{formatDate(order.created_at)}</span></td>
                      </tr>
                      {expanded === order.id && (
                        <tr key={`${order.id}-detail`}>
                          <td colSpan={7} style={styles.expandedRow}>
                            <span style={{ fontWeight: 500, color: '#44403c' }}>📍 {order.delivery_address || 'Pickup — no address'}</span>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input:focus, select:focus { outline: none; }`}</style>
    </PageWrapper>
  );
}

const styles = {
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' },
  title: { fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 700, color: '#1c0a00' },
  sub: { fontSize: '14px', color: '#78716c', marginTop: '4px' },
  refreshBtn: { background: '#fff', border: '1.5px solid #e7e5e4', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#44403c', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  statusCards: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '20px' },
  statusCard: { background: '#fff', border: '1.5px solid #ede8e0', borderRadius: '12px', padding: '14px 10px', textAlign: 'center', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif', transition: 'all 0.15s" },
  statusCardActive: { background: '#fff7ed', boxShadow: '0 2px 8px rgba(217,119,6,0.15)' },
  filterRow: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  searchWrap: { display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1.5px solid #e7e5e4', borderRadius: '12px', padding: '0 16px', flex: 1, minWidth: '200px' },
  searchInput: { border: 'none', background: 'transparent', padding: '12px 0', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", color: '#1c0a00', width: '100%' },
  select: { border: '1.5px solid #e7e5e4', borderRadius: '12px', padding: '10px 16px', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", color: '#44403c', background: '#fff', cursor: 'pointer' },
  tableWrap: { background: '#fff', borderRadius: '16px', border: '1px solid #ede8e0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(180,80,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  thead: { background: '#faf8f5', borderBottom: '1px solid #ede8e0' },
  th: { padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr: { borderBottom: '1px solid #f5f0ea', cursor: 'pointer', transition: 'background 0.1s' },
  td: { padding: '14px 16px', verticalAlign: 'middle' },
  orderId: { fontWeight: 700, color: '#d97706', fontSize: '14px' },
  typeBadge: { fontSize: '12px', color: '#78716c', background: '#f5f0ea', padding: '3px 10px', borderRadius: '100px', textTransform: 'capitalize' },
  amount: { fontWeight: 700, color: '#92400e', fontSize: '14px' },
  statusBadge: { fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '100px', textTransform: 'capitalize' },
  statusSelect: { border: '1.5px solid #e7e5e4', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", color: '#44403c', background: '#fff', cursor: 'pointer' },
  expandedRow: { padding: '12px 16px', background: '#faf8f5', fontSize: '13px' },
  emptyState: { padding: '60px', textAlign: 'center' },
  center: { display: 'flex', justifyContent: 'center', padding: '80px 0' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3ede6', borderTopColor: '#d97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  errorBox: { background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' },
};
