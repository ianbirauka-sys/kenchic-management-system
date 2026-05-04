import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllOrders, updateOrderStatus } from '../../api/employee.api';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_STYLES = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped:    'bg-orange-100 text-orange-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
};

export default function Orders() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

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
    } catch {
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.status === filter;
    const matchesSearch = search === '' ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      String(o.id).includes(search);
    return matchesFilter && matchesSearch;
  });

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, {});

  const formatDate = (d) => new Date(d).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="min-h-screen page-shell">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐔</span>
          <span className="font-bold text-green-700 text-lg">Kenchic Staff</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/employee/orders')} className="text-sm font-medium text-green-700">Orders</button>
          <button onClick={() => navigate('/employee/stock')} className="text-sm text-gray-600 hover:text-green-700">Stock</button>
          <button onClick={() => navigate('/employee/deliveries')} className="text-sm text-gray-600 hover:text-green-700">Deliveries</button>
          <button onClick={() => navigate('/employee/reports')} className="text-sm text-gray-600 hover:text-green-700">Reports</button>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-sm text-gray-500 hover:text-red-600">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">All Orders</h1>
            <p className="text-gray-500 mt-1">{orders.length} total orders</p>
          </div>
          <button onClick={fetchOrders} className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600">
            🔄 Refresh
          </button>
        </div>

        {/* Status summary cards */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? 'all' : s)}
              className={`rounded-xl p-3 text-center border transition-all ${
                filter === s ? 'ring-2 ring-green-500 border-green-300' : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className={`text-lg font-bold ${STATUS_STYLES[s].split(' ')[1]}`}>{counts[s] || 0}</p>
              <p className="text-xs text-gray-500 capitalize mt-0.5">{s}</p>
            </button>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by customer name, email or order ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
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

        {/* Orders table */}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl border p-16 text-center text-gray-400">
                No orders found
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium text-gray-600">Order</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-600">Customer</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-600">Type</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-600">Total</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-600">Update</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map(order => (
                      <>
                        <tr
                          key={order.id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                        >
                          <td className="px-5 py-4 font-medium text-gray-800">#{order.id}</td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-800">{order.customer_name}</p>
                            <p className="text-xs text-gray-400">{order.customer_email}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="capitalize text-gray-600">{order.order_type}</span>
                          </td>
                          <td className="px-5 py-4 font-semibold text-green-700">
                            KSh {Number(order.total_amount).toLocaleString()}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_STYLES[order.status]}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                            <select
                              value={order.status}
                              onChange={e => handleStatusChange(order.id, e.target.value)}
                              disabled={updating === order.id}
                              className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                            >
                              {STATUSES.map(s => (
                                <option key={s} value={s} className="capitalize">{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(order.created_at)}</td>
                        </tr>
                        {expanded === order.id && (
                          <tr key={`${order.id}-detail`} className="bg-blue-50">
                            <td colSpan={7} className="px-5 py-4">
                              <div className="text-sm text-gray-700">
                                <p><span className="font-medium">Delivery address:</span> {order.delivery_address || 'Pickup — no address provided'}</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
