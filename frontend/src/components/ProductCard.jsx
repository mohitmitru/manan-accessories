import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Heart, ShoppingCart, Zap } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { assetUrl, imageFallback } from "../services/api.js";

export default function ProductCard({ product, openCartOnAdd = false }) {
  const [imageIndex, setImageIndex] = useState(0);
  const touchStartX = useRef(null);
  const swipedImage = useRef(false);
  const { addToCart, toggleWishlist, wishlist } = useCart();
  const navigate = useNavigate();

  const liked = wishlist.some((item) => item._id === product._id);
  const stockCount = Number(product.stock) || 0;
  const outOfStock = stockCount <= 0;
  const lowStock = stockCount > 0 && stockCount <= 10;
  const images = (product.images || []).filter(Boolean);
  const activeImage = images[imageIndex] || images[0] || "";

  useEffect(() => {
    setImageIndex(0);
  }, [product._id]);

  useEffect(() => {
    if (images.length <= 1) return undefined;

    const timer = setInterval(() => {
      setImageIndex((current) => (current + 1) % images.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [images.length]);

  const buyNow = () => {
    addToCart(product, 1);
    navigate("/checkout");
  };

  const addAndOpenCart = () => {
    addToCart(product, 1);
    if (openCartOnAdd) navigate("/cart");
  };

  const moveImage = (direction) => {
    if (images.length <= 1) return;
    setImageIndex((current) => (current + direction + images.length) % images.length);
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    swipedImage.current = false;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const distance = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(distance) < 40) return;

    swipedImage.current = true;
    moveImage(distance < 0 ? 1 : -1);
  };

  const handleMediaClick = (event) => {
    if (!swipedImage.current) return;

    event.preventDefault();
    swipedImage.current = false;
  };

  return (
    <article className="product-card">
      <Link
        className="product-media"
        to={`/products/${product._id}`}
        onClick={handleMediaClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          className="product-main-image"
          src={assetUrl(activeImage)}
          alt={product.name}
          onError={imageFallback}
        />

        {product.discount > 0 && (
          <span className="discount-badge">{product.discount}% off</span>
        )}

        {images.length > 1 && (
          <div className="product-slider-dots">
            {images.map((image, index) => (
              <span key={`${image}-${index}`} className={index === imageIndex ? "active" : ""} />
            ))}
          </div>
        )}
      </Link>

      <div className="product-card-body">
        <div className="product-meta">
          <p className="category">{product.category}</p>
          <button
            className={`heart-button ${liked ? "active" : ""}`}
            onClick={() => toggleWishlist(product)}
            aria-label="Wishlist"
          >
            <Heart size={18} />
          </button>
        </div>

        <h3>{product.name}</h3>

        <div className="price-row">
          <strong>Rs. {product.salePrice || product.price}</strong>
          {product.discount > 0 && <span>Rs. {product.price}</span>}
        </div>

        {outOfStock && <p className="stock">Out of stock</p>}
        {lowStock && <p className="stock low-stock">Only {stockCount} left</p>}

        <div className="product-actions">
          <button disabled={outOfStock} onClick={addAndOpenCart} className="button secondary">
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
