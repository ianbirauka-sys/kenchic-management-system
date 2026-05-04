import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResources } from '../../api/farmer.api';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_INFO = {
  broiler: { emoji: '🐥', color: 'bg-yellow-50 border-yellow-200' },
  layer: { emoji: '🐣', color: 'bg-blue-50 border-blue-200' },
  disease: { emoji: '🩺', color: 'bg-red-50 border-red-200' },
  default: { emoji: '📄', color: 'bg-gray-50 border-gray-200' },
};

const TIPS = [
  { icon: '🌡️', title: 'Temperature control', body: 'Keep brooder temperature at 32–35°C for day-old chicks. Reduce by 2–3°C each week until feathering is complete.' },
  { icon: '💧', title: 'Water & feeding', body: 'Provide clean water at all times. Use starter feed for the first 4 weeks, then switch to grower feed.' },
  { icon: '🏠', title: 'Housing & space', body: 'Allow at least 0.1 m² per chick in the brooder. Ensure good ventilation but avoid cold drafts.' },
  { icon: '💉', title: 'Vaccination', body: 'Vaccinate against Newcastle Disease on day 7 and Gumboro on day 14. Keep records of all vaccinations.' },
  { icon: '🧹', title: 'Biosecurity', body: 'Disinfect the house before each batch. Limit visitor access and always change footwear before entering.' },
  { icon: '📊', title: 'Record keeping', body: 'Track daily feed consumption, mortality, and weight gain. Good records help you spot problems early.' },
];

export default function Resources() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('guides');

  useEffect(() => {
    getResources()
      .then(res => setResources(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getCategory = (title) => {
    const t = title.toLowerCase();
    if (t.includes('broiler')) return 'broiler';
    if (t.includes('layer')) return 'layer';
    if (t.includes('disease')) return 'disease';
    return 'default';
  };

  return (
    <div className="min-h-screen page-shell">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/farmer/chicks')}>
          <span className="text-2xl">🐔</span>
          <span className="font-bold text-green-700 text-lg">Kenchic Farmer</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/farmer/chicks')} className="text-sm text-gray-600 hover:text-green-700">Catalog</button>
          <button onClick={() => navigate('/farmer/order')} className="text-sm text-gray-600 hover:text-green-700">🛒 Order</button>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-sm text-gray-500 hover:text-red-600">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Farmer Resources</h1>
          <p className="text-gray-500 mt-1">Guides, tips, and notices to help you run a successful poultry farm</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {['guides', 'tips', 'notices'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'guides' ? '📚 Guides' : tab === 'tips' ? '💡 Quick Tips' : '📢 Notices'}
            </button>
          ))}
        </div>

        {/* Guides tab */}
        {activeTab === 'guides' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map(resource => {
                  const cat = getCategory(resource.title);
                  const info = CATEGORY_INFO[cat];
                  return (
                    <div key={resource.id} className={`border rounded-xl p-5 ${info.color} hover:shadow-sm transition-shadow`}>
                      <div className="flex items-start gap-4">
                        <span className="text-4xl">{info.emoji}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{resource.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                          <a
                            href={resource.file_url}
                            className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-green-700 hover:text-green-800"
                            onClick={e => e.preventDefault()}
                          >
                            📥 Download PDF
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Tips tab */}
        {activeTab === 'tips' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TIPS.map((tip, i) => (
              <div key={i} className="bg-white border rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{tip.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">{tip.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{tip.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notices tab */}
        {activeTab === 'notices' && (
          <div className="space-y-4">
            {[
              {
                type: 'info',
                icon: '📢',
                title: 'New chick batch arriving',
                date: 'May 2026',
                body: 'A fresh batch of broiler and layer day-old chicks will be available from the 10th of May. Place your pre-orders early to secure your allocation.',
              },
              {
                type: 'warning',
                icon: '⚠️',
                title: 'Newcastle Disease alert',
                date: 'April 2026',
                body: 'There have been reported cases of Newcastle Disease in parts of the Rift Valley. Ensure your flocks are vaccinated and maintain strict biosecurity measures.',
              },
              {
                type: 'success',
                icon: '✅',
                title: 'Delivery routes updated',
                date: 'April 2026',
                body: 'We have expanded our delivery network to cover Nakuru, Eldoret, and Kisumu counties. Farmers in these regions can now select delivery when placing chick orders.',
              },
            ].map((notice, i) => {
              const styles = {
                info: 'bg-blue-50 border-blue-200 text-blue-800',
                warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
                success: 'bg-green-50 border-green-200 text-green-800',
              };
              return (
                <div key={i} className={`border rounded-xl p-5 ${styles[notice.type]}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{notice.icon}</span>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{notice.title}</h3>
                        <span className="text-xs opacity-60">{notice.date}</span>
                      </div>
                      <p className="text-sm mt-1 opacity-80">{notice.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Contact section */}
        <div className="mt-10 bg-green-700 rounded-2xl p-6 text-white">
          <h2 className="font-bold text-lg mb-1">Need help with your flock?</h2>
          <p className="text-green-200 text-sm mb-4">Our agricultural extension officers are available to assist you.</p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-green-800 rounded-lg px-4 py-3">
              <p className="text-xs text-green-300">Helpline</p>
              <p className="font-semibold">0800 720 000</p>
            </div>
            <div className="bg-green-800 rounded-lg px-4 py-3">
              <p className="text-xs text-green-300">Email</p>
              <p className="font-semibold">farmers@kenchic.com</p>
            </div>
            <div className="bg-green-800 rounded-lg px-4 py-3">
              <p className="text-xs text-green-300">Hours</p>
              <p className="font-semibold">Mon – Sat, 8am – 5pm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
