import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { api } from "../services/api.js";

export default function OrderHistory() {
  const savedCustomer = JSON.parse(localStorage.getItem("manan_last_customer") || "{}");
  const [form, setForm] = useState({ email: savedCustomer.email || "", phone: savedCustomer.phone || "" });
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadOrders = useCallback(async (event, silent = false) => {
    event?.preventDefault();
    if (!form.email || !form.phone) return;
    if (!silent) setLoading(true);
    setMessage("");
    try {
      const res = await api.get("/orders/customer", { params: form });
      setOrders(res.data);
      if (!res.data.length) setMessage("No active orders found for this email and phone.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load orders.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    if (form.email && form.phone) loadOrders();
  }, []);

  useEffect(() => {
    if (!form.email || !form.phone) return undefined;
    const timer = setInterval(() => loadOrders(undefined, true), 10000);
    return () => clearInterval(timer);
  }, [form.email, form.phone, loadOrders]);

  return (
    <section className="section">
      <div className="section-title">
        <div>
          <p className="eyebrow">Order history</p>
          <h2>Track your payments and orders</h2>
        </div>
      </div>

      <form className="order-search panel" onSubmit={loadOrders}>
        <input required type="email" placeholder="Email used in checkout" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required placeholder="Phone used in checkout" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <button className="button" disabled={loading}>
          {loading ? <RefreshCw size={18} /> : <Search size={18} />}
          {loading ? "Refreshing..." : "Find Orders"}
        </button>
      </form>

      {message && <p className="empty">{message}</p>}

      <div className="orders customer-orders">
        {orders.map((order) => (
          <article className="order-card customer-order" key={order._id}>
            <div className="buyer-order-main">
              <div className="buyer-order-head">
                <div>
                  <span>Order #{order._id.slice(-8)}</span>
                  <h3>Rs. {order.payableAmount || order.totalAmount}</h3>
                </div>
                <small>{new Date(order.createdAt).toLocaleString()}</small>
              </div>
              <div className="buyer-order-items">
                <span>Items</span>
                <p>{order.items.map((item) => `${item.name} x ${item.quantity}`).join(", ")}</p>
                {order.discountAmount > 0 && <small>Coupon {order.couponCode} saved Rs. {order.discountAmount}</small>}
              </div>
            </div>
            <div className="order-total-box">
              <span>Order Amount</span>
              <strong>Rs. {order.payableAmount || order.totalAmount}</strong>
              <small>{order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} item(s)</small>
            </div>
            <div className="buyer-order-status">
              <span className={`status ${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus}</span>
              <span className={`status ${String(order.orderStatus).toLowerCase().replaceAll(" ", "-")}`}>{order.orderStatus}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

