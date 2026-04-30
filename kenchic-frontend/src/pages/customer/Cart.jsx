import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { placeOrder } from '../../api/customer.api';
import { useAuth } from '../../context/AuthContext';

export default function Cart() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [step, setStep] = useState('cart'); // cart | checkout | confirmation
  const [orderType, setOrderType] = useState('delivery');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(null);

  const updateQty = (id, delta) => {
    setCart(prev => {
      const updated = prev
        .map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0);
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

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleCheckout = async () => {
    if (orderType === 'delivery' && !address.trim()) {
      setError('Please enter a delivery address');
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
      const res = await placeOrder({ items, delivery_address: address, order_type: orderType });
      setOrderId(res.data.data.order_id);
      localStorage.removeItem('cart');
      setCart([]);
      setStep('confirmation');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Navbar ──────────────────────────────────────────────────────────────
  const Navbar = () => (
    <nav className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/customer/products')}>
        <span className="text-2xl">🐔</span>
        <span className="font-bold text-green-700 text-lg">Kenchic</span>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/customer/products')} className="text-sm text-gray-600 hover:text-green-700">
          Products
        </button>
        <button onClick={() => navigate('/customer/orders')} className="text-sm text-gray-600 hover:text-green-700">
          My Orders
        </button>
        <div className="relative">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            🛒 Cart
          </button>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} className="text-sm text-gray-500 hover:text-red-600">
          Logout
        </button>
      </div>
    </nav>
  );

  // ── Order Confirmation ───────────────────────────────────────────────────
  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div className="bg-white rounded-2xl shadow p-10">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h1>
            <p className="text-gray-500 mb-2">Your order has been received and is being processed.</p>
            <p className="text-green-700 font-semibold mb-6">Order ID: #{orderId}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/customer/orders')}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
              >
                Track Order
              </button>
              <button
                onClick={() => navigate('/customer/products')}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Checkout Step ────────────────────────────────────────────────────────
  if (step === 'checkout') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-8">
          <button onClick={() => setStep('cart')} className="text-sm text-gray-500 hover:text-green-700 mb-4 flex items-center gap-1">
            ← Back to cart
          </button>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

          <div className="bg-white rounded-xl shadow-sm border p-6 mb-4">
            <h2 className="font-semibold text-gray-700 mb-4">Delivery options</h2>
            <div className="flex gap-4 mb-4">
              <label className={`flex-1 border-2 rounded-lg p-4 cursor-pointer transition-colors ${orderType === 'delivery' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <input type="radio" name="orderType" value="delivery" checked={orderType === 'delivery'} onChange={() => setOrderType('delivery')} className="sr-only" />
                <div className="text-2xl mb-1">🚚</div>
                <div className="font-medium text-gray-800">Delivery</div>
                <div className="text-sm text-gray-500">Delivered to your address</div>
              </label>
              <label className={`flex-1 border-2 rounded-lg p-4 cursor-pointer transition-colors ${orderType === 'pickup' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <input type="radio" name="orderType" value="pickup" checked={orderType === 'pickup'} onChange={() => setOrderType('pickup')} className="sr-only" />
                <div className="text-2xl mb-1">🏪</div>
                <div className="font-medium text-gray-800">Pickup</div>
                <div className="text-sm text-gray-500">Collect from our outlet</div>
              </label>
            </div>

            {orderType === 'delivery' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery address</label>
                <textarea
                  rows={3}
                  placeholder="Enter your full delivery address..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-4">
            <h2 className="font-semibold text-gray-700 mb-4">Order summary</h2>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{item.name} × {item.quantity}</span>
                <span>KSh {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t mt-4 pt-4 flex justify-between font-bold text-gray-800">
              <span>Total</span>
              <span className="text-green-700">KSh {total.toLocaleString()}</span>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Placing order...' : `Place Order — KSh ${total.toLocaleString()}`}
          </button>
        </div>
      </div>
    );
  }

  // ── Cart Step ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Cart</h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-16 text-center">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <button
              onClick={() => navigate('/customer/products')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border divide-y mb-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <div className="bg-green-50 rounded-lg w-14 h-14 flex items-center justify-center text-2xl flex-shrink-0">
                    {item.category === 'chicks' ? '🐣' : item.category === 'feed' ? '🌾' : '🍗'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500">KSh {Number(item.price).toLocaleString()} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-100">−</button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-100">+</button>
                  </div>
                  <p className="font-semibold text-green-700 w-24 text-right">
                    KSh {(item.price * item.quantity).toLocaleString()}
                  </p>
                  <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 ml-2">✕</button>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between text-lg font-bold text-gray-800 mb-4">
                <span>Total</span>
                <span className="text-green-700">KSh {total.toLocaleString()}</span>
              </div>
              <button
                onClick={() => setStep('checkout')}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
              >
                Proceed to Checkout
              </button>
              <button
                onClick={() => navigate('/customer/products')}
                className="w-full mt-2 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
