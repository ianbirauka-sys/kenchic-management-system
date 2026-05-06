import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { submitInquiry } from "../../api/customer.api";
import PageWrapper from "../../components/PageWrapper";

const INQUIRY_TYPES = [
  "Order Issue",
  "Delivery Problem",
  "Product Question",
  "Payment Issue",
  "Return / Refund",
  "Other",
];

export default function CustomerSupport() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    inquiry_type: "",
    order_id: "",
    message: "",
  });
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim() || !form.inquiry_type) {
      setErrorMsg("Please fill in your name, email, inquiry type, and message.");
      return;
    }
    if (!form.email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setErrorMsg("");
    setStatus("submitting");
    try {
      await submitInquiry(form);
      setStatus("success");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Failed to send your inquiry. Please try again."
      );
      setStatus("error");
    }
  };

  return (
    <PageWrapper>

      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #7c3d12 0%, #b45309 100%)",
          color: "#fff",
          padding: "3rem 2rem",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "2.2rem",
            marginBottom: "0.5rem",
          }}
        >
          Customer Support
        </h1>
        <p style={{ opacity: 0.85, fontSize: "1.05rem" }}>
          We're here to help. Send us a message and we'll respond within 24 hours.
        </p>
      </div>

      <div
        style={{
          background: "#f5f0ea",
          padding: "3rem 1.5rem",
          minHeight: "70vh",
        }}
      >
        <div
          style={{
            maxWidth: "860px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: "2rem",
          }}
        >
          {/* ── Left: Contact info ── */}
          <div>
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "1.5rem",
                border: "1px solid #e8ddd0",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: "#7c3d12",
                  marginBottom: "1rem",
                  fontSize: "1.1rem",
                }}
              >
                Contact Details
              </h3>
              {[
                { icon: "📞", label: "Phone", value: "+254 700 000 000" },
                { icon: "📧", label: "Email", value: "support@kenchic.co.ke" },
                { icon: "📍", label: "Address", value: "Industrial Area, Nairobi" },
                { icon: "🕐", label: "Hours", value: "Mon–Fri, 8am–6pm" },
              ].map(({ icon, label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    gap: "0.8rem",
                    marginBottom: "0.9rem",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ fontSize: "1.1rem", marginTop: "1px" }}>{icon}</span>
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#888",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#333", fontWeight: 500 }}>
                      {value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick FAQ */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "1.5rem",
                border: "1px solid #e8ddd0",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: "#7c3d12",
                  marginBottom: "1rem",
                  fontSize: "1.1rem",
                }}
              >
                Quick Answers
              </h3>
              {[
                { q: "How do I track my order?", a: "Go to Order Tracking in your dashboard." },
                { q: "What payment methods do you accept?", a: "M-Pesa and cash on delivery." },
                { q: "Can I cancel an order?", a: "Contact us within 2 hours of placing it." },
              ].map(({ q, a }) => (
                <details key={q} style={{ marginBottom: "0.7rem" }}>
                  <summary
                    style={{
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.88rem",
                      color: "#5c3d1a",
                      paddingBottom: "0.3rem",
                    }}
                  >
                    {q}
                  </summary>
                  <p
                    style={{
                      fontSize: "0.83rem",
                      color: "#666",
                      margin: "0.3rem 0 0 0",
                      lineHeight: 1.5,
                    }}
                  >
                    {a}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* ── Right: Inquiry Form ── */}
          <div>
            {status === "success" ? (
              <div
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "3rem 2rem",
                  textAlign: "center",
                  border: "1px solid #e8ddd0",
                }}
              >
                <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>✅</div>
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "#7c3d12",
                    marginBottom: "0.5rem",
                  }}
                >
                  Message Sent!
                </h2>
                <p style={{ color: "#555", marginBottom: "1.5rem" }}>
                  Thank you, {form.name.split(" ")[0]}. Our team will get back to you within
                  24 hours.
                </p>
                <button
                  onClick={() => {
                    setStatus("idle");
                    setForm({
                      name: user?.name || "",
                      email: user?.email || "",
                      phone: user?.phone || "",
                      inquiry_type: "",
                      order_id: "",
                      message: "",
                    });
                  }}
                  style={{
                    padding: "0.7rem 1.5rem",
                    background: "#b45309",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <div
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "1.8rem 2rem",
                  border: "1px solid #e8ddd0",
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "#7c3d12",
                    marginBottom: "1.5rem",
                    fontSize: "1.3rem",
                  }}
                >
                  Send Us a Message
                </h2>

                {/* Name + Email row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="jane@email.com"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Phone + Order ID row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Phone (optional)</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="0712 345 678"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Order ID (if relevant)</label>
                    <input
                      name="order_id"
                      value={form.order_id}
                      onChange={handleChange}
                      placeholder="e.g. 1042"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Inquiry type */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={labelStyle}>Inquiry Type *</label>
                  <select
                    name="inquiry_type"
                    value={form.inquiry_type}
                    onChange={handleChange}
                    style={{ ...inputStyle, color: form.inquiry_type ? "#1a1a1a" : "#888" }}
                  >
                    <option value="">Select a category…</option>
                    {INQUIRY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={labelStyle}>Message *</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Describe your issue or question in detail…"
                    rows={5}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>

                {errorMsg && (
                  <p
                    style={{
                      color: "#dc2626",
                      fontSize: "0.88rem",
                      marginBottom: "1rem",
                    }}
                  >
                    {errorMsg}
                  </p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={status === "submitting"}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: status === "submitting" ? "#ccc" : "#b45309",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "1rem",
                    cursor: status === "submitting" ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  {status === "submitting" ? "Sending…" : "Send Message →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

const labelStyle = {
  display: "block",
  fontWeight: 600,
  fontSize: "0.83rem",
  color: "#5c3d1a",
  marginBottom: "0.35rem",
};

const inputStyle = {
  width: "100%",
  padding: "0.55rem 0.85rem",
  borderRadius: "8px",
  border: "1px solid #d6c5b0",
  fontSize: "0.9rem",
  outline: "none",
  boxSizing: "border-box",
  background: "#fafafa",
};
