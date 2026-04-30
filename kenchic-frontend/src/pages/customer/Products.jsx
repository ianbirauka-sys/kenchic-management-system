import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../../api/customer.api';
import { useAuth } from '../../context/AuthContext';

export default function Products() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [added, setAdded] = useState(null);

  useEffect(() => {
    getProducts()
      .then(res => setProducts(res.data.data))
      .catch(() => setError('Failed to load products. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      const updated = existing
        ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...product, quantity: 1 }];
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
    setAdded(product.id);
    setTimeout(() => setAdded(null), 1500);
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐔</span>
          <span className="font-bold text-green-700 text-lg">Kenchic</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/customer/orders')}
            className="text-sm text-gray-600 hover:text-green-700"
          >
            My Orders
          </button>
          <button
            onClick={() => navigate('/customer/cart')}
            className="relative bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            🛒 Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name} 👋</h1>
          <p className="text-gray-500 mt-1">Browse our fresh products below</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Products grid */}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <p className="text-gray-500 text-center py-20">No products found for "{search}"</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filtered.map(product => (
                  <div key={product.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow flex flex-col">
                    {/* Image placeholder */}
                    <div className="bg-green-50 rounded-t-xl h-40 flex items-center justify-center text-5xl">
                      {product.category === 'chicks' ? '🐣' : product.category === 'feed' ? '🌾' : '🍗'}
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                        {product.category}
                      </span>
                      <h3 className="font-semibold text-gray-800 mt-1">{product.name}</h3>
                      <p className="text-gray-500 text-sm mt-1 flex-1 line-clamp-2">
                        {product.description || 'No description available'}
                      </p>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-green-700 font-bold text-lg">
                          KSh {Number(product.price).toLocaleString()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${product.stock_quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock_quantity === 0}
                        className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                          added === product.id
                            ? 'bg-green-100 text-green-700'
                            : product.stock_quantity === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {added === product.id ? '✓ Added!' : 'Add to cart'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
