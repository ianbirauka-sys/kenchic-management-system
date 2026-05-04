import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeliveries, createDelivery, getAllOrders } from '../../api/employee.api';

const STATUS_STYLES = {
  scheduled:  'bg-blue-100 text-blue-700',
  in_transit: 'bg-orange-100 text-orange-700',
  delivered:  'bg-green-100 text-green-700',
  failed:     'bg-red-100 text-red-700',
};

export default function Deliveries() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ order_id: '', scheduled_date: '', driver_name: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dRes, oRes] = await Promise.all([getDeliveries(), getAllOrders()]);
      setDeliveries(dRes.data.data);
      // Only show orders that need delivery and aren't already scheduled
      const deliveryOrders = oRes.data.data.filter(o => o.order_type === 'delivery' && o.status !== 'cancelled');
      setOrders(deliveryOrders);
    } catch {
      setError('Failed to load deliveries.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.order_id || !form.scheduled_date || !form.driver_name.trim()) {
      setFormError('All fields are required.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      await createDelivery({
        order_id: Number(form.order_id),
        scheduled_date: form.scheduled_date,
        driver_name: form.driver_name,
      });
      setForm({ order_id: '', scheduled_date: '', driver_name: '' });
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to schedule delivery.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = deliveries.filter(d => filter === 'all' || d.status === filter);

  const counts = {
    all: deliveries.length,
    scheduled: deliveries.filter(d => d.status === 'scheduled').length,
    in_transit: deliveries.filter(d => d.status === 'in_transit').length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
    failed: deliveries.filter(d => d.status === 'failed').length,
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-KE', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen page-shell">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐔</span>
          <span className="font-bold text-green-700 text-lg">Kenchic Staff</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/employee/orders')} className="text-sm text-gray-600 hover:text-green-700">Orders</button>
          <button onClick={() => navigate('/employee/stock')} className="text-sm text-gray-600 hover:text-green-700">Stock</button>
          <button onClick={() => navigate('/employee/deliveries')} className="text-sm font-medium text-green-700">Deliveries</button>
          <button onClick={() => navigate('/employee/reports')} className="text-sm text-gray-600 hover:text-green-700">Reports</button>
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }} className="text-sm text-gray-500 hover:text-red-600">Logout</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Delivery Planning</h1>
            <p className="text-gray-500 mt-1">Schedule and track all outgoing deliveries</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600">
              🔄 Refresh
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
            >
              + Schedule Delivery
            </button>
          </div>
        </div>

        {/* Schedule delivery form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="font-semibold text-gray-700 mb-4">Schedule New Delivery</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <select
                  value={form.order_id}
                  onChange={e => setForm({ ...form, order_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select an order...</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      #{o.id} — {o.customer_name} (KSh {Number(o.total_amount).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled date</label>
                <input
                  type="date"
                  min={today}
                  value={form.scheduled_date}
                  onChange={e => setForm({ ...form, scheduled_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver name</label>
                <input
                  type="text"
                  placeholder="Enter driver name..."
                  value={form.driver_name}
                  onChange={e => setForm({ ...form, driver_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            {formError && <p className="text-red-600 text-sm mt-3">{formError}</p>}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Scheduling...' : 'Schedule Delivery'}
              </button>
              <button
                onClick={() => { setShowForm(false); setFormError(''); }}
                className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {Object.entries(counts).map(([key, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                filter === key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {key.replace('_', ' ')} ({count})
            </button>
          ))}
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

        {/* Deliveries list */}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl border p-16 text-center">
                <div className="text-5xl mb-4">🚚</div>
                <p className="text-gray-400 mb-4">No deliveries found</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Schedule first delivery
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(delivery => {
                  const isOverdue = delivery.status === 'scheduled' &&
                    new Date(delivery.scheduled_date) < new Date();
                  return (
                    <div
                      key={delivery.id}
                      className={`bg-white rounded-xl border p-5 flex items-center gap-4 hover:shadow-sm transition-shadow ${
                        isOverdue ? 'border-red-200 bg-red-50' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                        delivery.status === 'delivered' ? 'bg-green-100' :
                        delivery.status === 'in_transit' ? 'bg-orange-100' :
                        delivery.status === 'failed' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {delivery.status === 'delivered' ? '✅' :
                         delivery.status === 'in_transit' ? '🚚' :
                         delivery.status === 'failed' ? '❌' : '📦'}
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800">Order #{delivery.order_id}</p>
                          {isOverdue && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Overdue</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {delivery.customer_name} · {delivery.delivery_address || 'No address'}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Driver: <span className="font-medium text-gray-700">{delivery.driver_name || '—'}</span>
                          {' · '}
                          Scheduled: <span className="font-medium text-gray-700">{formatDate(delivery.scheduled_date)}</span>
                        </p>
                      </div>

                      {/* Status badge */}
                      <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize flex-shrink-0 ${STATUS_STYLES[delivery.status] || STATUS_STYLES.scheduled}`}>
                        {(delivery.status || 'scheduled').replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
