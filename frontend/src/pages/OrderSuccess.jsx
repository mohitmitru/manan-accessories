import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { api } from "../services/api.js";

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then((res) => setOrder(res.data)).catch(() => setOrder(null));
  }, [id]);

  return (
    <section className="success-page">
      <CheckCircle2 size={64} />
      <h1>{order?.paymentStatus === "Submitted" ? "Payment proof submitted" : "Payment Successful! Your order has been placed."}</h1>
      <p>{order?.paymentStatus === "Submitted" ? "Owner will verify your screenshot and confirm the order." : "Your payment was verified securely and your order has been created."}</p>
      <p>Order ID: <strong>{id}</strong></p>
      {order && (
        <div className="success-box">
          <p>Total: <strong>Rs. {order.payableAmount || order.totalAmount}</strong></p>
          {order.discountAmount > 0 && <p>Discount: <strong>Rs. {order.discountAmount}</strong></p>}
          <p>Payment: <strong>{order.paymentStatus}</strong></p>
          <p>Status: <strong>{order.orderStatus}</strong></p>
        </div>
      )}
      <Link className="button secondary" to="/orders">View My Orders</Link>
      <Link className="button" to="/products">Continue Shopping</Link>
    </section>
  );
}
