import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const NAV_LINKS = {
  customer: [
    { label: 'Products', path: '/customer/products', icon: '🛍️' },
    { label: 'My Orders', path: '/customer/orders', icon: '📦' },
    { label: 'Cart', path: '/customer/cart', icon: '🛒', isCart: true },
  ],
  farmer: [
    { label: 'Catalog', path: '/farmer/chicks', icon: '🐣' },
    { label: 'My Orders', path: '/farmer/order', icon: '📋' },
    { label: 'Resources', path: '/farmer/resources', icon: '📚' },
  ],
  employee: [
    { label: 'Orders', path: '/employee/orders', icon: '📋' },
    { label: 'Stock', path: '/employee/stock', icon: '📦' },
    { label: 'Deliveries', path: '/employee/deliveries', icon: '🚚' },
    { label: 'Reports', path: '/employee/reports', icon: '📊' },
  ],
};

const ROLE_BADGE = {
  customer: { label: 'Customer', color: '#d97706', bg: '#fffbeb' },
  farmer:   { label: 'Farmer',   color: '#16a34a', bg: '#f0fdf4' },
  employee: { label: 'Staff',    color: '#7c3aed', bg: '#faf5ff' },
};

export default function Navbar({ cartCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const links = NAV_LINKS[user.role] || [];
  const badge = ROLE_BADGE[user.role] || ROLE_BADGE.customer;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.logo} onClick={() => navigate(links[0]?.path || '/')}>
          <span style={styles.logoIcon}>🐔</span>
          <span style={styles.logoText}>Kenchic<span style={styles.logoDot}>.</span></span>
        </div>

        <div style={styles.linksWrap}>
          {links.map(link => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  ...styles.navLink,
                  ...(isActive ? styles.navLinkActive : {}),
                  ...(link.isCart ? styles.cartBtn : {}),
                }}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
                {link.isCart && cartCount > 0 && (
                  <span style={styles.cartBadge}>{cartCount}</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={styles.rightWrap}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{user.name?.charAt(0).toUpperCase()}</div>
            <div style={styles.userDetails}>
              <span style={styles.userName}>{user.name}</span>
              <span style={{ ...styles.roleBadge, color: badge.color, background: badge.bg }}>
                {badge.label}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Sign out</button>
        </div>

        <button style={styles.mobileToggle} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {menuOpen && (
        <div style={styles.mobileMenu}>
          {links.map(link => (
            <button
              key={link.path}
              onClick={() => { navigate(link.path); setMenuOpen(false); }}
              style={{
                ...styles.mobileLink,
                ...(location.pathname === link.path ? styles.mobileLinkActive : {}),
              }}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
              {link.isCart && cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
            </button>
          ))}
          <div style={styles.mobileDivider} />
          <div style={styles.mobileUser}>
            <span style={styles.mobileUserName}>{user.name}</span>
            <span style={{ ...styles.roleBadge, color: badge.color, background: badge.bg }}>{badge.label}</span>
          </div>
          <button onClick={handleLogout} style={styles.mobileLogout}>Sign out</button>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
      `}</style>
    </>
  );
}

const styles = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 32px', height: '64px',
    background: 'rgba(255,255,255,0.97)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #f3ede6',
    boxShadow: '0 2px 16px rgba(180,80,0,0.06)',
    fontFamily: "'DM Sans', sans-serif",
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  logoIcon: { fontSize: '28px' },
  logoText: { fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 800, color: '#92400e' },
  logoDot: { color: '#d97706' },
  linksWrap: { display: 'flex', alignItems: 'center', gap: '4px' },
  navLink: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: '10px',
    border: 'none', background: 'transparent',
    fontSize: '14px', fontWeight: 500, color: '#78716c',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s', position: 'relative',
  },
  navLinkActive: { background: '#fff7ed', color: '#d97706', fontWeight: 600 },
  cartBtn: {
    background: 'linear-gradient(135deg, #d97706, #ea580c)',
    color: '#fff', fontWeight: 600,
    boxShadow: '0 2px 10px rgba(217,119,6,0.3)',
  },
  cartBadge: {
    position: 'absolute', top: '-4px', right: '-4px',
    background: '#ef4444', color: '#fff',
    fontSize: '10px', fontWeight: 700,
    width: '18px', height: '18px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  rightWrap: { display: 'flex', alignItems: 'center', gap: '16px' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #d97706, #ea580c)',
    color: '#fff', fontSize: '15px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  userDetails: { display: 'flex', flexDirection: 'column', gap: '2px' },
  userName: { fontSize: '13px', fontWeight: 600, color: '#1c0a00', lineHeight: 1 },
  roleBadge: { fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px', width: 'fit-content' },
  logoutBtn: {
    background: 'none', border: '1.5px solid #e7e5e4',
    borderRadius: '8px', padding: '7px 14px',
    fontSize: '13px', fontWeight: 500, color: '#78716c',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  },
  mobileToggle: { display: 'none', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#78716c', padding: '8px' },
  mobileMenu: {
    position: 'fixed', top: '64px', left: 0, right: 0,
    background: '#fff', zIndex: 99, padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '4px',
    borderBottom: '1px solid #f3ede6',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  },
  mobileLink: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 16px', borderRadius: '10px',
    border: 'none', background: 'transparent',
    fontSize: '15px', fontWeight: 500, color: '#78716c',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'left',
  },
  mobileLinkActive: { background: '#fff7ed', color: '#d97706', fontWeight: 600 },
  mobileDivider: { height: '1px', background: '#f3ede6', margin: '8px 0' },
  mobileUser: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px' },
  mobileUserName: { fontSize: '14px', fontWeight: 600, color: '#1c0a00' },
  mobileLogout: {
    background: 'none', border: '1.5px solid #e7e5e4',
    borderRadius: '10px', padding: '12px 16px',
    fontSize: '14px', fontWeight: 500, color: '#78716c',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    textAlign: 'left', marginTop: '4px',
  },
};
