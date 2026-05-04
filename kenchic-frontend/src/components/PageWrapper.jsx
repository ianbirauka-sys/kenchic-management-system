import Navbar from './Navbar';

export default function PageWrapper({ children, cartCount = 0 }) {
  return (
    <div style={styles.root}>
      <Navbar cartCount={cartCount} />
      <main style={styles.main}>{children}</main>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #f5f0ea !important;
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    background: '#f5f0ea',
    fontFamily: "'DM Sans', sans-serif",
    position: 'relative',
    zIndex: 0,
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  },
};