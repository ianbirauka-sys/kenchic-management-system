import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChicks } from '../../api/farmer.api';
import { useAuth } from '../../context/AuthContext';

export default function ChickCatalog() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [chicks, setChicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('farmer_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [added, setAdded] = useState(null);

  useEffect(() => {
    getChicks()
      .then(res => setChicks(res.data.data))
      .catch(() => setError('Failed to load chick catalog. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (chick) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === chick.id);
      const updated = existing
        ? prev.map(i => i.id === chick.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...chick, quantity: 1 }];
      localStorage.setItem('farmer_cart', JSON.stringify(updated));
      return updated;
    });
    setAdded(chick.id);
    setTimeout(() => setAdded(null), 1500);
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const CHICK_INFO = {
    'Broiler Day-Old Chick': {
      emoji: '🐥',
      maturity: '6-8 weeks',
      purpose: 'Meat production',
      tip: 'Best for commercial broiler farming',
    },
    'Layer Day-Old Chick': {
      emoji: '🐣',
      maturity: '18-20 weeks',
      purpose: 'Egg production',
      tip: 'Starts laying at ~20 weeks',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐔</span>
          <span className="font-bold text-green-700 text-lg">Kenchic Farmer</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/farmer/order')} className="relative bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            🛒 Order
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/farmer/resources')} className="text-sm text-gray-600 hover:text-green-700">
            📚 Resources
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-sm text-gray-500 hover:text-red-600">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name} 👋</h1>
          <p className="text-gray-500 mt-1">Browse our quality chick varieties below and place your order</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Chick cards */}
        {!loading && !error && (
          <>
            {chicks.length === 0 ? (
              <div className="text-center py-20 text-gray-500">No chicks available at the moment.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {chicks.map(chick => {
                  const info = CHICK_INFO[chick.name] || { emoji: '🐤', maturity: 'Varies', purpose: 'Poultry farming', tip: '' };
                  return (
                    <div key={chick.id} className="bg-white rounded-2xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden">
                      {/* Card header */}
                      <div className="bg-gradient-to-r from-green-50 to-yellow-50 px-6 py-8 flex items-center gap-4">
                        <span className="text-6xl">{info.emoji}</span>
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">{chick.name}</h2>
                          <p className="text-green-600 font-semibold text-lg mt-1">
                            KSh {Number(chick.price).toLocaleString()} / chick
                          </p>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="px-6 py-4">
                        <p className="text-gray-500 text-sm mb-4">
                          {chick.description || 'High quality day-old chick from Kenchic certified hatchery.'}
                        </p>

                        {/* Info grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Purpose</p>
                            <p className="text-sm font-medium text-gray-800 mt-0.5">{info.purpose}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Maturity</p>
                            <p className="text-sm font-medium text-gray-800 mt-0.5">{info.maturity}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                            <p className="text-xs text-gray-500">Availability</p>
                            <p className={`text-sm font-medium mt-0.5 ${chick.stock_quantity > 0 ? 'text-green-700' : 'text-red-600'}`}>
                              {chick.stock_quantity > 0 ? `${chick.stock_quantity} chicks available` : 'Currently out of stock'}
                            </p>
                          </div>
                        </div>

                        {info.tip && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4">
                            <p className="text-xs text-yellow-700">💡 {info.tip}</p>
                          </div>
                        )}

                        <button
                          onClick={() => addToCart(chick)}
                          disabled={chick.stock_quantity === 0}
                          className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                            added === chick.id
                              ? 'bg-green-100 text-green-700'
                              : chick.stock_quantity === 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {added === chick.id ? '✓ Added to order!' : 'Add to Order'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom CTA if cart has items */}
            {cartCount > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-8 py-3 rounded-full shadow-lg font-semibold flex items-center gap-3 cursor-pointer hover:bg-green-700 transition-colors"
                onClick={() => navigate('/farmer/order')}>
                <span>🛒 {cartCount} chick{cartCount > 1 ? 's' : ''} in order</span>
                <span>→ Review Order</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
