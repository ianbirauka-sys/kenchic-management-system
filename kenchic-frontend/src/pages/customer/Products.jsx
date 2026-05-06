import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getProducts } from "../../api/customer.api";
import PageWrapper from "../../components/PageWrapper";

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

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("kenchic_cart", JSON.stringify(cart));
  }, [cart]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const addToCart = (product) => {
    // Redirect guests to login
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
    <PageWrapper>
      {/* ── Guest / Auth Navbar ── */}
      <nav
        style={{
          background: "#fff",
          borderBottom: "1px solid #e8ddd0",
          padding: "0 2rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "#7c3d12",
            textDecoration: "none",
          }}
        >
          🐔 Kenchic
        </Link>

        {/* Right side — guest vs authenticated */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user ? (
            <>
              {/* Cart button for logged-in customers */}
              <button
                onClick={() => navigate("/customer/cart")}
                style={{
                  background: "#f5f0ea",
                  border: "1px solid #d6c5b0",
                  borderRadius: "8px",
                  padding: "0.45rem 1rem",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  color: "#5c3d1a",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                🛒 Cart
                {cartCount > 0 && (
                  <span
                    style={{
                      background: "#b45309",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
              <span style={{ color: "#7c3d12", fontSize: "0.85rem" }}>
                Hi, {user.name?.split(" ")[0]}
              </span>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  padding: "0.45rem 1.1rem",
                  borderRadius: "8px",
                  border: "1px solid #b45309",
                  color: "#b45309",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                style={{
                  padding: "0.45rem 1.1rem",
                  borderRadius: "8px",
                  background: "#b45309",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  textDecoration: "none",
                }}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #431407 0%, #92400e 40%, #d97706 100%)',
        borderRadius: '20px',
        padding: '40px 48px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <p style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.8)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '8px'
          }}>
            Fresh Products
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '34px',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '8px'
          }}>
            Kenchic Marketplace
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.85)'
          }}>
            Kenya's finest poultry, delivered to your door
          </p>
        </div>
        <span style={{ fontSize: '80px', opacity: 0.9 }}>🐔</span>
      </div>

      {/* ── Filters ── */}
      <div
        style={{
          background: "#fff",
          padding: "1rem 2rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
          borderBottom: "1px solid #e8ddd0",
        }}
      >
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "0.55rem 1rem",
            borderRadius: "8px",
            border: "1px solid #d6c5b0",
            fontSize: "0.9rem",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "20px",
                border: "1px solid",
                borderColor: category === cat ? "#b45309" : "#d6c5b0",
                background: category === cat ? "#b45309" : "#fff",
                color: category === cat ? "#fff" : "#5c3d1a",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 500,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Product Grid ── */}
      <div
        style={{
          padding: "2rem",
          background: "#f5f0ea",
          minHeight: "60vh",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#7c3d12" }}>
            Loading products…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#888" }}>
            No products found.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1.5rem",
            }}
          >
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

      {/* ── Toast ── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            background: toast.type === "success" ? "#15803d" : "#b91c1c",
            color: "#fff",
            padding: "0.8rem 1.4rem",
            borderRadius: "10px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            zIndex: 9999,
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          {toast.msg}
        </div>
      )}
    </PageWrapper>
  );
}

function ProductCard({ product, onAddToCart, isGuest }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)";
      }}
    >
      {/* Product image placeholder */}
      <div
        style={{
          height: "160px",
          background: "linear-gradient(135deg, #fef3c7, #fde68a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "3rem",
        }}
      >
        🍗
      </div>

      <div style={{ padding: "1rem" }}>
        {product.category && (
          <span
            style={{
              fontSize: "0.75rem",
              background: "#fef3c7",
              color: "#92400e",
              padding: "0.2rem 0.6rem",
              borderRadius: "20px",
              fontWeight: 600,
            }}
          >
            {product.category}
          </span>
        )}
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.1rem",
            margin: "0.5rem 0 0.3rem",
            color: "#1a1a1a",
          }}
        >
          {product.name}
        </h3>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#666",
            marginBottom: "0.8rem",
            lineHeight: 1.5,
            minHeight: "40px",
          }}
        >
          {product.description || "Premium Kenchic quality."}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{ fontWeight: 700, fontSize: "1.1rem", color: "#7c3d12" }}
          >
            KSh {Number(product.price).toLocaleString()}
          </span>
          <span
            style={{
              fontSize: "0.78rem",
              color: product.stock_quantity > 0 ? "#15803d" : "#dc2626",
              fontWeight: 500,
            }}
          >
            {product.stock_quantity > 0
              ? `${product.stock_quantity} in stock`
              : "Out of stock"}
          </span>
        </div>

        <button
          onClick={() => onAddToCart(product)}
          disabled={product.stock_quantity === 0}
          style={{
            marginTop: "0.8rem",
            width: "100%",
            padding: "0.6rem",
            background:
              product.stock_quantity === 0 ? "#ccc" : "#b45309",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: product.stock_quantity === 0 ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "0.9rem",
            transition: "background 0.2s",
          }}
        >
          {isGuest
            ? "Sign in to Order"
            : product.stock_quantity === 0
            ? "Out of Stock"
            : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
