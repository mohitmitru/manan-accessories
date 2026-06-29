import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ShoppingCart, Zap } from "lucide-react";
import { api, assetUrl } from "../services/api.js";
import { useCart } from "../context/CartContext.jsx";

export default function ProductDetails() {
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const { id } = useParams();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => {
      setProduct(res.data);
      setSelectedImage(res.data.images?.[0] || "");
    });
  }, [id]);

  if (!product) return <p className="section">Loading product...</p>;
  const outOfStock = Number(product.stock) <= 0;

  const buyNow = () => {
    if (outOfStock) return;
    addToCart(product);
    navigate("/checkout");
  };

  const addAndOpenCart = () => {
    if (outOfStock) return;
    addToCart(product);
    navigate("/cart");
  };

  return (
    <section className="details">
      <div className="details-image">
        <img src={assetUrl(selectedImage || product.images?.[0])} alt={product.name} />
        {product.images?.length > 1 && (
          <div className="product-thumbs">
            {product.images.map((image) => (
              <button
                type="button"
                key={image}
                className={selectedImage === image ? "active" : ""}
                onClick={() => setSelectedImage(image)}
              >
                <img src={assetUrl(image)} alt={product.name} />
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
        <p className={!outOfStock ? "stock good" : "stock"}>{!outOfStock ? `${product.stock} in stock` : "Out of stock"}</p>
        <div className="action-row">
          <button className="button secondary" disabled={outOfStock} onClick={addAndOpenCart}><ShoppingCart size={18} /> Add to Cart</button>
          <button className="button" disabled={outOfStock} onClick={buyNow}><Zap size={18} /> Buy Now</button>
        </div>
        <Link className="button secondary back-products" to="/products">Back to Products</Link>
      </div>
    </section>
  );
}
