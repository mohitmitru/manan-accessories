import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, Smartphone, UploadCloud } from "lucide-react";
import { api, assetUrl } from "../services/api.js";
import { useCart } from "../context/CartContext.jsx";

export default function Checkout() {
  const { cart, subtotal, total, clearCart } = useCart();
  const savedBuyer = JSON.parse(localStorage.getItem("manan_buyer_profile") || "{}");
  const [payment, setPayment] = useState(null);
  const [form, setForm] = useState({
    name: savedBuyer.name || "",
    phone: savedBuyer.phone || "",
    email: savedBuyer.email || "",
    address: savedBuyer.address || "",
    state: savedBuyer.state || "",
    pincode: savedBuyer.pincode || "",
    paymentMethod: "UPI_PAY"
  });
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [processing, setProcessing] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(() => sessionStorage.getItem("manan_checkout_step") === "payment");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/payments").then((res) => setPayment(res.data));
  }, []);

  const openPaymentStep = () => {
    setError("");
    localStorage.setItem(
      "manan_buyer_profile",
      JSON.stringify({
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        state: form.state,
        pincode: form.pincode
      })
    );
    window.dispatchEvent(new Event("manan_buyer_profile_updated"));
    sessionStorage.setItem("manan_checkout_step", "payment");
    setPaymentOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCheckoutSubmit = (event) => {
    event.preventDefault();
    if (!paymentOpen) {
      openPaymentStep();
      return;
    }
    submitOrder();
  };

  const submitOrder = async () => {
    setError("");
    setProcessing(true);
    setPaymentStatus("Pending");

    try {
      if (!cart.length) throw new Error("Your cart is empty.");
      if (form.paymentMethod === "UPI_PAY" && !payment?.upiId) throw new Error("UPI ID is not added by owner.");
      if (form.paymentMethod === "UPI_QR" && !payment?.upiId && !payment?.qrCode) throw new Error("Payment QR is not added by owner.");
      if (!paymentScreenshot) throw new Error("Please upload payment screenshot.");

      const checkoutRes = await api.post("/payments/checkout", {
        customer: {
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: `${form.address}, ${form.state} - ${form.pincode}`
        },
        gateway: form.paymentMethod,
        couponCode: "",
        items: cart.map((item) => ({ product: item._id, quantity: item.quantity }))
      });

      const session = checkoutRes.data;
      setPaymentSession(session);

      const data = new FormData();
      data.append("verificationToken", session.verificationToken);
      data.append("paymentScreenshot", paymentScreenshot);
      const verifyRes = await api.post(`/payments/${session.paymentId}/screenshot`, data);

      setPaymentStatus(verifyRes.data.status);
      localStorage.setItem("manan_last_customer", JSON.stringify({ email: form.email, phone: form.phone }));
      sessionStorage.removeItem("manan_checkout_step");
      clearCart();
      navigate(`/order-success/${verifyRes.data.order._id}`, { state: { message: verifyRes.data.message } });
    } catch (err) {
      setPaymentStatus("Failed");
      setError(err.response?.data?.message || err.message || "Payment failed or was cancelled. Order was not created.");
    } finally {
      setProcessing(false);
    }
  };

  const upiLink = payment?.upiId
    ? `upi://pay?pa=${encodeURIComponent(payment.upiId)}&pn=${encodeURIComponent("Manan Accessories")}&am=${encodeURIComponent(total)}&cu=INR&tn=${encodeURIComponent(`Manan Accessories payment Rs ${total}`)}`
    : "";
  const upiQrImage = upiLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data=${encodeURIComponent(upiLink)}`
    : "";
  const isUpiPayment = form.paymentMethod === "UPI_QR";
  const paymentModes = [
    { id: "UPI_PAY", title: "UPI Pay", text: "Open UPI app with amount", icon: Smartphone },
    { id: "UPI_QR", title: "UPI QR", text: "Scan QR with exact amount", icon: QrCode }
  ];
  const changePaymentMode = (paymentMethod) => {
    setForm({ ...form, paymentMethod });
    setPaymentSession(null);
    setPaymentScreenshot(null);
    setPaymentStatus("Pending");
    setError("");
  };

  const openUpiApp = () => {
    if (!upiLink) return;
    window.location.href = upiLink;
  };

  return (
    <section className={`checkout ${paymentOpen ? "payment-open" : "delivery-only"}`}>
      <form className="panel checkout-form" onSubmit={handleCheckoutSubmit}>
        <div className="checkout-form-head">
          <div className="checkout-stage-tabs">
            <span className="done">1. Delivery</span>
            <span className={paymentOpen ? "active" : ""}>2. Payment</span>
          </div>
          <p className="eyebrow">{paymentOpen ? "Payment step" : "Delivery details"}</p>
          <h2>{paymentOpen ? "Complete Payment" : "Checkout"}</h2>
        </div>
        {error && <p className="error">{error}</p>}
        {!paymentOpen && <div className="checkout-field-grid">
          <label className="checkout-field">
            <span>Full name</span>
            <input required placeholder="Enter full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="checkout-field">
            <span>Phone number</span>
            <input required placeholder="Enter phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="checkout-field">
            <span>Email address</span>
            <input required type="email" placeholder="Enter email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="checkout-field">
            <span>State</span>
            <input required placeholder="Enter state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </label>
          <label className="checkout-field full">
            <span>Delivery address</span>
            <textarea required placeholder="House no, street, area, landmark" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
          <label className="checkout-field">
            <span>Pincode</span>
            <input required inputMode="numeric" placeholder="Enter pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          </label>
        </div>}
        {paymentOpen && (
          <div className="delivery-summary-card">
            <div>
              <span>Deliver to</span>
              <strong>{form.name}</strong>
              <p>{form.address}, {form.state} - {form.pincode}</p>
            </div>
            <button
              type="button"
              className="mini"
              onClick={() => {
                sessionStorage.removeItem("manan_checkout_step");
                setPaymentOpen(false);
              }}
            >
              Edit
            </button>
          </div>
        )}
        {paymentOpen && (
          <>
            <div className="mandatory-payment-note">
              Payment screenshot is mandatory.
            </div>
            {processing && (
              <div className="loading-screen">
                <span></span>
                <strong>Processing payment securely...</strong>
                <p>Please wait. Do not refresh this page.</p>
              </div>
            )}
            <div className="payment-combined-summary">
              <div className="payment-heading">
                <div>
                  <p className="eyebrow">Secure checkout</p>
                  <h2>Payment</h2>
                </div>
                <span className={`status ${paymentStatus.toLowerCase()}`}>{paymentStatus}</span>
              </div>
              <div className="payment-summary">
                <p>Total payable</p>
                <strong>Rs. {total}</strong>
              </div>
              {form.paymentMethod === "UPI_PAY" && upiLink && (
                <>
                  <button type="button" className="button pay-now" onClick={openUpiApp}>Pay with UPI App</button>
                  <p className="payment-safe-note">UPI ID is hidden. Your UPI app will open with Rs. {total}.</p>
                </>
              )}
              {form.paymentMethod === "UPI_PAY" && !payment?.upiId && (
                <p className="notice">UPI ID is not added by owner yet.</p>
              )}
              {isUpiPayment && !payment?.upiId && !payment?.qrCode && (
                <p className="notice">Payment QR is not added by owner yet.</p>
              )}
              {form.paymentMethod === "UPI_QR" && upiQrImage && (
                <div className="qr-frame">
                  <img className="qr" src={upiQrImage} alt="UPI QR code with amount" />
                  <strong>Pay Rs. {total}</strong>
                  <span>Scan QR. Amount will open automatically in your UPI app.</span>
                </div>
              )}
              {form.paymentMethod === "UPI_QR" && !upiQrImage && payment?.qrCode && (
                <div className="qr-frame">
                  <img className="qr" src={assetUrl(payment.qrCode)} alt="UPI QR code" />
                  <strong>Pay Rs. {total}</strong>
                  <span>Scan QR and enter this amount manually.</span>
                </div>
              )}
            </div>
            <div className="checkout-section-title">
              <div>
                <strong>Payment method</strong>
                <span>Choose one option and upload proof</span>
              </div>
              <small>Amount: Rs. {total}</small>
            </div>
            <div className="payment-mode-grid">
              {paymentModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    type="button"
                    key={mode.id}
                    className={`payment-mode ${form.paymentMethod === mode.id ? "active" : ""}`}
                    onClick={() => changePaymentMode(mode.id)}
                  >
                    <Icon size={20} />
                    <strong>{mode.title}</strong>
                    <span>{mode.text}</span>
                  </button>
                );
              })}
            </div>
            <label className="upload-label proof-upload">
              <span><UploadCloud size={18} /> Upload payment screenshot (required)</span>
              <input type="file" accept="image/*" onChange={(e) => setPaymentScreenshot(e.target.files[0])} />
              {paymentScreenshot && <small>{paymentScreenshot.name}</small>}
            </label>
            <div className="proof-upload">
              <strong>Order will not be placed without payment screenshot.</strong>
              <small>Owner will verify your screenshot, then your order status becomes Placed.</small>
            </div>
            <div className="payment-steps">
              <span>1. Pay Rs. {total}</span>
              <span>2. Upload payment screenshot</span>
              <span>3. Owner verifies proof</span>
            </div>
            {paymentSession && <p className="payment-ref">Transaction: {paymentSession.transactionId}</p>}
            <p>{payment?.instructions}</p>
          </>
        )}
        <button className="button" disabled={!cart.length || processing || (paymentOpen && !paymentScreenshot)}>
          {!paymentOpen ? "Continue to Payment" : processing ? "Processing Payment..." : "Submit Payment Proof"}
        </button>
      </form>

    </section>
  );
}
