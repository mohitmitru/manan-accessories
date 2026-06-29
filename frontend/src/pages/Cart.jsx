import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { assetUrl } from "../services/api.js";

export default function Cart() {
  const { cart, subtotal, discount, total, coupon, applyCoupon, updateQuantity, removeFromCart } = useCart();

  return (
    <section className="section">
      <div className="section-title">
        <h2>Your Cart</h2>
        <strong>Rs. {total}</strong>
      </div>
      <div className="cart-list">
        {cart.map((item) => (
          <div className="cart-item" key={item._id}>
            <img src={assetUrl(item.images?.[0])} alt={item.name} />
            <div>
              <h3>{item.name}</h3>
              <p>Rs. {item.salePrice || item.price}</p>
            </div>
            <input type="number" min="1" max={item.stock || 99} value={item.quantity} onChange={(e) => updateQuantity(item._id, Number(e.target.value))} />
            <button className="icon-button" onClick={() => removeFromCart(item._id)}><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
      {cart.length ? (
        <div className="cart-summary panel">
          <label className="upload-label">Coupon code
            <input placeholder="Try MANAN10" value={coupon} onChange={(e) => applyCoupon(e.target.value)} />
          </label>
          <p>Subtotal: <strong>Rs. {subtotal}</strong></p>
          <p>Discount: <strong>Rs. {discount}</strong></p>
          <p>Total: <strong>Rs. {total}</strong></p>
          {total > 0 && <Link className="button checkout-button" to="/checkout">Continue to Checkout</Link>}
        </div>
      ) : <p className="empty">Your cart is empty.</p>}
    </section>
  );
}
