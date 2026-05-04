import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyOrders } from '../../api/customer.api';
import { useAuth } from '../../context/AuthContext';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_INFO = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-700', icon: '🕐' },
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-100 text-blue-700',     icon: '✅' },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700', icon: '⚙️' },
  shipped:    { label: 'Shipped',    color: 'bg-orange-100 text-orange-700', icon: '🚚' },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-700',   icon: '🎉' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-700',       icon: '❌' },
};

export default function OrderTracking() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getMyOrders()
      .then(res => setOrders(res.data.data))
      .catch(() => setError('Failed to load orders. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id) => setExpanded(prev => prev === id ? null : id);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen page-shell">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/customer/products')}>
          <span className="text-2xl">🐔</span>
          <span className="font-bold text-green-700 text-lg">Kenchic</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/customer/products')} className="text-sm text-gray-600 hover:text-green-700">
            Products
          </button>
          <button onClick={() => navigate('/customer/cart')} className="text-sm text-gray-600 hover:text-green-700">
            🛒 Cart
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-sm text-gray-500 hover:text-red-600">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">My Orders</h1>
        <p className="text-gray-500 mb-6">Track the status of your orders below</p>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && orders.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-16 text-center">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500 mb-4">You haven't placed any orders yet</p>
            <button
              onClick={() => navigate('/customer/products')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
            >
              Start Shopping
            </button>
          </div>
        )}

        {/* Orders list */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map(order => {
              const status = STATUS_INFO[order.status] || STATUS_INFO.pending;
              const stepIndex = STATUS_STEPS.indexOf(order.status);
              const isCancelled = order.status === 'cancelled';
              const isExpanded = expanded === order.id;

              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  {/* Order header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">Order #{order.id}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                        <span className="text-green-700 font-bold">
                          KSh {Number(order.total_amount).toLocaleString()}
                        </span>
                        <span className="text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {!isCancelled && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          {STATUS_STEPS.map((s, i) => (
                            <div key={s} className="flex flex-col items-center flex-1">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                                ${i <= stepIndex ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                {i < stepIndex ? '✓' : i === stepIndex ? '●' : '○'}
                              </div>
                              {i < STATUS_STEPS.length - 1 && (
                                <div className={`h-0.5 w-full mt-2.5 absolute`} />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="relative flex items-center mt-1">
                          <div className="absolute w-full h-1 bg-gray-200 rounded-full" />
                          <div
                            className="absolute h-1 bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-2">
                          {STATUS_STEPS.map((s, i) => (
                            <span key={s} className={`text-xs capitalize ${i <= stepIndex ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t px-5 py-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-500">Order type</p>
                          <p className="font-medium text-gray-800 capitalize">{order.order_type}</p>
                        </div>
                        {order.delivery_address && (
                          <div>
                            <p className="text-gray-500">Delivery address</p>
                            <p className="font-medium text-gray-800">{order.delivery_address}</p>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 italic">
                        {isCancelled
                          ? 'This order was cancelled.'
                          : order.status === 'delivered'
                          ? 'Your order has been delivered. Enjoy!'
                          : 'Your order is being processed. We will update you as it progresses.'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
