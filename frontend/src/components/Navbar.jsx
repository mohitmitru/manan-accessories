import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, Search, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar() {
  const { cart, wishlist } = useCart();
  const navigate = useNavigate();

  const handleSearch = (event) => {
    event.preventDefault();
    const query = event.currentTarget.search.value.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
  };

  return (
    <header className="site-header">
      <Link className="brand" to="/">Manan Accessories</Link>
      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/products">Products</NavLink>
        <NavLink to="/orders">My Orders</NavLink>
      </nav>
      <form className="search" onSubmit={handleSearch}>
        <Search size={18} />
        <input name="search" placeholder="Search accessories" />
      </form>
      <div className="nav-actions">
        <Link className="icon-button" to="/wishlist" aria-label="Wishlist">
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
