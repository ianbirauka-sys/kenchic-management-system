import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getProducts } from "../../api/customer.api";
import PageWrapper from "../../components/PageWrapper";

const CATEGORY_EMOJI = {
  chicks: "🐣",
  poultry: "🍗",
  feed: "🌾",
  equipment: "🔧",
  "Whole Chicken": "🍗",
  "Chicken Parts": "🍖",
  Processed: "📦",
  Chicks: "🐣",
};

export default function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kenchic_cart")) || [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getProducts()
      .then((res) => setProducts(res.data?.data || res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem("kenchic_cart", JSON.stringify(cart));
  }, [cart]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const addToCart = (product) => {
    if (!user) {
      navigate("/login", { state: { from: "/customer/products" } });
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`${product.name} added to cart`);
  };

  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
  ];

  const filtered = products.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || p.category === category;
    return matchSearch && matchCat;
  });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <PageWrapper cartCount={cartCount}>
      {/* Guest top banner — only shown when not logged in */}
      {!user && (
        <div style={styles.guestBanner}>
          <span style={styles.guestBannerText}>
            🐔 Welcome to Kenchic — Kenya's trusted poultry brand
          </span>
          <div style={styles.guestBannerActions}>
            <Link to="/login" style={styles.bannerSignIn}>Sign In</Link>
            <Link to="/register" style={styles.bannerRegister}>Create Account</Link>
          </div>
        </div>
      )}

      {/* Hero Banner — matches all other pages */}
      <div style={styles.hero}>
        <div>
          <p style={styles.heroEyebrow}>Fresh Products</p>
          <h1 style={styles.heroTitle}>Kenchic Marketplace</h1>
          <p style={styles.heroSub}>Kenya's finest poultry, delivered to your door</p>
          <div style={styles.heroStats}>
            {[
              { icon: "✅", text: "Quality guaranteed" },
              { icon: "🚚", text: "Nairobi delivery" },
              { icon: "💳", text: "Pay via M-Pesa" },
            ].map((s) => (
              <div key={s.text} style={styles.heroStat}>
                <span>{s.icon}</span>
                <span>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "16px" }}>
          {user && (
            <button
              onClick={() => navigate("/customer/cart")}
              style={styles.cartHeroBtn}
            >
              🛒 Cart
              {cartCount > 0 && (
                <span style={styles.cartHeroBadge}>{cartCount}</span>
              )}
            </button>
          )}
          <span style={{ fontSize: "80px", opacity: 0.9 }}>🐔</span>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={styles.filtersBar}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.categoryPills}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                ...styles.pill,
                ...(category === cat ? styles.pillActive : {}),
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <div style={styles.resultsRow}>
          <p style={styles.resultsText}>
            {filtered.length} {filtered.length === 1 ? "product" : "products"}
            {category !== "All" ? ` in ${category}` : ""}
            {search ? ` matching "${search}"` : ""}
          </p>
        </div>
      )}

      {/* Product Grid */}
      <div style={styles.gridArea}>
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            <p style={{ color: "#78716c", marginTop: "16px", fontSize: "14px" }}>Loading products…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ fontSize: "56px" }}>🔍</p>
            <p style={{ fontSize: "18px", fontWeight: 600, color: "#44403c", marginTop: "16px" }}>
              No products found
            </p>
            <p style={{ fontSize: "14px", color: "#a8a29e", margin: "8px 0 24px" }}>
              Try adjusting your search or category filter
            </p>
            <button
              onClick={() => { setSearch(""); setCategory("All"); }}
              style={styles.clearBtn}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                isGuest={!user}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.type === "success" ? "#15803d" : "#b91c1c",
        }}>
          {toast.type === "success" ? "✓ " : "⚠ "}{toast.msg}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageWrapper>
  );
}

function ProductCard({ product, onAddToCart, isGuest }) {
  const emoji = CATEGORY_EMOJI[product.category] || "🍗";
  const inStock = product.stock_quantity > 0;

  return (
    <div style={styles.card}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(180,80,0,0.14)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(180,80,0,0.06)";
      }}
    >
      {/* Image area */}
      <div style={styles.cardImg}>
        <span style={{ fontSize: "52px" }}>{emoji}</span>
        {!inStock && (
          <div style={styles.outOfStockOverlay}>
            <span style={styles.outOfStockLabel}>Out of Stock</span>
          </div>
        )}
        {product.category && (
          <span style={styles.categoryTag}>{product.category}</span>
        )}
      </div>

      <div style={styles.cardBody}>
        <h3 style={styles.productName}>{product.name}</h3>
        <p style={styles.productDesc}>
          {product.description || "Premium Kenchic quality product."}
        </p>

        <div style={styles.cardFooter}>
          <div>
            <p style={styles.price}>KSh {Number(product.price).toLocaleString()}</p>
            <p style={{
              fontSize: "12px",
              fontWeight: 500,
              color: inStock ? "#15803d" : "#dc2626",
              marginTop: "2px",
            }}>
              {inStock ? `${product.stock_quantity} in stock` : "Unavailable"}
            </p>
          </div>
          <button
            onClick={() => onAddToCart(product)}
            disabled={!inStock}
            style={{
              ...styles.addBtn,
              ...((!inStock) ? styles.addBtnDisabled : {}),
            }}
          >
            {isGuest ? "Sign in" : inStock ? "Add to Cart" : "Sold Out"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  // Guest banner
  guestBanner: {
    background: "linear-gradient(135deg, #431407, #92400e)",
    borderRadius: "12px",
    padding: "12px 20px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
  },
  guestBannerText: { fontSize: "14px", color: "rgba(255,255,255,0.9)", fontWeight: 500 },
  guestBannerActions: { display: "flex", gap: "10px" },
  bannerSignIn: {
    padding: "7px 18px",
    borderRadius: "8px",
    border: "1.5px solid rgba(255,255,255,0.5)",
    color: "#fff",
    fontWeight: 600,
    fontSize: "13px",
    textDecoration: "none",
  },
  bannerRegister: {
    padding: "7px 18px",
    borderRadius: "8px",
    background: "#fff",
    color: "#7c3d12",
    fontWeight: 700,
    fontSize: "13px",
    textDecoration: "none",
  },

  // Hero — identical structure to other pages
  hero: {
    background: "linear-gradient(135deg, #431407 0%, #92400e 40%, #d97706 100%)",
    borderRadius: "20px",
    padding: "40px 48px",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroEyebrow: {
    fontSize: "12px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "8px",
  },
  heroTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "34px",
    fontWeight: 700,
    color: "#fff",
    marginBottom: "8px",
  },
  heroSub: {
    fontSize: "15px",
    color: "rgba(255,255,255,0.85)",
    marginBottom: "16px",
  },
  heroStats: { display: "flex", gap: "20px", flexWrap: "wrap" },
  heroStat: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "rgba(255,255,255,0.8)",
    background: "rgba(255,255,255,0.12)",
    padding: "5px 12px",
    borderRadius: "100px",
  },
  cartHeroBtn: {
    background: "#fff",
    color: "#7c3d12",
    border: "none",
    borderRadius: "10px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "0.95rem",
    padding: "0.65rem 1.3rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    position: "relative",
    fontFamily: "'DM Sans', sans-serif",
  },
  cartHeroBadge: {
    background: "#ea580c",
    color: "#fff",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    fontSize: "11px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // Filters bar
  filtersBar: {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #ede8e0",
    padding: "16px 20px",
    marginBottom: "16px",
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(180,80,0,0.05)",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#faf8f5",
    border: "1.5px solid #e7e5e4",
    borderRadius: "10px",
    padding: "0 14px",
    flex: 1,
    minWidth: "200px",
  },
  searchIcon: { fontSize: "15px", color: "#a8a29e" },
  searchInput: {
    border: "none",
    background: "transparent",
    padding: "10px 0",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    color: "#1c0a00",
    width: "100%",
    outline: "none",
  },
  categoryPills: { display: "flex", gap: "6px", flexWrap: "wrap" },
  pill: {
    padding: "6px 14px",
    borderRadius: "100px",
    border: "1.5px solid #e7e5e4",
    background: "#fff",
    color: "#78716c",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  },
  pillActive: {
    borderColor: "#d97706",
    background: "#fff7ed",
    color: "#92400e",
    fontWeight: 600,
  },

  resultsRow: { marginBottom: "16px" },
  resultsText: { fontSize: "13px", color: "#a8a29e" },

  // Grid area
  gridArea: { minHeight: "300px" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "20px",
  },

  // States
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 0",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f3ede6",
    borderTopColor: "#d97706",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  emptyState: {
    background: "#fff",
    borderRadius: "20px",
    border: "1px solid #ede8e0",
    padding: "80px 40px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(180,80,0,0.05)",
  },
  clearBtn: {
    background: "linear-gradient(135deg, #d97706, #ea580c)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 4px 16px rgba(217,119,6,0.3)",
  },

  // Product card
  card: {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #ede8e0",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(180,80,0,0.06)",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "default",
  },
  cardImg: {
    height: "160px",
    background: "linear-gradient(135deg, #fde8c8, #fdba74)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  outOfStockOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(255,255,255,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockLabel: {
    background: "#fee2e2",
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: "100px",
    border: "1px solid #fecaca",
  },
  categoryTag: {
    position: "absolute",
    top: "10px",
    left: "10px",
    background: "rgba(255,255,255,0.9)",
    color: "#92400e",
    fontSize: "11px",
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: "100px",
    backdropFilter: "blur(4px)",
  },
  cardBody: { padding: "16px" },
  productName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "16px",
    fontWeight: 700,
    color: "#1c0a00",
    marginBottom: "6px",
  },
  productDesc: {
    fontSize: "13px",
    color: "#78716c",
    lineHeight: 1.5,
    marginBottom: "14px",
    minHeight: "38px",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  price: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#92400e",
    fontFamily: "'Playfair Display', serif",
  },
  addBtn: {
    background: "linear-gradient(135deg, #d97706, #ea580c)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "9px 16px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 2px 8px rgba(217,119,6,0.3)",
    transition: "opacity 0.15s",
  },
  addBtnDisabled: {
    background: "#e7e5e4",
    color: "#a8a29e",
    cursor: "not-allowed",
    boxShadow: "none",
  },

  // Toast
  toast: {
    position: "fixed",
    bottom: "28px",
    right: "28px",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    zIndex: 9999,
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
  },
};