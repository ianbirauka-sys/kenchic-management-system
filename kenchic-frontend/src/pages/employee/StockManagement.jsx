import { useState, useEffect } from "react";
import { getStock, updateStock, addProduct } from "../../api/employee.api";
import PageWrapper from "../../components/PageWrapper";

const CATEGORIES = ["Whole Chicken", "Chicken Parts", "Processed", "Chicks", "Other"];

export default function StockManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState("");
  const [savingId, setSavingId] = useState(null);

  // Add-new-product modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock_quantity: "",
  });
  const [addStatus, setAddStatus] = useState("idle"); // idle | submitting | success | error
  const [addError, setAddError] = useState("");

  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = () => {
    setLoading(true);
    getStock()
      .then((res) => setProducts(res.data?.data || res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Edit existing quantity ──
  const handleSaveQty = async (product) => {
    const qty = parseInt(editQty, 10);
    if (isNaN(qty) || qty < 0) {
      showToast("Enter a valid quantity (0 or more).", "error");
      return;
    }
    setSavingId(product.id);
    try {
      await updateStock(product.id, { stock_quantity: qty });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock_quantity: qty } : p))
      );
      setEditingId(null);
      showToast(`${product.name} updated to ${qty} units.`);
    } catch {
      showToast("Failed to update stock.", "error");
    } finally {
      setSavingId(null);
    }
  };

  // ── Add new product ──
  const handleAddProduct = async () => {
    const { name, price, stock_quantity, category } = newProduct;
    if (!name.trim() || !price || !stock_quantity || !category) {
      setAddError("Name, price, category, and initial stock are required.");
      return;
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
      setAddError("Price must be a positive number.");
      return;
    }
    if (isNaN(Number(stock_quantity)) || Number(stock_quantity) < 0) {
      setAddError("Stock quantity must be 0 or more.");
      return;
    }
    setAddError("");
    setAddStatus("submitting");
    try {
      const payload = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock_quantity: parseInt(newProduct.stock_quantity, 10),
      };
      const res = await addProduct(payload);
      const created = res.data?.data || res.data;
      setProducts((prev) => [...prev, created]);
      setAddStatus("success");
      showToast(`"${newProduct.name}" added to catalog!`);
      setTimeout(() => {
        setShowAddModal(false);
        setAddStatus("idle");
        setNewProduct({ name: "", description: "", price: "", category: "", stock_quantity: "" });
      }, 1200);
    } catch (err) {
      setAddError(err.response?.data?.message || "Failed to add product.");
      setAddStatus("error");
    }
  };

  const allCategories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
  ];

  const filtered = products.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "All" || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const stockStats = {
    total: products.length,
    lowStock: products.filter((p) => p.stock_quantity <= 10).length,
    outOfStock: products.filter((p) => p.stock_quantity === 0).length,
  };

  return (
    <PageWrapper>

      {/* Hero */}
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
            Inventory Control
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '34px',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '8px'
          }}>
            Stock Management
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.85)'
          }}>
            Monitor and update product inventory levels
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#fff",
              color: "#7c3d12",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            + Add New Product
          </button>
          <span style={{ fontSize: '80px', opacity: 0.9 }}>📦</span>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "2rem 1.5rem",
        }}
      >
        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          {[
            { label: "Total Products", value: stockStats.total, color: "#7c3d12", bg: "#fef3c7" },
            { label: "Low Stock (≤10)", value: stockStats.lowStock, color: "#b45309", bg: "#fee2e2" },
            { label: "Out of Stock", value: stockStats.outOfStock, color: "#dc2626", bg: "#fee2e2" },
          ].map(({ label, value, color, bg }) => (
            <div
              key={label}
              style={{
                background: bg,
                borderRadius: "10px",
                padding: "1.2rem 1.5rem",
                border: `1px solid ${color}33`,
              }}
            >
              <div style={{ fontSize: "1.8rem", fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: "0.85rem", color: "#555", marginTop: "0.2rem" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: "1.5rem",
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
              background: "#fff",
            }}
          />
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                style={{
                  padding: "0.4rem 0.9rem",
                  borderRadius: "20px",
                  border: "1px solid",
                  borderColor: filterCat === cat ? "#b45309" : "#d6c5b0",
                  background: filterCat === cat ? "#b45309" : "#fff",
                  color: filterCat === cat ? "#fff" : "#5c3d1a",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#7c3d12" }}>
            Loading inventory…
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              border: "1px solid #e8ddd0",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f5f0ea" }}>
                  {["Product", "Category", "Price (KSh)", "Stock", "Status", "Action"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "0.9rem 1rem",
                          textAlign: "left",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: "#7c3d12",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          borderBottom: "1px solid #e8ddd0",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: "2rem", textAlign: "center", color: "#888" }}
                    >
                      No products found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((product, i) => {
                    const isLow =
                      product.stock_quantity <= 10 && product.stock_quantity > 0;
                    const isOut = product.stock_quantity === 0;
                    return (
                      <tr
                        key={product.id}
                        style={{
                          background: i % 2 === 0 ? "#fff" : "#fafaf8",
                          borderBottom: "1px solid #f0ece6",
                        }}
                      >
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600, color: "#1a1a1a" }}>
                            {product.name}
                          </div>
                          {product.description && (
                            <div
                              style={{
                                fontSize: "0.78rem",
                                color: "#888",
                                marginTop: "2px",
                              }}
                            >
                              {product.description.slice(0, 50)}
                              {product.description.length > 50 ? "…" : ""}
                            </div>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontSize: "0.78rem",
                              background: "#fef3c7",
                              color: "#92400e",
                              padding: "0.2rem 0.6rem",
                              borderRadius: "20px",
                              fontWeight: 600,
                            }}
                          >
                            {product.category || "—"}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: "#7c3d12" }}>
                          {Number(product.price).toLocaleString()}
                        </td>
                        <td style={tdStyle}>
                          {editingId === product.id ? (
                            <input
                              type="number"
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value)}
                              min="0"
                              autoFocus
                              style={{
                                width: "80px",
                                padding: "0.35rem 0.5rem",
                                borderRadius: "6px",
                                border: "1px solid #b45309",
                                fontSize: "0.9rem",
                                outline: "none",
                              }}
                            />
                          ) : (
                            <span style={{ fontWeight: 600 }}>
                              {product.stock_quantity}
                            </span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontSize: "0.78rem",
                              padding: "0.2rem 0.6rem",
                              borderRadius: "20px",
                              fontWeight: 600,
                              background: isOut
                                ? "#fee2e2"
                                : isLow
                                ? "#fef3c7"
                                : "#dcfce7",
                              color: isOut ? "#dc2626" : isLow ? "#92400e" : "#166534",
                            }}
                          >
                            {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {editingId === product.id ? (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                onClick={() => handleSaveQty(product)}
                                disabled={savingId === product.id}
                                style={smallBtnStyle("#b45309")}
                              >
                                {savingId === product.id ? "…" : "Save"}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                style={smallBtnStyle("#6b7280")}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingId(product.id);
                                setEditQty(String(product.stock_quantity));
                              }}
                              style={smallBtnStyle("#5c3d1a")}
                            >
                              Edit Qty
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add New Product Modal ── */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "2rem",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: "#7c3d12",
                  fontSize: "1.3rem",
                  margin: 0,
                }}
              >
                Add New Product
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.3rem",
                  cursor: "pointer",
                  color: "#888",
                }}
              >
                ✕
              </button>
            </div>

            {/* Form fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Product Name *</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Fresh Whole Chicken 1.5kg"
                  style={modalInputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Brief product description…"
                  rows={2}
                  style={{ ...modalInputStyle, resize: "vertical" }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label style={labelStyle}>Price (KSh) *</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, price: e.target.value }))
                    }
                    placeholder="e.g. 850"
                    min="0"
                    style={modalInputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Initial Stock *</label>
                  <input
                    type="number"
                    value={newProduct.stock_quantity}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        stock_quantity: e.target.value,
                      }))
                    }
                    placeholder="e.g. 100"
                    min="0"
                    style={modalInputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Category *</label>
                <select
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, category: e.target.value }))
                  }
                  style={{
                    ...modalInputStyle,
                    color: newProduct.category ? "#1a1a1a" : "#888",
                  }}
                >
                  <option value="">Select category…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {addError && (
              <p
                style={{
                  color: "#dc2626",
                  fontSize: "0.88rem",
                  marginTop: "1rem",
                  marginBottom: 0,
                }}
              >
                {addError}
              </p>
            )}

            {addStatus === "success" && (
              <p
                style={{
                  color: "#15803d",
                  fontSize: "0.88rem",
                  marginTop: "1rem",
                  fontWeight: 600,
                }}
              >
                ✅ Product added successfully!
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginTop: "1.5rem",
              }}
            >
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: "0.7rem",
                  borderRadius: "10px",
                  border: "1px solid #d6c5b0",
                  background: "#fff",
                  color: "#555",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                disabled={addStatus === "submitting"}
                style={{
                  flex: 2,
                  padding: "0.7rem",
                  borderRadius: "10px",
                  background: addStatus === "submitting" ? "#ccc" : "#b45309",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  cursor: addStatus === "submitting" ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                }}
              >
                {addStatus === "submitting" ? "Adding…" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            background: toast.type === "error" ? "#b91c1c" : "#15803d",
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

const tdStyle = {
  padding: "0.85rem 1rem",
  verticalAlign: "middle",
  fontSize: "0.9rem",
  color: "#333",
};

const smallBtnStyle = (bg) => ({
  padding: "0.35rem 0.8rem",
  borderRadius: "6px",
  border: "none",
  background: bg,
  color: "#fff",
  fontWeight: 600,
  fontSize: "0.8rem",
  cursor: "pointer",
});

const labelStyle = {
  display: "block",
  fontWeight: 600,
  fontSize: "0.83rem",
  color: "#5c3d1a",
  marginBottom: "0.35rem",
};

const modalInputStyle = {
  width: "100%",
  padding: "0.55rem 0.85rem",
  borderRadius: "8px",
  border: "1px solid #d6c5b0",
  fontSize: "0.9rem",
  outline: "none",
  boxSizing: "border-box",
  background: "#fafafa",
};
