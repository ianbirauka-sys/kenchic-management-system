import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReports } from '../../api/employee.api';
import PageWrapper from '../../components/PageWrapper';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Reports() {
  const [data, setData] = useState({ salesByDay: [], stockLevels: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChart, setActiveChart] = useState('sales');

  useEffect(() => {
    getReports()
      .then(res => setData(res.data.data))
      .catch(() => setError('Failed to load reports.'))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = data.salesByDay.reduce((sum, d) => sum + Number(d.revenue || 0), 0);
  const totalOrders = data.salesByDay.reduce((sum, d) => sum + Number(d.total_orders || 0), 0);
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const lowStock = data.stockLevels.filter(s => s.stock_quantity <= 50).length;

  const salesData = [...data.salesByDay].reverse().map(d => ({
    date: new Date(d.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
    Revenue: Number(d.revenue || 0),
    Orders: Number(d.total_orders || 0),
  }));

  const stockData = data.stockLevels.map(s => ({
    name: s.name.length > 18 ? s.name.substring(0, 16) + '…' : s.name,
    Stock: Number(s.stock_quantity),
    fill: s.stock_quantity === 0 ? '#ef4444' : s.stock_quantity <= 50 ? '#f59e0b' : '#22c55e',
  }));

  const CustomBar = (props) => {
    const { x, y, width, height, fill } = props;
    return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />;
  };

  const tooltipStyle = { borderRadius: '10px', border: '1px solid #ede8e0', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" };

  return (
    <PageWrapper>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Reports & Analytics</h1>
          <p style={styles.sub}>Sales performance and inventory overview</p>
        </div>
      </div>

      {loading && <div style={styles.center}><div style={styles.spinner} /></div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      {!loading && !error && (
        <>
          {/* Summary cards */}
          <div style={styles.summaryCards}>
            {[
              { label: 'Total revenue', value: `KSh ${totalRevenue.toLocaleString()}`, note: 'Last 30 days', color: '#15803d' },
              { label: 'Total orders', value: totalOrders, note: 'Last 30 days', color: '#1c0a00' },
              { label: 'Avg order value', value: `KSh ${Math.round(avgOrder).toLocaleString()}`, note: 'Per order', color: '#1c0a00' },
              { label: 'Low stock alerts', value: lowStock, note: 'Items need restocking', color: lowStock > 0 ? '#d97706' : '#1c0a00', highlight: lowStock > 0 },
            ].map((card, i) => (
              <div key={i} style={{ ...styles.summaryCard, ...(card.highlight ? { background: '#fff7ed', borderColor: '#fed7aa' } : {}) }}>
                <p style={styles.summaryLabel}>{card.label}</p>
                <p style={{ ...styles.summaryValue, color: card.color }}>{card.value}</p>
                <p style={styles.summaryNote}>{card.note}</p>
              </div>
            ))}
          </div>

          {/* Chart tabs */}
          <div style={styles.tabs}>
            {[{ key: 'sales', label: '📈 Sales over time' }, { key: 'stock', label: '📦 Stock levels' }].map(t => (
              <button key={t.key} onClick={() => setActiveChart(t.key)}
                style={{ ...styles.tab, ...(activeChart === t.key ? styles.tabActive : {}) }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Sales chart */}
          {activeChart === 'sales' && (
            <div style={styles.chartCard}>
              <h2 style={styles.chartTitle}>Revenue over time</h2>
              <p style={styles.chartSub}>Daily revenue for the last 30 days</p>
              {salesData.length === 0 ? (
                <div style={styles.emptyChart}>
                  <p style={{ fontSize: '40px' }}>📊</p>
                  <p style={{ color: '#a8a29e', marginTop: '12px' }}>No sales data yet — orders will appear here</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={salesData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f0ea" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a8a29e' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} />
                      <Tooltip formatter={(v, n) => [n === 'Revenue' ? `KSh ${Number(v).toLocaleString()}` : v, n]} contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="Revenue" stroke="#d97706" strokeWidth={2.5} dot={{ fill: '#d97706', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={styles.divider} />
                  <h3 style={styles.chartSubtitle}>Orders per day</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={salesData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f0ea" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a8a29e' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="Orders" fill="#fed7aa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
          )}

          {/* Stock chart */}
          {activeChart === 'stock' && (
            <div style={styles.chartCard}>
              <h2 style={styles.chartTitle}>Current stock levels</h2>
              <p style={styles.chartSub}>Units available per product</p>
              <div style={styles.legend}>
                {[['#22c55e', 'Good (50+)'], ['#f59e0b', 'Low (1–50)'], ['#ef4444', 'Out of stock']].map(([color, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#78716c' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                    {label}
                  </div>
                ))}
              </div>
              {stockData.length === 0 ? (
                <div style={styles.emptyChart}><p style={{ color: '#a8a29e' }}>No stock data available</p></div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={stockData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f0ea" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#a8a29e' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#44403c' }} width={140} />
                      <Tooltip formatter={(v) => [`${v} units`, 'Stock']} contentStyle={tooltipStyle} />
                      <Bar dataKey="Stock" shape={<CustomBar />} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={styles.divider} />
                  <h3 style={styles.chartSubtitle}>Stock summary</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                    {data.stockLevels.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: '#44403c' }}>{item.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '120px', height: '6px', background: '#f5f0ea', borderRadius: '100px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: '100px', background: item.stock_quantity === 0 ? '#ef4444' : item.stock_quantity <= 50 ? '#f59e0b' : '#22c55e', width: `${Math.min((item.stock_quantity / 500) * 100, 100)}%` }} />
                          </div>
                          <span style={{ fontWeight: 700, minWidth: '70px', textAlign: 'right', color: item.stock_quantity === 0 ? '#dc2626' : item.stock_quantity <= 50 ? '#d97706' : '#15803d' }}>
                            {item.stock_quantity} units
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageWrapper>
  );
}

const styles = {
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' },
  title: { fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 700, color: '#1c0a00' },
  sub: { fontSize: '14px', color: '#78716c', marginTop: '4px' },
  summaryCards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  summaryCard: { background: '#fff', border: '1px solid #ede8e0', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 8px rgba(180,80,0,0.05)' },
  summaryLabel: { fontSize: '13px', color: '#78716c', marginBottom: '6px' },
  summaryValue: { fontSize: '26px', fontWeight: 700, fontFamily: "'Playfair Display', serif" },
  summaryNote: { fontSize: '12px', color: '#a8a29e', marginTop: '4px' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid #ede8e0' },
  tab: { padding: '10px 20px', fontSize: '14px', fontWeight: 500, color: '#78716c', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  tabActive: { color: '#d97706', borderBottomColor: '#d97706', fontWeight: 600 },
  chartCard: { background: '#fff', borderRadius: '16px', border: '1px solid #ede8e0', padding: '28px', boxShadow: '0 2px 8px rgba(180,80,0,0.05)' },
  chartTitle: { fontSize: '18px', fontWeight: 600, color: '#1c0a00', marginBottom: '4px', fontFamily: "'DM Sans', sans-serif" },
  chartSub: { fontSize: '13px', color: '#a8a29e', marginBottom: '24px' },
  chartSubtitle: { fontSize: '14px', fontWeight: 600, color: '#44403c', margin: '20px 0 12px', fontFamily: "'DM Sans', sans-serif" },
  divider: { height: '1px', background: '#f5f0ea', margin: '24px 0' },
  legend: { display: 'flex', gap: '20px', marginBottom: '20px' },
  emptyChart: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' },
  center: { display: 'flex', justifyContent: 'center', padding: '80px 0' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3ede6', borderTopColor: '#d97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  errorBox: { background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' },
};
