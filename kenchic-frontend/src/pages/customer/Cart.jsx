import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { placeOrder } from '../../api/customer.api';
import { initiatePayment, checkPaymentStatus } from '../../api/payment.api';
import { useAuth } from '../../context/AuthContext';

export default function Cart() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [step, setStep] = useState('cart'); // cart | checkout | payment | polling | confirmation
  const [orderType, setOrderType] = useState('delivery');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [pollCount, setPollCount] = useState(0);

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

  // Step 1 — place order then move to payment
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
      setStep('payment');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — send STK push
  const handlePayment = async () => {
    if (!phone.trim()) {
      setError('Please enter your M-Pesa phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await initiatePayment({ order_id: orderId, phone_number: phone });
      setCheckoutRequestId(res.data.data.checkout_request_id);
      setStep('polling');
      pollPaymentStatus(res.data.data.checkout_request_id, 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — poll every 5s for up to 60s
  const pollPaymentStatus = (reqId, count) => {
    if (count >= 12) {
      setStep('payment');
      setError('Payment timed out. Please try again.');
      return;
    }
    setPollCount(count);
    setTimeout(async () => {
      try {
        const res = await checkPaymentStatus(reqId);
        const status = res.data.data.status;
        if (status === 'completed') {
          setStep('confirmation');
        } else if (status === 'failed') {
          setStep('payment');
          setError('Payment failed or was cancelled. Please try again.');
        } else {
          pollPaymentStatus(reqId, count + 1);
        }
      } catch {
        pollPaymentStatus(reqId, count + 1);
      }
    }, 5000);
  };

  // ── Navbar ────────────────────────────────────────────────────────────────
  const Navbar = () => (
    <nav className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/customer/products')}>
        <span className="text-2xl">🐔</span>
        <span className="font-bold text-green-700 text-lg">Kenchic</span>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/customer/products')} className="text-sm text-gray-600 hover:text-green-700">Products</button>
        <button onClick={() => navigate('/customer/orders')} className="text-sm text-gray-600 hover:text-green-700">My Orders</button>
        <div className="relative">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">🛒 Cart</button>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>
          )}
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} className="text-sm text-gray-500 hover:text-red-600">Logout</button>
      </div>
    </nav>
  );

  // ── Confirmation ──────────────────────────────────────────────────────────
  if (step === 'confirmation') {
    return (
      <div className="min-h-screen page-shell">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div className="bg-white rounded-2xl shadow p-10">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
            <p className="text-gray-500 mb-2">Your M-Pesa payment was received and your order is confirmed.</p>
            <p className="text-green-700 font-semibold mb-6">Order ID: #{orderId}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/customer/orders')} className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700">Track Order</button>
              <button onClick={() => navigate('/customer/products')} className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50">Continue Shopping</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Polling Screen ────────────────────────────────────────────────────────
  if (step === 'polling') {
    return (
      <div className="min-h-screen page-shell">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div className="bg-white rounded-2xl shadow p-10">
            <div className="text-6xl mb-6">📱</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Check your phone</h1>
            <p className="text-gray-500 mb-6">
              An M-Pesa prompt has been sent to <span className="font-semibold text-gray-700">{phone}</span>. Enter your PIN to complete the payment.
            </p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-green-500 border-t-transparent"></div>
              <span className="text-sm text-gray-500">Waiting for confirmation...</span>
            </div>
            <div className="flex justify-center gap-1 mb-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i < pollCount ? 'bg-green-500' : 'bg-gray-200'}`} />
              ))}
            </div>
            <p className="text-xs text-gray-400">Amount: <span className="font-semibold">KSh {total.toLocaleString()}</span> · Order #{orderId}</p>
            <button onClick={() => { setStep('payment'); setError(''); }} className="mt-6 text-sm text-gray-400 hover:text-gray-600 underline">
              Cancel and try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment Step ──────────────────────────────────────────────────────────
  if (step === 'payment') {
    return (
      <div className="min-h-screen page-shell">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Pay with M-Pesa</h1>
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-4">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">M</div>
              <div>
                <p className="font-semibold text-gray-800">M-Pesa STK Push</p>
                <p className="text-sm text-gray-500">You will receive a prompt on your phone</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg px-4 py-3 mb-6">
              <p className="text-sm text-gray-500">Amount to pay</p>
              <p className="text-2xl font-bold text-green-700">KSh {total.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">Order #{orderId}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa phone number</label>
              <div className="flex gap-2">
                <div className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 flex items-center">🇰🇪 +254</div>
                <input
                  type="tel"
                  placeholder="0712 345 678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Enter the Safaricom number registered for M-Pesa</p>
            </div>
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Sending prompt...</>
              ) : <>📱 Send M-Pesa Prompt</>}
            </button>
          </div>
          <p className="text-xs text-center text-gray-400">Secured by Safaricom M-Pesa. Your PIN is never shared with Kenchic.</p>
        </div>
      </div>
    );
  }

  // ── Checkout Step ─────────────────────────────────────────────────────────
  if (step === 'checkout') {
    return (
      <div className="min-h-screen page-shell">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-8">
          <button onClick={() => setStep('cart')} className="text-sm text-gray-500 hover:text-green-700 mb-4">← Back to cart</button>
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
                <textarea rows={3} placeholder="Enter your full delivery address..." value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
            )}
          </div>
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
          <button onClick={handleCheckout} disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Processing...' : `Continue to Payment — KSh ${total.toLocaleString()}`}
          </button>
        </div>
      </div>
    );
  }

  // ── Cart Step ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen page-shell">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Cart</h1>
        {cart.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-16 text-center">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <button onClick={() => navigate('/customer/products')} className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700">Browse Products</button>
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
                  <p className="font-semibold text-green-700 w-24 text-right">KSh {(item.price * item.quantity).toLocaleString()}</p>
                  <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 ml-2">✕</button>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between text-lg font-bold text-gray-800 mb-4">
                <span>Total</span>
                <span className="text-green-700">KSh {total.toLocaleString()}</span>
              </div>
              <button onClick={() => setStep('checkout')} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">
                Proceed to Checkout
              </button>
              <button onClick={() => navigate('/customer/products')} className="w-full mt-2 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50">
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
