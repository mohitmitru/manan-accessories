import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, QrCode, Smartphone, UploadCloud } from "lucide-react";
import { api, assetUrl } from "../services/api.js";
import { useCart } from "../context/CartContext.jsx";

export default function Checkout() {
  const { cart, coupon, subtotal, discount, total, clearCart } = useCart();
  const [payment, setPayment] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", paymentMethod: "UPI_QR" });
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/payments").then((res) => setPayment(res.data));
  }, []);

  const submitOrder = async (event) => {
    event.preventDefault();
    setError("");
    setProcessing(true);
    setPaymentStatus("Pending");

    try {
      if (!cart.length) throw new Error("Your cart is empty.");
      if (form.paymentMethod === "UPI_PAY" && !payment?.upiId) throw new Error("UPI ID is not added by owner.");
      if (form.paymentMethod === "UPI_QR" && !payment?.qrCode) throw new Error("Payment QR is not added by owner.");
      if (form.paymentMethod === "PAYMENT_LINK" && !payment?.paymentLink) throw new Error("Payment link is not available.");
      if (!paymentScreenshot) throw new Error("Please upload payment screenshot.");

      const checkoutRes = await api.post("/payments/checkout", {
        customer: { name: form.name, phone: form.phone, email: form.email, address: form.address },
        gateway: form.paymentMethod,
        couponCode: coupon,
        items: cart.map((item) => ({ product: item._id, quantity: item.quantity }))
      });

      const session = checkoutRes.data;
      setPaymentSession(session);

      if (form.paymentMethod === "PAYMENT_LINK" && payment?.paymentLink) {
        window.open(payment.paymentLink, "_blank", "noopener,noreferrer");
      }

      const data = new FormData();
      data.append("verificationToken", session.verificationToken);
      data.append("paymentScreenshot", paymentScreenshot);
      const verifyRes = await api.post(`/payments/${session.paymentId}/screenshot`, data);

      setPaymentStatus(verifyRes.data.status);
      localStorage.setItem("manan_last_customer", JSON.stringify({ email: form.email, phone: form.phone }));
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
  const isUpiPayment = form.paymentMethod === "UPI_QR";
  const paymentModes = [
    { id: "UPI_PAY", title: "UPI Pay", text: "Open UPI app with amount", icon: Smartphone },
    { id: "UPI_QR", title: "UPI QR", text: "Scan QR with exact amount", icon: QrCode },
    { id: "PAYMENT_LINK", title: "Payment Link", text: "Pay through owner link", icon: CreditCard },
    { id: "SCREENSHOT", title: "Screenshot Proof", text: "Upload payment screenshot", icon: UploadCloud }
  ];
  const changePaymentMode = (paymentMethod) => {
    setForm({ ...form, paymentMethod });
    setPaymentSession(null);
    setPaymentScreenshot(null);
    setPaymentStatus("Pending");
    setError("");
  };

  return (
    <section className="checkout">
      <form className="panel" onSubmit={submitOrder}>
        <h2>Checkout</h2>
        {error && <p className="error">{error}</p>}
        <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input required type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <textarea required placeholder="Full delivery address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
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
        <button className="button" disabled={!cart.length || processing || !paymentScreenshot}>{processing ? "Processing Payment..." : "Submit Payment Proof"}</button>
      </form>

      <aside className="panel payment-panel">
        {processing && (
          <div className="loading-screen">
            <span></span>
            <strong>Processing payment securely...</strong>
            <p>Please wait. Do not refresh this page.</p>
          </div>
        )}
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
        {discount > 0 && (
          <div className="payment-detail">
            <span>Coupon applied</span>
            <strong>{coupon} saved Rs. {discount}</strong>
          </div>
        )}
        <div className="payment-detail">
          <span>Order value</span>
          <strong>Subtotal Rs. {subtotal}</strong>
        </div>
        {form.paymentMethod === "UPI_PAY" && upiLink && <a className="button pay-now" href={upiLink}>Pay with UPI App</a>}
        {form.paymentMethod === "UPI_PAY" && !payment?.upiId && (
          <p className="notice">UPI ID is not added by owner yet.</p>
        )}
        {isUpiPayment && !payment?.qrCode && (
          <p className="notice">Payment QR is not added by owner yet.</p>
        )}
        {form.paymentMethod === "UPI_QR" && payment?.qrCode && (
          <div className="qr-frame">
            <img className="qr" src={assetUrl(payment.qrCode)} alt="UPI QR code" />
            <span>Scan and pay Rs. {total}</span>
          </div>
        )}
        {form.paymentMethod === "PAYMENT_LINK" && payment?.paymentLink && (
          <a className="button pay-now" href={payment.paymentLink} target="_blank" rel="noreferrer">Preview Payment Link</a>
        )}
        {form.paymentMethod === "PAYMENT_LINK" && !payment?.paymentLink && (
          <p className="notice">Payment link is not added by owner yet.</p>
        )}
        {!payment?.qrCode && !payment?.paymentLink && (
          <p className="notice">Owner has not added payment details yet. Please contact the store.</p>
        )}
        <div className="payment-steps">
          <span>1. Pay Rs. {total}</span>
          <span>2. Upload payment screenshot</span>
          <span>3. Owner verifies proof, then order is placed</span>
        </div>
        {paymentSession && <p className="payment-ref">Transaction: {paymentSession.transactionId}</p>}
        <p>{payment?.instructions}</p>
      </aside>
    </section>
  );
}
