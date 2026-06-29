import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import ProductCard from "../components/ProductCard.jsx";
import { api, assetUrl } from "../services/api.js";

const categories = ["Sunglasses", "Bags", "Perfume", "Wallets", "Watches", "Fashion Accessories"];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data.slice(0, 8))).catch(() => setProducts([]));
  }, []);

  const heroProducts = products.filter((product) => product.images?.length);

  useEffect(() => {
    if (heroProducts.length <= 1) return undefined;
    const timer = setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroProducts.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [heroProducts.length]);

  const heroProduct = heroProducts[heroIndex] || products[0];
  const heroImage = heroProduct?.images?.[0];
  const heroStyle = heroImage
    ? {
        background: `linear-gradient(90deg, rgba(16, 24, 22, .86), rgba(16, 24, 22, .34)), url("${assetUrl(heroImage)}") center/cover`
      }
    : undefined;

  return (
    <>
      <section className="hero" style={heroStyle}>
        <div className="hero-content">
          <p className="eyebrow">{heroProduct?.category || "Premium daily style"}</p>
          <h1>Manan Accessories</h1>
          <p>{heroProduct ? heroProduct.name : "Curated fashion essentials with elegant finishing, practical pricing and a boutique shopping feel."}</p>
          <div className="hero-actions">
            <Link className="button" to="/products">Shop Collection <ArrowRight size={18} /></Link>
            <span>Fresh drops for everyday style</span>
          </div>
          {heroProducts.length > 1 && (
            <div className="hero-dots">
              {heroProducts.map((product, index) => (
                <button
                  type="button"
                  key={product._id}
                  className={index === heroIndex ? "active" : ""}
                  onClick={() => setHeroIndex(index)}
                  aria-label={`Show ${product.name}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="hero-float">
          <span>New</span>
          <strong>{heroProduct?.category || "Accessories"}</strong>
          <small>{heroProduct?.name || "Premium collection"}</small>
        </div>
      </section>

      <section className="feature-strip">
        <span><Sparkles size={20} /> Premium picks</span>
        <span><Truck size={20} /> Easy ordering</span>
        <span><ShieldCheck size={20} /> Owner verified payments</span>
      </section>

      <section className="section home-products">
        <div className="section-title">
          <div>
            <p className="eyebrow">Latest arrivals</p>
            <h2>Featured Products</h2>
          </div>
          <Link to="/products">View all</Link>
        </div>
        <div className="product-grid compact-products">
          {products.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
        {!products.length && <p className="empty">Products will appear here after owner adds them.</p>}
      </section>

      <section className="section">
        <div className="section-title">
          <h2>Shop by Category</h2>
          <Link to="/products">View all</Link>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link key={category} to={`/products?category=${encodeURIComponent(category)}`}>
              {category}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
