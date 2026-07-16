import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { api } from "../services/api.js";
import { filterCachedProducts, getCachedProducts, saveCachedProducts } from "../services/productCache.js";

const categories = ["", "Sunglasses", "Bags", "Perfume", "Wallets", "Watches", "Fashion Accessories"];

export default function Products() {
  const [products, setProducts] = useState(() => getCachedProducts());
  const [sort, setSort] = useState("owner");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";

  useEffect(() => {
    let active = true;
    let retryTimer;

    const loadProducts = async (retry = true) => {
      try {
        const res = await api.get("/products", { params: { category, search } });
        if (!category && !search) saveCachedProducts(res.data);
        if (active) setProducts(res.data);
      } catch {
        const cachedProducts = filterCachedProducts(getCachedProducts(), { category, search });
        if (active) setProducts(cachedProducts);
        if (retry) retryTimer = setTimeout(() => loadProducts(false), 8000);
      }
    };

    loadProducts();
    return () => {
      active = false;
      clearTimeout(retryTimer);
    };
  }, [category, search]);

  const visibleProducts = products
    .filter((product) => !maxPrice || Number(product.salePrice || product.price) <= Number(maxPrice))
    .sort((a, b) => {
      if (sort === "price-low") return (a.salePrice || a.price) - (b.salePrice || b.price);
      if (sort === "price-high") return (b.salePrice || b.price) - (a.salePrice || a.price);
      if (sort === "discount") return Number(b.discount || 0) - Number(a.discount || 0);
      if (sort === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      return 0;
    });

  return (
    <section className="section">
      <div className="section-title">
        <div>
          <p className="eyebrow">Collection</p>
          <h2>Accessories for every look</h2>
        </div>
        <div className="filter-row">
          <select value={category} onChange={(e) => setSearchParams(e.target.value ? { category: e.target.value } : {})}>
            {categories.map((item) => (
              <option key={item} value={item}>{item || "All Categories"}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="owner">Owner Order</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price Low to High</option>
            <option value="price-high">Price High to Low</option>
            <option value="discount">Best Discount</option>
          </select>
          <input type="number" placeholder="Max price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
      </div>
      <div className="product-grid">
        {visibleProducts.map((product) => <ProductCard key={product._id} product={product} />)}
      </div>
      {!visibleProducts.length && <p className="empty">No products found.</p>}
    </section>
  );
}
