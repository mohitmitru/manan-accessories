import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("manan_cart") || "[]"));
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem("manan_wishlist") || "[]"));
  const [coupon, setCoupon] = useState(() => localStorage.getItem("manan_coupon") || "");

  const saveCart = (nextCart) => {
    setCart(nextCart);
    localStorage.setItem("manan_cart", JSON.stringify(nextCart));
  };

  const addToCart = (product, quantity = 1) => {
    if (Number(product.stock) <= 0) return;
    const safeQuantity = Math.min(Number(product.stock || 99), Math.max(1, Number(quantity) || 1));
    const existing = cart.find((item) => item._id === product._id);
    const nextCart = existing
      ? cart.map((item) => (
          item._id === product._id
            ? { ...item, quantity: Math.min(Number(item.stock || 99), item.quantity + safeQuantity) }
            : item
        ))
      : [...cart, { ...product, quantity: safeQuantity }];
    saveCart(nextCart);
  };

  const updateQuantity = (id, quantity) => {
    if (!Number.isFinite(quantity) || quantity < 1) {
      removeFromCart(id);
      return;
    }
    const nextCart = cart
      .map((item) => (item._id === id ? { ...item, quantity: Math.min(Number(item.stock || 99), Math.max(1, quantity)) } : item))
      .filter((item) => item.quantity > 0);
    saveCart(nextCart);
  };

  const removeFromCart = (id) => saveCart(cart.filter((item) => item._id !== id));
  const clearCart = () => saveCart([]);
  const toggleWishlist = (product) => {
    const exists = wishlist.some((item) => item._id === product._id);
    const nextWishlist = exists ? wishlist.filter((item) => item._id !== product._id) : [...wishlist, product];
    setWishlist(nextWishlist);
    localStorage.setItem("manan_wishlist", JSON.stringify(nextWishlist));
  };

  const applyCoupon = (code) => {
    const cleanCode = String(code || "").trim().toUpperCase();
    setCoupon(cleanCode);
    localStorage.setItem("manan_coupon", cleanCode);
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + (item.salePrice || item.price) * item.quantity, 0),
    [cart]
  );
  const discount = coupon === "MANAN10" ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal - discount);

  return (
    <CartContext.Provider value={{
      cart,
      wishlist,
      coupon,
      subtotal,
      discount,
      total,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      applyCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
