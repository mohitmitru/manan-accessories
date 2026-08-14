import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShoppingCart, Zap } from "lucide-react";
import { api, assetUrl, imageFallback } from "../services/api.js";
import { useCart } from "../context/CartContext.jsx";
import QuantityControl from "../components/QuantityControl.jsx";

export default function ProductDetails() {
  const [product, setProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const touchStartX = useRef(null);
  const { id } = useParams();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => {
      setProduct(res.data);
      setSelectedImageIndex(0);
    });
  }, [id]);

  const images = (product?.images || []).filter(Boolean);

  useEffect(() => {
    if (images.length <= 1) return undefined;
    const timer = setInterval(() => {
      setSelectedImageIndex((current) => (current + 1) % images.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [images.length]);

  if (!product) return <p className="section">Loading product...</p>;
  const stockCount = Number(product.stock) || 0;
  const outOfStock = stockCount <= 0;
  const lowStock = stockCount > 0 && stockCount <= 10;
  const maxQuantity = Math.max(1, Number(product.stock) || 1);
  const selectedImage = images[selectedImageIndex] || images[0] || "";

  const moveImage = (direction) => {
    if (images.length <= 1) return;
    setSelectedImageIndex((current) => (current + direction + images.length) % images.length);
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const distance = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 40) return;
    moveImage(distance < 0 ? 1 : -1);
  };

  const buyNow = () => {
    if (outOfStock) return;
    addToCart(product, quantity);
    navigate("/checkout");
  };

  const addAndOpenCart = () => {
    if (outOfStock) return;
    addToCart(product, quantity);
    navigate("/cart");
  };

  return (
    <section className="details">
      <div className="details-image">
        <div
          className="details-slider"
          style={{ "--details-image": `url("${assetUrl(selectedImage)}")` }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img src={assetUrl(selectedImage)} alt={product.name} onError={imageFallback} />
          {images.length > 1 && (
            <div className="details-slider-dots">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={index === selectedImageIndex ? "active" : ""}
                  onClick={() => setSelectedImageIndex(index)}
                  aria-label={`Show image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="product-thumbs">
            {images.map((image, index) => (
              <button
                type="button"
                key={image}
                className={selectedImageIndex === index ? "active" : ""}
                onClick={() => setSelectedImageIndex(index)}
              >
                <img src={assetUrl(image)} alt={product.name} onError={imageFallback} />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="details-copy">
        <p className="category">{product.category}</p>
        <h1>{product.name}</h1>
        <div className="price-row large">
          <strong>Rs. {product.salePrice || product.price}</strong>
          {product.discount > 0 && <span>Rs. {product.price}</span>}
        </div>
        <p>{product.description}</p>
        {outOfStock && <p className="stock">Out of stock</p>}
        {lowStock && <p className="stock low-stock">Only {stockCount} left</p>}
        <QuantityControl
          label="Quantity"
          value={quantity}
          max={maxQuantity}
          disabled={outOfStock}
          onChange={setQuantity}
          className="details-quantity"
        />
        <div className="action-row">
          <button className="button secondary" disabled={outOfStock} onClick={addAndOpenCart}><ShoppingCart size={18} /> Add to Cart</button>
          <button className="button" disabled={outOfStock} onClick={buyNow}><Zap size={18} /> Buy Now</button>
        </div>
      </div>
    </section>
  );
}
