import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStock, updateStock } from '../../api/employee.api';

export default function StockManagement() {
  const navigate = useNavigate();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [newQty, setNewQty] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [successId, setSuccessId] = useState(null);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = () => {
    setLoading(true);
    getStock()
      .then(res => setStock(res.data.data))
      .catch(() => setError('Failed to load stock data.'))
      .finally(() => setLoading(false));
  };

  const handleEdit = (item) => {
    setEditing(item.id);
    setNewQty(String(item.stock_quantity));
  };

  const handleSave = async (id) => {
    if (newQty === '' || isNaN(newQty) || Number(newQty) < 0) {
      alert('Please enter a valid quantity.');
      return;
    }
    setSaving(true);
    try {
      await updateStock(id, Number(newQty));
      setStock(prev => prev.map(i => i.id === id ? { ...i, stock_quantity: Number(newQty) } : i));
      setEditing(null);
      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 2000);
    } catch {
      alert('Failed to update stock. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStockLevel = (qty) => {
    if (qty === 0) return { label: 'Out of stock', color: 'bg-red-100 text-red-700', bar: 'bg-red-500', pct: 0 };
    if (qty <= 20) return { label: 'Critical', color: 'bg-red-100 text-red-700', bar: 'bg-red-400', pct: 15 };
    if (qty <= 50) return { label: 'Low', color: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-400', pct: 35 };
    if (qty <= 150) return { label: 'Medium', color: 'bg-blue-100 text-blue-700', bar: 'bg-blue-400', pct: 65 };
    return { label: 'Good', color: 'bg-green-100 text-green-700', bar: 'bg-green-500', pct: 100 };
  };

  const CATEGORY_EMOJI = { chicks: '🐣', poultry: '🍗', feed: '🌾', equipment: '🔧' };

  const filtered = stock.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = stock.filter(i => i.stock_quantity <= 50).length;
  const outOfStockCount = stock.filter(i => i.stock_quantity === 0).length;
  const totalValue = stock.reduce((sum, i) => sum + i.price * i.stock_quantity, 0);

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
          <button onClick={() => navigate('/employee/stock')} className="text-sm font-medium text-green-700">Stock</button>
          <button onClick={() => navigate('/employee/deliveries')} className="text-sm text-gray-600 hover:text-green-700">Deliveries</button>
          <button onClick={() => navigate('/employee/reports')} className="text-sm text-gray-600 hover:text-green-700">Reports</button>
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }} className="text-sm text-gray-500 hover:text-red-600">Logout</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Stock Management</h1>
            <p className="text-gray-500 mt-1">View and update current inventory levels</p>
          </div>
          <button onClick={fetchStock} className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600">
            🔄 Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500">Total inventory value</p>
            <p className="text-2xl font-bold text-green-700 mt-1">KSh {totalValue.toLocaleString()}</p>
          </div>
          <div className={`rounded-xl border p-5 ${lowStockCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
            <p className="text-sm text-gray-500">Low stock items</p>
            <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-yellow-700' : 'text-gray-800'}`}>
              {lowStockCount}
            </p>
            {lowStockCount > 0 && <p className="text-xs text-yellow-600 mt-1">Needs restocking soon</p>}
          </div>
          <div className={`rounded-xl border p-5 ${outOfStockCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
            <p className="text-sm text-gray-500">Out of stock</p>
            <p className={`text-2xl font-bold mt-1 ${outOfStockCount > 0 ? 'text-red-700' : 'text-gray-800'}`}>
              {outOfStockCount}
            </p>
            {outOfStockCount > 0 && <p className="text-xs text-red-600 mt-1">Urgent restocking needed</p>}
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by product name or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
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

        {/* Stock table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Product</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Price</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Stock level</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Quantity</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(item => {
                  const level = getStockLevel(item.stock_quantity);
                  const isEditing = editing === item.id;
                  const isSaved = successId === item.id;
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isSaved ? 'bg-green-50' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{CATEGORY_EMOJI[item.category] || '📦'}</span>
                          <span className="font-medium text-gray-800">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 capitalize text-gray-600">{item.category}</td>
                      <td className="px-5 py-4 text-gray-700">KSh {Number(item.price).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${level.bar}`} style={{ width: `${level.pct}%` }} />
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${level.color}`}>
                            {level.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={newQty}
                            onChange={e => setNewQty(e.target.value)}
                            className="w-24 border border-green-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            autoFocus
                          />
                        ) : (
                          <span className={`font-semibold ${item.stock_quantity === 0 ? 'text-red-600' : 'text-gray-800'}`}>
                            {isSaved ? '✓ ' : ''}{item.stock_quantity}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSave(item.id)}
                              disabled={saving}
                              className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              {saving ? '...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="text-xs border border-gray-300 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-xs border border-gray-300 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-50 hover:border-green-400 hover:text-green-700"
                          >
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
      </div>
    </div>
  );
}
