import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getChicks, placeChickOrder } from "../../api/farmer.api";
import { initiatePayment, checkPaymentStatus } from "../../api/payment.api";
import PageWrapper from "../../components/PageWrapper";

const STEPS = ["Select Chicks", "Order Details", "Pay via M-Pesa", "Confirmation"];

export default function FarmerOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [chicks, setChicks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Step state: 0 = select, 1 = details, 2 = payment, 3 = done
  const [step, setStep] = useState(0);

  // Order form state
  const [selected, setSelected] = useState(null); // chick product
  const [quantity, setQuantity] = useState(1);
  const [deliveryType, setDeliveryType] = useState("delivery"); // delivery | pickup
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Payment state
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("idle"); // idle | pending | polling | success | failed
  const [paymentMessage, setPaymentMessage] = useState("");
  const [pollCount, setPollCount] = useState(0);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getChicks()
      .then((res) => setChicks(res.data?.data || res.data || []))
      .catch(() => setChicks([]))
      .finally(() => setLoading(false));
  }, []);

  // Pre-fill phone from user profile if available
  useEffect(() => {
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  const totalCost = selected
    ? Number(selected.price_per_chick || selected.price) * quantity
    : 0;

  // ── Step 0 → 1: select chick ──
  const handleSelectChick = (chick) => {
    setSelected(chick);
    setQuantity(1);
    setError("");
    setStep(1);
  };

  // ── Step 1 → 2: place order then go to payment ──
  const handlePlaceOrder = async () => {
    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      setError("Please enter a delivery address.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        chick_id: selected.id,
        quantity,
        delivery_type: deliveryType,
        delivery_address: deliveryType === "delivery" ? deliveryAddress : null,
        notes,
      };
      const res = await placeChickOrder(payload);
      const newOrderId = res.data?.data?.order_id || res.data?.order_id;
      setOrderId(newOrderId);
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to place order. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 2: initiate M-Pesa STK Push ──
  const handleInitiatePayment = async () => {
    const cleaned = phone.replace(/\s+/g, "");
    if (!cleaned.match(/^(07|01|2547|2541)\d{8}$/)) {
      setError("Enter a valid Safaricom number (e.g. 0712345678).");
      return;
    }
    setError("");
    setPaymentStatus("pending");
    setPaymentMessage("Sending STK Push to your phone…");

    try {
      const res = await initiatePayment({
        order_id: orderId,
        phone: cleaned,
        amount: totalCost,
      });
      const reqId =
        res.data?.data?.CheckoutRequestID || res.data?.CheckoutRequestID;
      setCheckoutRequestId(reqId);
      setPaymentStatus("polling");
      setPaymentMessage(
        "Check your phone and enter your M-Pesa PIN. Waiting for confirmation…"
      );
      setPollCount(0);
    } catch (err) {
      setPaymentStatus("failed");
      setPaymentMessage(
        err.response?.data?.message || "Could not initiate M-Pesa payment."
      );
    }
  };

  // ── Poll for payment status ──
  useEffect(() => {
    if (paymentStatus !== "polling" || !checkoutRequestId) return;
    if (pollCount >= 12) {
      // 12 × 5s = 60s timeout
      setPaymentStatus("failed");
      setPaymentMessage("Payment timed out. Please try again.");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await checkPaymentStatus(checkoutRequestId);
        const status = res.data?.data?.status || res.data?.status;
        if (status === "completed" || status === "success") {
          setPaymentStatus("success");
          setPaymentMessage("Payment received! Your order is confirmed.");
          setStep(3);
        } else if (status === "failed" || status === "cancelled") {
          setPaymentStatus("failed");
          setPaymentMessage("Payment was cancelled or failed. You can retry.");
        } else {
          setPollCount((c) => c + 1);
        }
      } catch {
        setPollCount((c) => c + 1);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [paymentStatus, checkoutRequestId, pollCount]);

  // ── Stepper UI ──
  const Stepper = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "0",
        padding: "1.5rem 2rem",
        background: "#fff",
        borderBottom: "1px solid #e8ddd0",
      }}
    >
      {STEPS.map((label, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", gap: "0" }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: i <= step ? "#b45309" : "#e8ddd0",
                color: i <= step ? "#fff" : "#aaa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.85rem",
                transition: "background 0.3s",
              }}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                color: i === step ? "#b45309" : "#888",
                fontWeight: i === step ? 600 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              style={{
                width: "60px",
                height: "2px",
                background: i < step ? "#b45309" : "#e8ddd0",
                margin: "0 4px",
                marginBottom: "18px",
                transition: "background 0.3s",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <PageWrapper>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3ede6',
            borderTopColor: '#d97706',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </PageWrapper>
    );
  }

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
            Order Management
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '34px',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '8px'
          }}>
            Order Chicks
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.85)'
          }}>
            Select your chicks, confirm your order, and pay via M-Pesa
          </p>
        </div>
        <span style={{ fontSize: '80px', opacity: 0.9 }}>🐔</span>
      </div>

      <Stepper />

      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "2rem",
          background: "#f5f0ea",
          minHeight: "60vh",
        }}
      >
        {/* ── Step 0: Select Chick ── */}
        {step === 0 && (
          <div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#7c3d12",
                marginBottom: "1.5rem",
              }}
            >
              Choose a Chick Breed
            </h2>
            {chicks.length === 0 ? (
              <p style={{ color: "#888" }}>No chicks available at the moment.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1rem",
                }}
              >
                {chicks.map((chick) => (
                  <div
                    key={chick.id}
                    onClick={() => handleSelectChick(chick)}
                    style={{
                      background: "#fff",
                      borderRadius: "12px",
                      padding: "1.2rem",
                      cursor: "pointer",
                      border: "2px solid transparent",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#b45309";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "transparent";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
                      🐣
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "1.1rem",
                        color: "#1a1a1a",
                        marginBottom: "0.3rem",
                      }}
                    >
                      {chick.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#666",
                        marginBottom: "0.6rem",
                      }}
                    >
                      {chick.description}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <strong style={{ color: "#7c3d12", fontSize: "1rem" }}>
                        KSh {Number(chick.price_per_chick || chick.price).toLocaleString()} / chick
                      </strong>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "#15803d",
                          fontWeight: 500,
                        }}
                      >
                        {chick.available_stock || chick.stock} available
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 1: Order Details ── */}
        {step === 1 && selected && (
          <div>
            <button
              onClick={() => setStep(0)}
              style={{
                background: "none",
                border: "none",
                color: "#b45309",
                cursor: "pointer",
                fontSize: "0.9rem",
                marginBottom: "1rem",
                fontWeight: 600,
              }}
            >
              ← Back
            </button>

            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#7c3d12",
                marginBottom: "1.5rem",
              }}
            >
              Order Details
            </h2>

            {/* Selected chick summary */}
            <div
              style={{
                background: "#fff",
                borderRadius: "10px",
                padding: "1rem",
                marginBottom: "1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #e8ddd0",
              }}
            >
              <span style={{ fontWeight: 600, color: "#1a1a1a" }}>
                🐣 {selected.name}
              </span>
              <span style={{ color: "#7c3d12", fontWeight: 600 }}>
                KSh {Number(selected.price_per_chick || selected.price).toLocaleString()} each
              </span>
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>Quantity</label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={qtyBtnStyle}
                >
                  −
                </button>
                <span
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    minWidth: "40px",
                    textAlign: "center",
                  }}
                >
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  style={qtyBtnStyle}
                >
                  +
                </button>
              </div>
            </div>

            {/* Delivery type */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>Fulfilment</label>
              <div style={{ display: "flex", gap: "1rem" }}>
                {["delivery", "pickup"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setDeliveryType(type)}
                    style={{
                      flex: 1,
                      padding: "0.6rem",
                      borderRadius: "8px",
                      border: "2px solid",
                      borderColor:
                        deliveryType === type ? "#b45309" : "#d6c5b0",
                      background:
                        deliveryType === type ? "#fef3c7" : "#fff",
                      color: deliveryType === type ? "#92400e" : "#555",
                      cursor: "pointer",
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  >
                    {type === "delivery" ? "🚚 Delivery" : "🏪 Pickup"}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery address */}
            {deliveryType === "delivery" && (
              <div style={{ marginBottom: "1.2rem" }}>
                <label style={labelStyle}>Delivery Address</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Kiambu Road, Nairobi"
                  style={inputStyle}
                />
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requirements…"
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {/* Cost summary */}
            <div
              style={{
                background: "#fff",
                borderRadius: "10px",
                padding: "1rem 1.2rem",
                border: "1px solid #e8ddd0",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.4rem",
                  color: "#555",
                }}
              >
                <span>
                  {quantity} × KSh {Number(selected.price_per_chick || selected.price).toLocaleString()}
                </span>
                <span>KSh {totalCost.toLocaleString()}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: "#7c3d12",
                  borderTop: "1px solid #e8ddd0",
                  paddingTop: "0.4rem",
                }}
              >
                <span>Total</span>
                <span>KSh {totalCost.toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <p style={{ color: "#dc2626", marginBottom: "1rem", fontSize: "0.9rem" }}>
                {error}
              </p>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              style={primaryBtnStyle(submitting)}
            >
              {submitting ? "Placing Order…" : "Confirm Order & Proceed to Payment →"}
            </button>
          </div>
        )}

        {/* ── Step 2: M-Pesa Payment ── */}
        {step === 2 && (
          <div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#7c3d12",
                marginBottom: "0.5rem",
              }}
            >
              Pay via M-Pesa
            </h2>
            <p style={{ color: "#666", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              Order #{orderId} • Total:{" "}
              <strong style={{ color: "#7c3d12" }}>
                KSh {totalCost.toLocaleString()}
              </strong>
            </p>

            {/* M-Pesa logo area */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "1.5rem",
                marginBottom: "1.5rem",
                border: "1px solid #e8ddd0",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📱</div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: "#1a1a1a",
                  marginBottom: "0.3rem",
                }}
              >
                Lipa na M-Pesa
              </h3>
              <p style={{ color: "#666", fontSize: "0.85rem" }}>
                An STK Push will be sent to your phone. Enter your PIN to complete payment.
              </p>
            </div>

            {/* Phone input */}
            {paymentStatus === "idle" && (
              <>
                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={labelStyle}>M-Pesa Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0712345678"
                    style={inputStyle}
                  />
                  <p style={{ fontSize: "0.78rem", color: "#888", marginTop: "0.3rem" }}>
                    Safaricom numbers only (07xx or 01xx)
                  </p>
                </div>

                {error && (
                  <p style={{ color: "#dc2626", marginBottom: "1rem", fontSize: "0.9rem" }}>
                    {error}
                  </p>
                )}

                <button onClick={handleInitiatePayment} style={primaryBtnStyle(false)}>
                  Send STK Push →
                </button>
              </>
            )}

            {/* Pending / Polling state */}
            {(paymentStatus === "pending" || paymentStatus === "polling") && (
              <div style={statusBoxStyle("#fef3c7", "#92400e")}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⏳</div>
                <p style={{ fontWeight: 600 }}>{paymentMessage}</p>
                {paymentStatus === "polling" && (
                  <p style={{ fontSize: "0.82rem", marginTop: "0.4rem", opacity: 0.8 }}>
                    Checking… ({pollCount}/12)
                  </p>
                )}
              </div>
            )}

            {/* Failed state */}
            {paymentStatus === "failed" && (
              <div style={statusBoxStyle("#fee2e2", "#991b1b")}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>❌</div>
                <p style={{ fontWeight: 600, marginBottom: "1rem" }}>
                  {paymentMessage}
                </p>
                <button
                  onClick={() => {
                    setPaymentStatus("idle");
                    setPaymentMessage("");
                    setCheckoutRequestId(null);
                    setPollCount(0);
                    setError("");
                  }}
                  style={primaryBtnStyle(false)}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Success — auto-advances to step 3 */}
            {paymentStatus === "success" && (
              <div style={statusBoxStyle("#dcfce7", "#166534")}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✅</div>
                <p style={{ fontWeight: 600 }}>{paymentMessage}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Confirmation ── */}
        {step === 3 && (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.8rem",
                color: "#7c3d12",
                marginBottom: "0.5rem",
              }}
            >
              Order Confirmed!
            </h2>
            <p style={{ color: "#555", marginBottom: "0.5rem" }}>
              Your chick order #{orderId} has been placed and payment received.
            </p>
            <p style={{ color: "#888", fontSize: "0.88rem", marginBottom: "2rem" }}>
              Our team will get in touch with delivery/pickup details soon.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  setStep(0);
                  setSelected(null);
                  setOrderId(null);
                  setPaymentStatus("idle");
                  setCheckoutRequestId(null);
                  setPollCount(0);
                }}
                style={{
                  padding: "0.7rem 1.5rem",
                  borderRadius: "10px",
                  border: "2px solid #b45309",
                  background: "#fff",
                  color: "#b45309",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Place Another Order
              </button>
              <button
                onClick={() => navigate("/farmer/orders")}
                style={primaryBtnStyle(false)}
              >
                View My Orders
              </button>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

// ── Shared styles ──
const labelStyle = {
  display: "block",
  fontWeight: 600,
  fontSize: "0.88rem",
  color: "#5c3d1a",
  marginBottom: "0.4rem",
};

const inputStyle = {
  width: "100%",
  padding: "0.6rem 0.9rem",
  borderRadius: "8px",
  border: "1px solid #d6c5b0",
  fontSize: "0.9rem",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

const primaryBtnStyle = (disabled) => ({
  width: "100%",
  padding: "0.75rem",
  background: disabled ? "#ccc" : "#b45309",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontWeight: 700,
  fontSize: "1rem",
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "background 0.2s",
});

const qtyBtnStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "8px",
  border: "1px solid #d6c5b0",
  background: "#fff",
  fontSize: "1.2rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const statusBoxStyle = (bg, color) => ({
  background: bg,
  border: `1px solid ${color}33`,
  borderRadius: "12px",
  padding: "1.5rem",
  textAlign: "center",
  color,
});
