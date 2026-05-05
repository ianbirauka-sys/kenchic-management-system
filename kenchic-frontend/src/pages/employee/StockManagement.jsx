import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStock, updateStock } from '../../api/employee.api';
import PageWrapper from '../../components/PageWrapper';

const CATEGORY_EMOJI = { chicks: '🐣', poultry: '🍗', feed: '🌾', equipment: '🔧' };

const getLevel = (qty) => {
  if (qty === 0) return { label: 'Out of stock', color: '#dc2626', bg: '#fff5f5', bar: '#ef4444', pct: 0 };
  if (qty <= 20)  return { label: 'Critical',     color: '#dc2626', bg: '#fff5f5', bar: '#f87171', pct: 10 };
  if (qty <= 50)  return { label: 'Low',           color: '#d97706', bg: '#fff7ed', bar: '#fbbf24', pct: 30 };
  if (qty <= 150) return { label: 'Medium',        color: '#1d4ed8', bg: '#eff6ff', bar: '#60a5fa', pct: 65 };
  return           { label: 'Good',               color: '#15803d', bg: '#f0fdf4', bar: '#4ade80', pct: 100 };
};

export default function StockManagement() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [newQty, setNewQty] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [successId, setSuccessId] = useState(null);

  useEffect(() => { fetchStock(); }, []);

  const fetchStock = () => {
    setLoading(true);
    getStock()
      .then(res => setStock(res.data.data))
      .catch(() => setError('Failed to load stock.'))
      .finally(() => setLoading(false));
  };

  const handleSave = async (id) => {
    if (newQty === '' || isNaN(newQty) || Number(newQty) < 0) { alert('Please enter a valid quantity.'); return; }
    setSaving(true);
    try {
      await updateStock(id, Number(newQty));
      setStock(prev => prev.map(i => i.id === id ? { ...i, stock_quantity: Number(newQty) } : i));
      setEditing(null);
      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 2000);
    } catch { alert('Failed to update stock.'); }
    finally { setSaving(false); }
  };

  const filtered = stock.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = stock.reduce((sum, i) => sum + i.price * i.stock_quantity, 0);
  const lowCount = stock.filter(i => i.stock_quantity > 0 && i.stock_quantity <= 50).length;
  const outCount = stock.filter(i => i.stock_quantity === 0).length;

  return (
    <PageWrapper>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Stock Management</h1>
          <p style={styles.sub}>View and update current inventory levels</p>
        </div>
        <button onClick={fetchStock} style={styles.refreshBtn}>🔄 Refresh</button>
      </div>

      {/* Summary cards */}
      <div style={styles.summaryCards}>
        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Total inventory value</p>
          <p style={{ ...styles.summaryValue, color: '#15803d' }}>KSh {totalValue.toLocaleString()}</p>
        </div>
        <div style={{ ...styles.summaryCard, ...(lowCount > 0 ? { background: '#fff7ed', borderColor: '#fed7aa' } : {}) }}>
          <p style={styles.summaryLabel}>Low stock items</p>
          <p style={{ ...styles.summaryValue, color: lowCount > 0 ? '#d97706' : '#1c0a00' }}>{lowCount}</p>
          {lowCount > 0 && <p style={styles.summaryNote}>Needs restocking soon</p>}
        </div>
        <div style={{ ...styles.summaryCard, ...(outCount > 0 ? { background: '#fff5f5', borderColor: '#fecaca' } : {}) }}>
          <p style={styles.summaryLabel}>Out of stock</p>
          <p style={{ ...styles.summaryValue, color: outCount > 0 ? '#dc2626' : '#1c0a00' }}>{outCount}</p>
          {outCount > 0 && <p style={{ ...styles.summaryNote, color: '#dc2626' }}>Urgent restocking needed</p>}
        </div>
      </div>

      {/* Search */}
      <div style={styles.searchWrap}>
        <span>🔍</span>
        <input type="text" placeholder="Search by product or category..." value={search} onChange={e => setSearch(e.target.value)} style={styles.searchInput} />
      </div>

      {loading && <div style={styles.center}><div style={styles.spinner} /></div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      {!loading && !error && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                {['Product', 'Category', 'Price', 'Stock level', 'Quantity', 'Action'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const level = getLevel(item.stock_quantity);
                const isEditing = editing === item.id;
                const isSaved = successId === item.id;
                return (
                  <tr key={item.id} style={{ ...styles.tr, ...(isSaved ? { background: '#f0fdf4' } : {}) }}>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={styles.productIcon}>{CATEGORY_EMOJI[item.category] || '📦'}</div>
                        <span style={{ fontWeight: 600, color: '#1c0a00' }}>{item.name}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.catBadge}>{item.category}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ color: '#44403c' }}>KSh {Number(item.price).toLocaleString()}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={styles.barTrack}>
                          <div style={{ ...styles.barFill, width: `${level.pct}%`, background: level.bar }} />
                        </div>
                        <span style={{ ...styles.levelBadge, color: level.color, background: level.bg }}>{level.label}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      {isEditing ? (
                        <input
                          type="number" min="0" value={newQty}
                          onChange={e => setNewQty(e.target.value)}
                          autoFocus
                          style={styles.qtyInput}
                        />
                      ) : (
                        <span style={{ fontWeight: 700, color: item.stock_quantity === 0 ? '#dc2626' : '#1c0a00' }}>
                          {isSaved ? '✓ ' : ''}{item.stock_quantity}
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleSave(item.id)} disabled={saving} style={styles.saveBtn}>
                            {saving ? '...' : 'Save'}
                          </button>
                          <button onClick={() => setEditing(null)} style={styles.cancelBtn}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditing(item.id); setNewQty(String(item.stock_quantity)); }} style={styles.editBtn}>
                          ✏️ Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input:focus { outline: none; border-color: #d97706 !important; }`}</style>
    </PageWrapper>
  );
}

const styles = {
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' },
  title: { fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 700, color: '#1c0a00' },
  sub: { fontSize: '14px', color: '#78716c', marginTop: '4px' },
  refreshBtn: { background: '#fff', border: '1.5px solid #e7e5e4', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#44403c', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  summaryCards: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' },
  summaryCard: { background: '#fff', border: '1px solid #ede8e0', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 8px rgba(180,80,0,0.05)' },
  summaryLabel: { fontSize: '13px', color: '#78716c', marginBottom: '6px' },
  summaryValue: { fontSize: '28px', fontWeight: 700, color: '#1c0a00', fontFamily: "'Playfair Display', serif" },
  summaryNote: { fontSize: '12px', color: '#d97706', marginTop: '4px' },
  searchWrap: { display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1.5px solid #e7e5e4', borderRadius: '12px', padding: '0 16px', marginBottom: '16px', maxWidth: '400px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  searchInput: { border: 'none', background: 'transparent', padding: '12px 0', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", color: '#1c0a00', width: '100%' },
  tableWrap: { background: '#fff', borderRadius: '16px', border: '1px solid #ede8e0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(180,80,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  thead: { background: '#faf8f5', borderBottom: '1px solid #ede8e0' },
  th: { padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr: { borderBottom: '1px solid #f5f0ea', transition: 'background 0.1s' },
  td: { padding: '14px 16px', verticalAlign: 'middle' },
  productIcon: { width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #fde8c8, #fdba74)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 },
  catBadge: { fontSize: '12px', color: '#78716c', background: '#f5f0ea', padding: '3px 10px', borderRadius: '100px', textTransform: 'capitalize' },
  barTrack: { width: '80px', height: '6px', background: '#f5f0ea', borderRadius: '100px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '100px', transition: 'width 0.3s' },
  levelBadge: { fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '100px', whiteSpace: 'nowrap' },
  qtyInput: { width: '80px', border: '1.5px solid #d97706', borderRadius: '8px', padding: '6px 10px', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", color: '#1c0a00' },
  saveBtn: { background: 'linear-gradient(135deg, #d97706, #ea580c)', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  cancelBtn: { background: '#fff', color: '#78716c', border: '1.5px solid #e7e5e4', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  editBtn: { background: '#fff', color: '#44403c', border: '1.5px solid #e7e5e4', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  center: { display: 'flex', justifyContent: 'center', padding: '80px 0' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3ede6', borderTopColor: '#d97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  errorBox: { background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' },
};
