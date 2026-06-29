import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Zap } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { assetUrl } from "../services/api.js";

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, wishlist } = useCart();
  const navigate = useNavigate();
  const liked = wishlist.some((item) => item._id === product._id);
  const outOfStock = Number(product.stock) <= 0;

  const buyNow = () => {
    addToCart(product);
    navigate("/checkout");
  };

  return (
    <article className="product-card">
      <Link className="product-media" to={`/products/${product._id}`}>
        <img src={assetUrl(product.images?.[0])} alt={product.name} />
        {product.discount > 0 && <span className="discount-badge">{product.discount}% off</span>}
      </Link>
      <div className="product-card-body">
        <div className="product-meta">
          <p className="category">{product.category}</p>
          <button className={`heart-button ${liked ? "active" : ""}`} onClick={() => toggleWishlist(product)} aria-label="Wishlist">
            <Heart size={18} />
          </button>
        </div>
        <h3>{product.name}</h3>
        <div className="price-row">
          <strong>Rs. {product.salePrice || product.price}</strong>
          {product.discount > 0 && <span>Rs. {product.price}</span>}
        </div>
        <p className={outOfStock ? "stock" : "stock good"}>{outOfStock ? "Out of stock" : `${product.stock} in stock`}</p>
        <div className="product-actions">
          <button disabled={outOfStock} onClick={() => addToCart(product)} className="button secondary">
            <ShoppingCart size={18} /> {outOfStock ? "Unavailable" : "Add"}
          </button>
          <button disabled={outOfStock} onClick={buyNow} className="button">
            <Zap size={18} /> Buy
          </button>
        </div>
      </div>
    </article>
  );
}
