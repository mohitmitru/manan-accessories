import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Heart, Search, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Navbar() {
  const { cart, wishlist } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [buyer, setBuyer] = useState(() => JSON.parse(localStorage.getItem("manan_buyer_profile") || "{}"));
  const [showBuyer, setShowBuyer] = useState(false);
  const buyerMenuRef = useRef(null);
  const isCheckoutPage = location.pathname === "/checkout";

  useEffect(() => {
    const syncBuyer = () => setBuyer(JSON.parse(localStorage.getItem("manan_buyer_profile") || "{}"));
    window.addEventListener("manan_buyer_profile_updated", syncBuyer);
    window.addEventListener("storage", syncBuyer);
    return () => {
      window.removeEventListener("manan_buyer_profile_updated", syncBuyer);
      window.removeEventListener("storage", syncBuyer);
    };
  }, []);

  useEffect(() => {
    const closeBuyerMenu = (event) => {
      if (!buyerMenuRef.current?.contains(event.target)) {
        setShowBuyer(false);
      }
    };

    document.addEventListener("pointerdown", closeBuyerMenu);
    return () => document.removeEventListener("pointerdown", closeBuyerMenu);
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = event.currentTarget.search.value.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
  };

  return (
    <header className={`site-header ${isCheckoutPage ? "checkout-header" : ""}`}>
      <Link className="brand" to="/">Manan Accessories</Link>
      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/products">Products</NavLink>
        <NavLink to="/orders">My Orders</NavLink>
      </nav>
      <form className="search" onSubmit={handleSearch}>
        <Search size={18} />
        <input name="search" placeholder="Search" />
      </form>
      {buyer.name && (
        <div className="buyer-profile-wrap" ref={buyerMenuRef}>
          <button className="buyer-profile-pill" type="button" onClick={() => setShowBuyer((value) => !value)}>
            <span>Hi, {buyer.name}</span>
            <ChevronDown size={18} className={showBuyer ? "open" : ""} />
          </button>
          {showBuyer && (
            <div className="buyer-profile-menu">
              <label>Name</label>
              <strong>{buyer.name}</strong>
              <label>Address</label>
              <p>{buyer.address || "Address not added"}</p>
              <label>State</label>
              <p>{buyer.state || "State not added"}</p>
              <label>Pincode</label>
              <p>{buyer.pincode || "Pincode not added"}</p>
              <button type="button" onClick={() => window.dispatchEvent(new Event("manan_open_buyer_profile"))}>
                Change details
              </button>
            </div>
          )}
        </div>
      )}
      <div className="nav-actions">
        <ThemeToggle compact />
        <Link className={`icon-button ${location.pathname === "/wishlist" ? "active" : ""}`} to="/wishlist" aria-label="Wishlist">
          <Heart size={20} />
          {wishlist.length > 0 && <span>{wishlist.length}</span>}
        </Link>
        <Link className="icon-button" to="/cart" aria-label="Cart">
          <ShoppingBag size={20} />
          {cart.length > 0 && <span>{cart.length}</span>}
        </Link>
      </div>
    </header>
  );
}
