import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResources } from '../../api/farmer.api';
import PageWrapper from '../../components/PageWrapper';

const TIPS = [
  { icon: '🌡️', title: 'Temperature control', body: 'Keep brooder at 32–35°C for day-old chicks. Reduce by 2–3°C each week until feathering is complete.' },
  { icon: '💧', title: 'Water & feeding', body: 'Provide clean water at all times. Use starter feed for first 4 weeks, then switch to grower feed.' },
  { icon: '🏠', title: 'Housing & space', body: 'Allow at least 0.1 m² per chick. Ensure good ventilation but avoid cold drafts.' },
  { icon: '💉', title: 'Vaccination', body: 'Vaccinate against Newcastle Disease on day 7 and Gumboro on day 14. Keep vaccination records.' },
  { icon: '🧹', title: 'Biosecurity', body: 'Disinfect the house before each batch. Limit visitor access and change footwear before entering.' },
  { icon: '📊', title: 'Record keeping', body: 'Track daily feed, mortality, and weight gain. Good records help you spot problems early.' },
];

const NOTICES = [
  { type: 'info', icon: '📢', title: 'New chick batch arriving', date: 'May 2026', body: 'A fresh batch of broiler and layer day-old chicks will be available from the 10th of May. Place your pre-orders early.' },
  { type: 'warning', icon: '⚠️', title: 'Newcastle Disease alert', date: 'April 2026', body: 'Reported cases in parts of Rift Valley. Ensure your flocks are vaccinated and maintain strict biosecurity.' },
  { type: 'success', icon: '✅', title: 'Delivery routes expanded', date: 'April 2026', body: 'We now cover Nakuru, Eldoret, and Kisumu. Farmers in these regions can select delivery when ordering chicks.' },
];

const NOTICE_STYLES = {
  info:    { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  warning: { color: '#92400e', bg: '#fff7ed', border: '#fed7aa' },
  success: { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
};

const GUIDE_STYLES = [
  { bg: '#fff7ed', border: '#fed7aa', emoji: '🐥' },
  { bg: '#f0fdf4', border: '#bbf7d0', emoji: '🐣' },
  { bg: '#fff5f5', border: '#fecaca', emoji: '🩺' },
];

export default function Resources() {
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

  return (
    <PageWrapper>
      {/* Header */}
      <div style={styles.heroSection}>
        <div>
          <p style={styles.heroEyebrow}>Knowledge centre</p>
          <h1 style={styles.heroTitle}>Farmer Resources</h1>
          <p style={styles.heroSub}>Guides, tips, and notices to help you run a successful poultry farm</p>
        </div>
        <span style={{ fontSize: '72px', opacity: 0.9 }}>📚</span>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {[{ key: 'guides', label: '📚 Guides' }, { key: 'tips', label: '💡 Quick Tips' }, { key: 'notices', label: '📢 Notices' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ ...styles.tab, ...(activeTab === t.key ? styles.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Guides */}
      {activeTab === 'guides' && (
        <>
          {loading ? (
            <div style={styles.center}><div style={styles.spinner} /></div>
          ) : (
            <div style={styles.grid}>
              {resources.map((r, i) => {
                const gs = GUIDE_STYLES[i % GUIDE_STYLES.length];
                return (
                  <div key={r.id} style={{ ...styles.guideCard, background: gs.bg, borderColor: gs.border }}>
                    <div style={styles.guideHeader}>
                      <span style={{ fontSize: '36px' }}>{gs.emoji}</span>
                      <div>
                        <h3 style={styles.guideTitle}>{r.title}</h3>
                        <p style={styles.guideDesc}>{r.description}</p>
                      </div>
                    </div>
                    <button onClick={e => e.preventDefault()} style={styles.downloadBtn}>
                      📥 Download PDF
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tips */}
      {activeTab === 'tips' && (
        <div style={styles.grid}>
          {TIPS.map((tip, i) => (
            <div key={i} style={styles.tipCard}>
              <div style={styles.tipIcon}>{tip.icon}</div>
              <div>
                <h3 style={styles.tipTitle}>{tip.title}</h3>
                <p style={styles.tipBody}>{tip.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notices */}
      {activeTab === 'notices' && (
        <div style={styles.noticesList}>
          {NOTICES.map((notice, i) => {
            const ns = NOTICE_STYLES[notice.type];
            return (
              <div key={i} style={{ ...styles.noticeCard, background: ns.bg, borderColor: ns.border }}>
                <div style={{ ...styles.noticeIcon, color: ns.color }}>{notice.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <h3 style={{ ...styles.noticeTitle, color: ns.color }}>{notice.title}</h3>
                    <span style={{ fontSize: '12px', color: '#a8a29e' }}>{notice.date}</span>
                  </div>
                  <p style={styles.noticeBody}>{notice.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contact section */}
      <div style={styles.contactSection}>
        <div style={styles.contactInner}>
          <div>
            <h2 style={styles.contactTitle}>Need help with your flock?</h2>
            <p style={styles.contactSub}>Our agricultural extension officers are available to assist you.</p>
          </div>
          <div style={styles.contactCards}>
            {[
              { label: 'Helpline', value: '0800 720 000', icon: '📞' },
              { label: 'Email', value: 'farmers@kenchic.com', icon: '✉️' },
              { label: 'Hours', value: 'Mon–Sat, 8am–5pm', icon: '🕐' },
            ].map(c => (
              <div key={c.label} style={styles.contactCard}>
                <span style={{ fontSize: '20px' }}>{c.icon}</span>
                <div>
                  <p style={styles.contactLabel}>{c.label}</p>
                  <p style={styles.contactValue}>{c.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageWrapper>
  );
}

const styles = {
  heroSection: { background: 'linear-gradient(135deg, #431407 0%, #92400e 40%, #d97706 100%)', borderRadius: '20px', padding: '40px 48px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  heroEyebrow: { fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' },
  heroTitle: { fontFamily: "'Playfair Display', serif", fontSize: '34px', fontWeight: 700, color: '#fff', marginBottom: '8px' },
  heroSub: { fontSize: '15px', color: 'rgba(255,255,255,0.85)' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid #ede8e0' },
  tab: { padding: '10px 20px', fontSize: '14px', fontWeight: 500, color: '#78716c', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  tabActive: { color: '#d97706', borderBottomColor: '#d97706', fontWeight: 600 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  guideCard: { border: '1px solid', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(180,80,0,0.05)' },
  guideHeader: { display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' },
  guideTitle: { fontWeight: 600, color: '#1c0a00', fontSize: '15px', marginBottom: '4px', fontFamily: "'DM Sans', sans-serif" },
  guideDesc: { fontSize: '13px', color: '#78716c', lineHeight: 1.5 },
  downloadBtn: { background: 'none', border: '1.5px solid #d97706', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: '#d97706', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  tipCard: { background: '#fff', border: '1px solid #ede8e0', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px', boxShadow: '0 2px 8px rgba(180,80,0,0.05)' },
  tipIcon: { width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #fde8c8, #fdba74)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 },
  tipTitle: { fontWeight: 600, color: '#1c0a00', fontSize: '15px', marginBottom: '6px', fontFamily: "'DM Sans', sans-serif" },
  tipBody: { fontSize: '13px', color: '#78716c', lineHeight: 1.6 },
  noticesList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  noticeCard: { border: '1px solid', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px' },
  noticeIcon: { fontSize: '24px', flexShrink: 0, marginTop: '2px' },
  noticeTitle: { fontWeight: 600, fontSize: '15px', fontFamily: "'DM Sans', sans-serif" },
  noticeBody: { fontSize: '13px', color: '#78716c', lineHeight: 1.6 },
  contactSection: { marginTop: '40px', background: 'linear-gradient(135deg, #431407 0%, #92400e 100%)', borderRadius: '20px', padding: '36px 40px' },
  contactInner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', flexWrap: 'wrap' },
  contactTitle: { fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '6px' },
  contactSub: { fontSize: '14px', color: 'rgba(255,255,255,0.7)' },
  contactCards: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  contactCard: { background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' },
  contactLabel: { fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '2px' },
  contactValue: { fontSize: '14px', fontWeight: 600, color: '#fff' },
  center: { display: 'flex', justifyContent: 'center', padding: '60px 0' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3ede6', borderTopColor: '#d97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};
