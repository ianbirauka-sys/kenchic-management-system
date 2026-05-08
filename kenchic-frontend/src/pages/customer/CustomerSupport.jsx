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

const FAQ = [
  { q: "How do I track my order?", a: "Go to My Orders in the navigation bar to see live status updates for all your orders." },
  { q: "What payment methods do you accept?", a: "We accept M-Pesa (STK Push) and cash on delivery for qualifying areas." },
  { q: "Can I cancel an order?", a: "Contact us within 2 hours of placing your order and we'll process the cancellation." },
  { q: "How long does delivery take?", a: "Standard delivery within Nairobi takes 1–2 business days. Other regions may vary." },
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
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

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
      setErrorMsg(err.response?.data?.message || "Failed to send your inquiry. Please try again.");
      setStatus("error");
    }
  };

  return (
    <PageWrapper>
      {/* ── Hero — matches all other pages exactly ── */}
      <div style={styles.hero}>
        <div>
          <p style={styles.heroEyebrow}>Help & Support</p>
          <h1 style={styles.heroTitle}>Customer Support</h1>
          <p style={styles.heroSub}>
            We're here to help. Send us a message and we'll respond within 24 hours.
          </p>
        </div>
        <span style={{ fontSize: "80px", opacity: 0.9 }}>💬</span>
      </div>

      {/* ── Two-column layout ── */}
      <div style={styles.layout}>

        {/* Left column */}
        <div style={styles.leftCol}>

          {/* Contact info card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Contact Details</h2>
            {[
              { icon: "📞", label: "Phone",   value: "+254 700 000 000" },
              { icon: "📧", label: "Email",   value: "support@kenchic.co.ke" },
              { icon: "📍", label: "Address", value: "Industrial Area, Nairobi" },
              { icon: "🕐", label: "Hours",   value: "Mon–Fri, 8am–6pm" },
            ].map(({ icon, label, value }) => (
              <div key={label} style={styles.contactRow}>
                <div style={styles.contactIcon}>{icon}</div>
                <div>
                  <p style={styles.contactLabel}>{label}</p>
                  <p style={styles.contactValue}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Quick Answers</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {FAQ.map((item, i) => (
                <div key={i} style={styles.faqItem}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={styles.faqQuestion}
                  >
                    <span>{item.q}</span>
                    <span style={{ color: "#d97706", fontSize: "16px", flexShrink: 0 }}>
                      {openFaq === i ? "−" : "+"}
                    </span>
                  </button>
                  {openFaq === i && (
                    <p style={styles.faqAnswer}>{item.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right column — form */}
        <div style={styles.rightCol}>
          {status === "success" ? (
            /* Success state */
            <div style={{ ...styles.card, textAlign: "center", padding: "60px 40px" }}>
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
              <h2 style={styles.successTitle}>Message Sent!</h2>
              <p style={styles.successSub}>
                Thank you, {form.name.split(" ")[0]}. Our team will get back to you
                within 24 hours.
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
                style={styles.primaryBtn}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Send Us a Message</h2>
              <p style={styles.cardSubtitle}>
                Fill in the form and our support team will get back to you shortly.
              </p>

              <div style={styles.formBody}>
                {/* Name + Email */}
                <div style={styles.twoCol}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Full Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Email *</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="jane@email.com"
                      style={styles.input}
                    />
                  </div>
                </div>

                {/* Phone + Order ID */}
                <div style={styles.twoCol}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Phone (optional)</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="0712 345 678"
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Order ID (if relevant)</label>
                    <input
                      name="order_id"
                      value={form.order_id}
                      onChange={handleChange}
                      placeholder="e.g. 1042"
                      style={styles.input}
                    />
                  </div>
                </div>

                {/* Inquiry type */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Inquiry Type *</label>
                  <select
                    name="inquiry_type"
                    value={form.inquiry_type}
                    onChange={handleChange}
                    style={{ ...styles.input, color: form.inquiry_type ? "#1c0a00" : "#a8a29e" }}
                  >
                    <option value="">Select a category…</option>
                    {INQUIRY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Message *</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Describe your issue or question in detail…"
                    rows={5}
                    style={{ ...styles.input, resize: "vertical" }}
                  />
                </div>

                {errorMsg && <p style={styles.errorText}>{errorMsg}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={status === "submitting"}
                  style={{
                    ...styles.primaryBtn,
                    width: "100%",
                    opacity: status === "submitting" ? 0.7 : 1,
                    cursor: status === "submitting" ? "not-allowed" : "pointer",
                  }}
                >
                  {status === "submitting" ? "Sending…" : "Send Message →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #d97706 !important;
          box-shadow: 0 0 0 3px rgba(217,119,6,0.1);
        }
      `}</style>
    </PageWrapper>
  );
}

const styles = {
  // Hero — exact match to all other pages
  hero: {
    background: "linear-gradient(135deg, #431407 0%, #92400e 40%, #d97706 100%)",
    borderRadius: "20px",
    padding: "40px 48px",
    marginBottom: "28px",
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
    fontFamily: "'DM Sans', sans-serif",
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
    fontFamily: "'DM Sans', sans-serif",
  },

  // Layout
  layout: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: "20px",
    alignItems: "start",
  },
  leftCol: { display: "flex", flexDirection: "column", gap: "20px" },
  rightCol: {},

  // Card — matches the white section cards across all pages
  card: {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #ede8e0",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(180,80,0,0.05)",
  },
  cardTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "18px",
    fontWeight: 700,
    color: "#1c0a00",
    marginBottom: "4px",
  },
  cardSubtitle: {
    fontSize: "13px",
    color: "#78716c",
    marginBottom: "20px",
    fontFamily: "'DM Sans', sans-serif",
  },

  // Contact rows
  contactRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    padding: "12px 0",
    borderBottom: "1px solid #f5f0ea",
  },
  contactIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #fde8c8, #fdba74)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
    flexShrink: 0,
  },
  contactLabel: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#a8a29e",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "2px",
    fontFamily: "'DM Sans', sans-serif",
  },
  contactValue: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#1c0a00",
    fontFamily: "'DM Sans', sans-serif",
  },

  // FAQ
  faqItem: {
    borderBottom: "1px solid #f5f0ea",
  },
  faqQuestion: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "12px 0",
    background: "none",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: 600,
    color: "#44403c",
    fontFamily: "'DM Sans', sans-serif",
  },
  faqAnswer: {
    fontSize: "13px",
    color: "#78716c",
    lineHeight: 1.6,
    padding: "0 0 12px",
    fontFamily: "'DM Sans', sans-serif",
  },

  // Form
  formBody: { display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#44403c",
    fontFamily: "'DM Sans', sans-serif",
  },
  input: {
    border: "1.5px solid #e7e5e4",
    borderRadius: "10px",
    padding: "11px 14px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    color: "#1c0a00",
    background: "#fafafa",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  errorText: {
    color: "#dc2626",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
  },

  // Primary button — same as all other pages
  primaryBtn: {
    background: "linear-gradient(135deg, #d97706, #ea580c)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "13px 24px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 4px 16px rgba(217,119,6,0.35)",
    display: "inline-block",
    textAlign: "center",
  },

  // Success state
  successTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "26px",
    fontWeight: 700,
    color: "#1c0a00",
    marginBottom: "10px",
  },
  successSub: {
    fontSize: "14px",
    color: "#78716c",
    lineHeight: 1.6,
    marginBottom: "28px",
    fontFamily: "'DM Sans', sans-serif",
  },
};
