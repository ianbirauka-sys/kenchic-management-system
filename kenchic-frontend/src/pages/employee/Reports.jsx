import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReports } from '../../api/employee.api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function Reports() {
  const navigate = useNavigate();
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
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const lowStockItems = data.stockLevels.filter(s => s.stock_quantity <= 50).length;

  const salesChartData = [...data.salesByDay].reverse().map(d => ({
    date: new Date(d.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
    Revenue: Number(d.revenue || 0),
    Orders: Number(d.total_orders || 0),
  }));

  const stockChartData = data.stockLevels.map(s => ({
    name: s.name.length > 20 ? s.name.substring(0, 18) + '…' : s.name,
    Stock: Number(s.stock_quantity),
    fill: s.stock_quantity === 0 ? '#ef4444' : s.stock_quantity <= 50 ? '#f59e0b' : '#22c55e',
  }));

  const CustomBarShape = (props) => {
    const { x, y, width, height, fill } = props;
    return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐔</span>
          <span className="font-bold text-green-700 text-lg">Kenchic Staff</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/employee/orders')} className="text-sm text-gray-600 hover:text-green-700">Orders</button>
          <button onClick={() => navigate('/employee/stock')} className="text-sm text-gray-600 hover:text-green-700">Stock</button>
          <button onClick={() => navigate('/employee/deliveries')} className="text-sm text-gray-600 hover:text-green-700">Deliveries</button>
          <button onClick={() => navigate('/employee/reports')} className="text-sm font-medium text-green-700">Reports</button>
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }} className="text-sm text-gray-500 hover:text-red-600">Logout</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Sales performance and stock overview</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl border p-5">
                <p className="text-sm text-gray-500">Total revenue</p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  KSh {totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
              </div>
              <div className="bg-white rounded-xl border p-5">
                <p className="text-sm text-gray-500">Total orders</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{totalOrders}</p>
                <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
              </div>
              <div className="bg-white rounded-xl border p-5">
                <p className="text-sm text-gray-500">Avg order value</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  KSh {Math.round(avgOrderValue).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">Per order</p>
              </div>
              <div className={`rounded-xl border p-5 ${lowStockItems > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
                <p className="text-sm text-gray-500">Low stock alerts</p>
                <p className={`text-2xl font-bold mt-1 ${lowStockItems > 0 ? 'text-yellow-700' : 'text-gray-800'}`}>
                  {lowStockItems}
                </p>
                <p className="text-xs text-gray-400 mt-1">Items need restocking</p>
              </div>
            </div>

            {/* Chart tabs */}
            <div className="flex gap-2 mb-4 border-b">
              <button
                onClick={() => setActiveChart('sales')}
                className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeChart === 'sales'
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📈 Sales over time
              </button>
              <button
                onClick={() => setActiveChart('stock')}
                className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeChart === 'stock'
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📦 Stock levels
              </button>
            </div>

            {/* Sales chart */}
            {activeChart === 'sales' && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="font-semibold text-gray-700 mb-1">Revenue over time</h2>
                <p className="text-sm text-gray-400 mb-6">Daily revenue for the last 30 days</p>
                {salesChartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <p className="text-4xl mb-2">📊</p>
                    <p>No sales data yet</p>
                    <p className="text-sm mt-1">Orders will appear here once placed</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip
                        formatter={(value, name) => [
                          name === 'Revenue' ? `KSh ${Number(value).toLocaleString()}` : value,
                          name
                        ]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Revenue"
                        stroke="#16a34a"
                        strokeWidth={2}
                        dot={{ fill: '#16a34a', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {/* Orders mini chart */}
                {salesChartData.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-600 mb-4 text-sm">Orders per day</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={salesChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                        />
                        <Bar dataKey="Orders" fill="#86efac" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Stock chart */}
            {activeChart === 'stock' && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="font-semibold text-gray-700 mb-1">Current stock levels</h2>
                <p className="text-sm text-gray-400 mb-2">Units available per product</p>
                <div className="flex gap-4 mb-6 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Good (50+)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span> Low (1–50)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Out of stock</span>
                </div>
                {stockChartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <p className="text-4xl mb-2">📦</p>
                    <p>No stock data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={stockChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={140} />
                      <Tooltip
                        formatter={(value) => [`${value} units`, 'Stock']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                      />
                      <Bar dataKey="Stock" shape={<CustomBarShape />} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {/* Stock table */}
                <div className="mt-6 border-t pt-4">
                  <h3 className="font-medium text-gray-600 mb-3 text-sm">Stock summary</h3>
                  <div className="space-y-2">
                    {data.stockLevels.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.stock_quantity === 0 ? 'bg-red-500' :
                                item.stock_quantity <= 50 ? 'bg-yellow-400' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min((item.stock_quantity / 500) * 100, 100)}%` }}
                            />
                          </div>
                          <span className={`font-semibold w-16 text-right ${
                            item.stock_quantity === 0 ? 'text-red-600' :
                            item.stock_quantity <= 50 ? 'text-yellow-600' : 'text-green-700'
                          }`}>
                            {item.stock_quantity} units
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
