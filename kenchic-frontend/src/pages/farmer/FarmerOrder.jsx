import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { placeChickOrder, getFarmerOrders } from '../../api/farmer.api';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

export default function FarmerOrder() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('farmer_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [step, setStep] = useState('order'); // order | confirmation
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
      const updated = prev
        .map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0);
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

  const STATUS_INFO = {
    pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-700' },
    confirmed:  { label: 'Confirmed',  color: 'bg-blue-100 text-blue-700' },
    processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700' },
    shipped:    { label: 'Shipped',    color: 'bg-orange-100 text-orange-700' },
    delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-700' },
    cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-700' },
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setError('Your order is empty. Please add chicks from the catalog.');
      return;
    }
    if (orderType === 'delivery' && !address.trim()) {
      setError('Please enter a delivery address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const items = cart.map(i => ({
        product_id: i.id,
        quantity: i.quantity,
        unit_price: i.price,
      }));
      const res = await placeChickOrder({ items, delivery_address: address, order_type: orderType });
      setOrderId(res.data.data.order_id);
      localStorage.removeItem('farmer_cart');
      setCart([]);
      setStep('confirmation');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Navbar ───────────────────────────────────────────────────────────────
  const Navbar = () => (
    <nav className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/farmer/chicks')}>
        <span className="text-2xl">🐔</span>
        <span className="font-bold text-green-700 text-lg">Kenchic Farmer</span>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/farmer/chicks')} className="text-sm text-gray-600 hover:text-green-700">
          Catalog
        </button>
        <button onClick={() => navigate('/farmer/resources')} className="text-sm text-gray-600 hover:text-green-700">
          📚 Resources
        </button>
        <button onClick={() => { logout(); navigate('/login'); }} className="text-sm text-gray-500 hover:text-red-600">
          Logout
        </button>
      </div>
    </nav>
  );

  // ── Confirmation ─────────────────────────────────────────────────────────
  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div className="bg-white rounded-2xl shadow p-10">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h1>
            <p className="text-gray-500 mb-1">Your chick order has been received.</p>
            <p className="text-gray-500 mb-4">Our team will confirm it shortly.</p>
            <p className="text-green-700 font-semibold mb-2">Order ID: #{orderId}</p>
            <p className="text-sm text-gray-400 mb-8">
              {orderType === 'pickup'
                ? '📍 You selected pickup — we will contact you when ready for collection.'
                : '🚚 Your chicks will be delivered to the address provided.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/farmer/chicks')}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
              >
                Back to Catalog
              </button>
              <button
                onClick={() => { setStep('order'); }}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                View My Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Order Page ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Place Order</h1>
        <p className="text-gray-500 mb-8">Review your chicks and choose how you'd like to receive them</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — cart + options */}
          <div className="lg:col-span-2 space-y-4">

            {/* Cart items */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-5 py-4 border-b">
                <h2 className="font-semibold text-gray-700">Your Order</h2>
              </div>

              {cart.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-gray-400 mb-4">No chicks added yet</p>
                  <button
                    onClick={() => navigate('/farmer/chicks')}
                    className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="divide-y">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                      <span className="text-3xl">{item.name.includes('Broiler') ? '🐥' : '🐣'}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-500">KSh {Number(item.price).toLocaleString()} / chick</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-100">−</button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-100">+</button>
                      </div>
                      <p className="font-semibold text-green-700 w-28 text-right">
                        KSh {(item.price * item.quantity).toLocaleString()}
                      </p>
                      <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delivery / Pickup toggle */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="font-semibold text-gray-700 mb-4">How would you like to receive your chicks?</h2>
              <div className="flex gap-4 mb-4">
                <label className={`flex-1 border-2 rounded-xl p-4 cursor-pointer transition-colors ${orderType === 'delivery' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="orderType" value="delivery" checked={orderType === 'delivery'} onChange={() => setOrderType('delivery')} className="sr-only" />
                  <div className="text-3xl mb-2">🚚</div>
                  <div className="font-semibold text-gray-800">Delivery</div>
                  <div className="text-sm text-gray-500 mt-1">Chicks delivered directly to your farm</div>
                </label>
                <label className={`flex-1 border-2 rounded-xl p-4 cursor-pointer transition-colors ${orderType === 'pickup' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="orderType" value="pickup" checked={orderType === 'pickup'} onChange={() => setOrderType('pickup')} className="sr-only" />
                  <div className="text-3xl mb-2">🏪</div>
                  <div className="font-semibold text-gray-800">Pickup</div>
                  <div className="text-sm text-gray-500 mt-1">Collect from nearest Kenchic outlet</div>
                </label>
              </div>

              {orderType === 'delivery' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm / Delivery address</label>
                  <textarea
                    rows={3}
                    placeholder="Enter your farm address or delivery location..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
                  />
                </div>
              )}

              {orderType === 'pickup' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-blue-700">📍 You can collect your chicks from any Kenchic outlet. We will call you when your order is ready.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right — summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-5 sticky top-24">
              <h2 className="font-semibold text-gray-700 mb-4">Order Summary</h2>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Total chicks</span>
                  <span className="font-medium">{totalChicks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery type</span>
                  <span className="font-medium capitalize">{orderType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Farmer</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Total</span>
                  <span className="text-green-700 text-lg">KSh {total.toLocaleString()}</span>
                </div>
              </div>

              {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

              <button
                onClick={handlePlaceOrder}
                disabled={loading || cart.length === 0}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Placing order...' : 'Place Order'}
              </button>

              <button
                onClick={() => navigate('/farmer/chicks')}
                className="w-full mt-2 border border-gray-300 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50"
              >
                ← Add more chicks
              </button>
            </div>
          </div>
        </div>

        {/* Past orders */}
        {!loadingOrders && pastOrders.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-gray-800 mb-4">My Past Orders</h2>
            <div className="bg-white rounded-xl shadow-sm border divide-y">
              {pastOrders.map(order => {
                const s = STATUS_INFO[order.status] || STATUS_INFO.pending;
                return (
                  <div key={order.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-medium text-gray-800">Order #{order.id}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        <span className="capitalize">{order.order_type}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${s.color}`}>{s.label}</span>
                      <span className="font-semibold text-green-700">KSh {Number(order.total_amount).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
