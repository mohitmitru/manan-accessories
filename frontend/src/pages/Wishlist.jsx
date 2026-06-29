import ProductCard from "../components/ProductCard.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Wishlist() {
  const { wishlist } = useCart();

  return (
    <section className="section">
      <div className="section-title">
        <div>
          <p className="eyebrow">Saved items</p>
          <h2>Your Wishlist</h2>
        </div>
      </div>
      <div className="product-grid">
        {wishlist.map((product) => <ProductCard key={product._id} product={product} />)}
      </div>
      {!wishlist.length && <p className="empty">Your wishlist is empty.</p>}
    </section>
  );
}
