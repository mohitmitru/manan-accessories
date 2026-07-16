import { useEffect, useState } from "react";
import {
  CreditCard,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Package,
  QrCode,
  ReceiptText,
  Save,
  Smartphone,
  Trash2,
  WalletCards
} from "lucide-react";
import { api, assetUrl } from "../../services/api.js";

const emptyProduct = {
  name: "",
  price: "",
  mrp: "",
  category: "Sunglasses",
  stock: "",
  description: "",
  heroImage: "",
  featured: false
};

const orderFilterOptions = [
  "All",
  "Submitted",
  "Payment Review",
  "Paid",
  "Failed",
  "Placed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Refunded"
];

const adminViewOptions = ["dashboard", "products", "nameListing", "orders", "payments"];

export default function AdminDashboard() {
  const savedAdminView = localStorage.getItem("manan_admin_view");
  const savedOrderFilter = localStorage.getItem("manan_order_filter");

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payment, setPayment] = useState({ upiId: "", paymentLink: "", instructions: "" });
  const [product, setProduct] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [images, setImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState(
    orderFilterOptions.includes(savedOrderFilter) ? savedOrderFilter : "All"
  );
  const [orderSavingId, setOrderSavingId] = useState("");
  const [orderNotice, setOrderNotice] = useState("");
  const [orderError, setOrderError] = useState("");
  const [activeView, setActiveView] = useState(
    adminViewOptions.includes(savedAdminView) ? savedAdminView : "dashboard"
  );

  const loadData = async () => {
    const [productRes, orderRes, paymentRes] = await Promise.allSettled([
      api.get("/products"),
      api.get("/orders"),
      api.get("/payments")
    ]);

    if (productRes.status === "fulfilled") setProducts(productRes.value.data);
    if (orderRes.status === "fulfilled") setOrders(orderRes.value.data);
    if (paymentRes.status === "fulfilled") setPayment(paymentRes.value.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem("manan_admin_view", activeView);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem("manan_order_filter", orderFilter);
  }, [orderFilter]);

  useEffect(() => {
    const previews = images.map((image) => ({
      name: image.name,
      url: URL.createObjectURL(image)
    }));

    setNewImagePreviews(previews);

    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [images]);

  const logout = () => {
    localStorage.removeItem("manan_admin_token");
    localStorage.removeItem("manan_admin_view");
    localStorage.removeItem("manan_order_filter");
    window.location.href = "/admin/login";
  };

  const saveProduct = async (event) => {
    event.preventDefault();

    const data = new FormData();
    const sellingPrice = Number(product.price || 0);
    const mrp = Number(product.mrp || product.price || 0);
    const discount = mrp > sellingPrice
      ? Math.min(95, Math.round(((mrp - sellingPrice) / mrp) * 100))
      : 0;

    const productPayload = {
      ...product,
      price: mrp || sellingPrice,
      discount
    };

    delete productPayload.mrp;

    Object.entries(productPayload).forEach(([key, value]) => data.append(key, value));
    data.append("existingImages", JSON.stringify(existingImages));
    images.forEach((image) => data.append("images", image));

    if (editingId) await api.put(`/products/${editingId}`, data);
    else await api.post("/products", data);

    setProduct(emptyProduct);
    setEditingId(null);
    setImages([]);
    setExistingImages([]);
    loadData();
  };

  const editProduct = (item) => {
    setEditingId(item._id);
    setProduct({
      name: item.name,
      price:
        item.salePrice ||
        Math.round(Number(item.price || 0) - (Number(item.price || 0) * Number(item.discount || 0)) / 100),
      mrp: item.price,
      category: item.category,
      stock: item.stock,
      description: item.description,
      heroImage: item.heroImage || item.images?.[0] || "",
      featured: item.featured
    });
    setExistingImages(item.images || []);
    setImages([]);
    setActiveView("products");
  };

  const removeExistingImage = (image) => {
    setExistingImages(existingImages.filter((item) => item !== image));
    if (product.heroImage === image) setProduct({ ...product, heroImage: "" });
  };

  const removeNewImage = (index) => {
    setImages(images.filter((_, imageIndex) => imageIndex !== index));
  };

  const deleteProduct = async (item) => {
    const shouldDelete = window.confirm(`Delete "${item.name}" product?`);
    if (!shouldDelete) return;

    await api.delete(`/products/${item._id}`);
    loadData();
  };

  const toggleHeroProduct = async (item) => {
    const data = new FormData();
    data.append("name", item.name);
    data.append("price", item.price);
    data.append("discount", item.discount || 0);
    data.append("category", item.category);
    data.append("stock", item.stock || 0);
    data.append("description", item.description || item.name);
    data.append("featured", String(!item.featured));
    data.append("heroImage", item.heroImage || item.images?.[0] || "");
    data.append("existingImages", JSON.stringify(item.images || []));

    await api.put(`/products/${item._id}`, data);
    loadData();
  };

  const updatePayment = async (event) => {
    event.preventDefault();
    setPaymentSaving(true);
    setPaymentNotice("");
    setPaymentError("");

    try {
      const data = new FormData();
      data.append("upiId", payment.upiId || "");
      data.append("paymentLink", payment.paymentLink || "");
      data.append("instructions", payment.instructions || "");
      if (qrCode) data.append("qrCode", qrCode);

      const res = await api.put("/payments", data);
      setPayment(res.data);
      setQrCode(null);
      setPaymentNotice("Payment settings updated.");
      await loadData();
    } catch (error) {
      setPaymentError(error.response?.data?.message || "Payment settings update failed.");
    } finally {
      setPaymentSaving(false);
    }
  };

  const removeQrCode = async () => {
    setPaymentSaving(true);
    setPaymentNotice("");
    setPaymentError("");

    try {
      const data = new FormData();
      data.append("upiId", payment.upiId || "");
      data.append("paymentLink", payment.paymentLink || "");
      data.append("instructions", payment.instructions || "");
      data.append("removeQr", "true");

      const res = await api.put("/payments", data);
      setPayment(res.data);
      setQrCode(null);
      setPaymentNotice("QR code removed.");
      await loadData();
    } catch (error) {
      setPaymentError(error.response?.data?.message || "QR remove failed.");
    } finally {
      setPaymentSaving(false);
    }
  };

  const clearPaymentField = async (field) => {
    setPaymentSaving(true);
    setPaymentNotice("");
    setPaymentError("");

    try {
      const nextPayment = { ...payment, [field]: "" };
      const data = new FormData();
      data.append("upiId", nextPayment.upiId || "");
      data.append("paymentLink", nextPayment.paymentLink || "");
      data.append("instructions", nextPayment.instructions || "");

      const res = await api.put("/payments", data);
      setPayment(res.data);
      setPaymentNotice(field === "upiId" ? "UPI ID removed." : "Payment link removed.");
      await loadData();
    } catch (error) {
      setPaymentError(error.response?.data?.message || "Payment settings update failed.");
    } finally {
      setPaymentSaving(false);
    }
  };

  const updateOrder = async (id, patch) => {
    setOrderSavingId(id);
    setOrderNotice("");
    setOrderError("");

    try {
      const res = await api.patch(`/orders/${id}/status`, patch);
      setOrders((current) => current.map((order) => (order._id === id ? res.data : order)));
      setOrderNotice("Order updated.");
      await loadData();
    } catch (error) {
      setOrderError(error.response?.data?.message || "Order update failed.");
    } finally {
      setOrderSavingId("");
    }
  };

  const markOrderPaid = (id) => updateOrder(id, { paymentStatus: "Paid", orderStatus: "Placed" });
  const markPaymentFailed = (id) => updateOrder(id, { paymentStatus: "Failed", orderStatus: "Cancelled" });
  const markPaymentReview = (id) => updateOrder(id, { paymentStatus: "Submitted", orderStatus: "Payment Review" });

  const cancelOrder = (order) =>
    updateOrder(order._id, {
      paymentStatus: order.paymentStatus === "Paid" ? "Paid" : "Failed",
      orderStatus: "Cancelled"
    });

  const deleteOrder = async (id) => {
    await api.delete(`/orders/${id}`);
    loadData();
  };

  const stats = {
    revenue: orders.reduce((sum, order) => sum + Number(order.payableAmount || order.totalAmount || 0), 0),
    pendingPayments: orders.filter((order) => order.paymentStatus !== "Paid").length,
    lowStock: products.filter((item) => Number(item.stock) <= 3).length
  };

  const visibleProducts = products.filter((item) =>
    item.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const visibleOrders = orders.filter((order) => {
    if (orderFilter === "All") return true;

    return (
      String(order.paymentStatus || "").toLowerCase() === orderFilter.toLowerCase() ||
      String(order.orderStatus || "").toLowerCase() === orderFilter.toLowerCase()
    );
  });

  const paymentMethodLabel = (method = "") =>
    ({
      UPI_QR: "UPI QR",
      UPI_PAY: "UPI Pay",
      PAYMENT_LINK: "Payment Link",
      SCREENSHOT: "Screenshot Proof"
    }[method] || method.replaceAll("_", " "));

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <h2>Manan Accessories</h2>

        <div className="admin-menu">
          <button className={activeView === "dashboard" ? "active" : ""} onClick={() => setActiveView("dashboard")}>
            <LayoutDashboard size={18} /> Dashboard
          </button>

          <button className={activeView === "products" ? "active" : ""} onClick={() => setActiveView("products")}>
            <Package size={18} /> Products
          </button>

          <button
            className={activeView === "nameListing" ? "active" : ""}
            onClick={() => setActiveView("nameListing")}
          >
            <ListOrdered size={18} /> Listing
          </button>

          <button className={activeView === "orders" ? "active" : ""} onClick={() => setActiveView("orders")}>
            <ReceiptText size={18} /> Orders
          </button>

          <button className={activeView === "payments" ? "active" : ""} onClick={() => setActiveView("payments")}>
            <WalletCards size={18} /> Payments
          </button>
        </div>

        <button className="button secondary" onClick={logout}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <section className="admin-main">
        {activeView === "dashboard" && (
          <div className="stats-grid">
            <div className="stat-card">
              <span>Total Revenue</span>
              <strong>Rs. {stats.revenue}</strong>
            </div>

            <div className="stat-card">
              <span>Total Orders</span>
              <strong>{orders.length}</strong>
            </div>

            <div className="stat-card">
              <span>Pending Payments</span>
              <strong>{stats.pendingPayments}</strong>
            </div>

            <div className="stat-card">
              <span>Low Stock</span>
              <strong>{stats.lowStock}</strong>
            </div>
          </div>
        )}

        {activeView === "products" && (
          <div className="admin-grid single-panel">
            <form className="panel" onSubmit={saveProduct}>
              <h2>{editingId ? "Edit Product" : "Add Product"}</h2>

              <input
                required
                placeholder="Product name"
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
              />

              <input
                required
                type="number"
                placeholder="Price"
                value={product.price}
                onChange={(e) => setProduct({ ...product, price: e.target.value })}
              />

              <input
                type="number"
                placeholder="MRP"
                value={product.mrp}
                onChange={(e) => setProduct({ ...product, mrp: e.target.value })}
              />

              <select value={product.category} onChange={(e) => setProduct({ ...product, category: e.target.value })}>
                {["Sunglasses", "Bags", "Perfume", "Wallets", "Watches", "Fashion Accessories"].map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Stock"
                value={product.stock}
                onChange={(e) => setProduct({ ...product, stock: e.target.value })}
              />

              <textarea
                required
                placeholder="Description"
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
              />

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={product.featured}
                  onChange={(e) => setProduct({ ...product, featured: e.target.checked })}
                />
                <span>Show this product in home image slider</span>
              </label>

              {editingId && existingImages.length > 0 && (
                <p className="helper-text">Select one saved image below for the home slider.</p>
              )}

              <label className="upload-label product-image-upload">
                Product images
                <span className="file-picker-row">
                  <span className="file-button">Choose Files</span>
                  <span className="file-status">
                    {images.length ? `${images.length} image(s) selected` : "No file chosen"}
                  </span>
                </span>
                <input
                  className="hidden-file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImages(Array.from(e.target.files || []))}
                />
                <small>{editingId ? "Upload more images or remove existing images below." : "You can select multiple images."}</small>
              </label>

              {editingId && existingImages.length > 0 && (
                <div className="image-manager">
                  {existingImages.map((image) => (
                    <div className={`image-chip ${product.heroImage === image ? "selected-hero-image" : ""}`} key={image}>
                      <img src={assetUrl(image)} alt="Product preview" />

                      <button
                        type="button"
                        className={`mini ${product.heroImage === image ? "success" : ""}`}
                        onClick={() => setProduct({ ...product, heroImage: image, featured: true })}
                      >
                        {product.heroImage === image ? "Hero Image" : "Use in Hero"}
                      </button>

                      <button type="button" className="mini danger" onClick={() => removeExistingImage(image)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {newImagePreviews.length > 0 && (
                <>
                  <p className="payment-ref">{newImagePreviews.length} new image(s) selected</p>

                  <div className="image-manager new-image-preview">
                    {newImagePreviews.map((image, index) => (
                      <div className="image-chip" key={`${image.name}-${index}`}>
                        <img src={image.url} alt={image.name} />
                        <button type="button" className="mini danger" onClick={() => removeNewImage(index)}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <button className="button">
                <Save size={18} /> Save Product
              </button>
            </form>
          </div>
        )}

        {activeView === "payments" && (
          <div className="admin-grid single-panel">
            <form className="panel payment-admin" onSubmit={updatePayment}>
              <div className="payment-heading">
                <div>
                  <p className="eyebrow">Store collection</p>
                  <h2>Payment Settings</h2>
                </div>
              </div>

              <div className="payment-admin-status">
                <span className={payment.upiId ? "ready" : ""}>
                  <Smartphone size={17} /> UPI Pay {payment.upiId ? "Ready" : "Missing"}
                </span>

                <span className={payment.qrCode ? "ready" : ""}>
                  <QrCode size={17} /> QR {payment.qrCode ? "Ready" : "Missing"}
                </span>

                <span className={payment.paymentLink ? "ready" : ""}>
                  <CreditCard size={17} /> Link {payment.paymentLink ? "Ready" : "Missing"}
                </span>
              </div>

              {paymentNotice && <p className="notice success-note">{paymentNotice}</p>}
              {paymentError && <p className="error">{paymentError}</p>}

              <label className="upload-label">
                UPI ID for Pay button
                <input
                  placeholder="example@upi"
                  value={payment.upiId || ""}
                  onChange={(e) => setPayment({ ...payment, upiId: e.target.value })}
                />
              </label>

              {payment.upiId && (
                <button type="button" className="mini danger inline-action" onClick={() => clearPaymentField("upiId")} disabled={paymentSaving}>
                  Remove UPI ID
                </button>
              )}

              <label className="upload-label">
                Payment link
                <input
                  placeholder="https://..."
                  value={payment.paymentLink || ""}
                  onChange={(e) => setPayment({ ...payment, paymentLink: e.target.value })}
                />
              </label>

              {payment.paymentLink && (
                <button
                  type="button"
                  className="mini danger inline-action"
                  onClick={() => clearPaymentField("paymentLink")}
                  disabled={paymentSaving}
                >
                  Remove Payment Link
                </button>
              )}

              <label className="upload-label">
                Payment instructions
                <textarea
                  placeholder="Payment instructions"
                  value={payment.instructions || ""}
                  onChange={(e) => setPayment({ ...payment, instructions: e.target.value })}
                />
              </label>

              {payment.qrCode && (
                <div className="qr-frame admin-qr">
                  <img className="qr small" src={assetUrl(payment.qrCode)} alt="Current QR code" />
                  <span>Current QR code</span>
                  <button type="button" className="mini danger" onClick={removeQrCode} disabled={paymentSaving}>
                    Remove QR
                  </button>
                </div>
              )}

              <label className="upload-label proof-upload">
                Upload QR code
                <input type="file" accept="image/*" onChange={(e) => setQrCode(e.target.files[0])} />
                {qrCode && <small>{qrCode.name}</small>}
              </label>

              <button className="button" disabled={paymentSaving}>
                {paymentSaving ? "Updating..." : "Update Payment"}
              </button>
            </form>
          </div>
        )}

        {activeView === "nameListing" && (
          <section className="panel">
            <div className="section-title compact">
              <h2>Listing</h2>
              <input
                placeholder="Search products"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Hero Slider</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleProducts.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <img className="thumb" src={assetUrl(item.images?.[0])} alt={item.name} />
                      </td>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>Rs. {item.salePrice || item.price}</td>
                      <td>{item.stock}</td>
                      <td>
                        <button className={`mini ${item.featured ? "success" : ""}`} onClick={() => toggleHeroProduct(item)}>
                          {item.featured ? "Showing" : "Show"}
                        </button>
                      </td>
                      <td>
                        <button className="mini" onClick={() => editProduct(item)}>
                          Edit
                        </button>
                        <button className="mini danger" onClick={() => deleteProduct(item)}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!visibleProducts.length && <p className="empty">No products found.</p>}
            </div>
          </section>
        )}

        {activeView === "orders" && (
          <section className="panel">
            <div className="section-title compact">
              <h2>Orders</h2>
              <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)}>
                {orderFilterOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>

            {orderNotice && <p className="notice success-note">{orderNotice}</p>}
            {orderError && <p className="error">{orderError}</p>}

            <div className="orders">
              {!visibleOrders.length && <p className="empty">No orders found for this filter.</p>}

              {visibleOrders.map((order) => (
                <article className="order-card" key={order._id}>
                  <div className="owner-order-head">
                    <div>
                      <span>Order #{order._id.slice(-8)}</span>
                      <h3>Rs. {order.payableAmount || order.totalAmount}</h3>
                    </div>
                    <small>{new Date(order.createdAt).toLocaleString()}</small>
                  </div>

                  <div className="owner-order-grid">
                    <div className="owner-order-block">
                      <span>Customer</span>
                      <strong>{order.customer.name}</strong>
                      <p>{order.customer.phone}</p>
                      <p>{order.customer.email}</p>
                      <p>{order.customer.address}</p>
                    </div>

                    <div className="owner-order-block">
                      <span>Products</span>
                      <p>{order.items.map((item) => `${item.name} x ${item.quantity}`).join(", ")}</p>
                      {order.discountAmount > 0 && <p>Coupon {order.couponCode}: Rs. {order.discountAmount} off</p>}
                    </div>

                    <div className="owner-order-block">
                      <span>Payment</span>
                      <strong>{paymentMethodLabel(order.paymentMethod)}</strong>
                      {order.paymentScreenshot && (
                        <a className="payment-ref" href={assetUrl(order.paymentScreenshot)} target="_blank" rel="noreferrer">
                          View screenshot
                        </a>
                      )}

                      <div className="order-status-row">
                        <span className={`status ${String(order.paymentStatus).toLowerCase()}`}>{order.paymentStatus}</span>
                        <span className={`status ${String(order.orderStatus).toLowerCase().replaceAll(" ", "-")}`}>
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>

                    <div className="owner-order-block">
                      <span>Status Update</span>

                      <select
                        disabled={orderSavingId === order._id}
                        value={order.paymentStatus}
                        onChange={(e) =>
                          updateOrder(order._id, {
                            paymentStatus: e.target.value,
                            orderStatus: order.orderStatus
                          })
                        }
                      >
                        {["Submitted", "Paid", "Failed", "Refunded"].map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>

                      <select
                        disabled={orderSavingId === order._id}
                        value={order.orderStatus}
                        onChange={(e) =>
                          updateOrder(order._id, {
                            paymentStatus: order.paymentStatus,
                            orderStatus: e.target.value
                          })
                        }
                      >
                        {["Payment Review", "Placed", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="order-action-row">
                    <button className="mini" disabled={orderSavingId === order._id} onClick={() => markPaymentReview(order._id)}>
                      Payment Review
                    </button>

                    <button className="mini success" disabled={orderSavingId === order._id} onClick={() => markOrderPaid(order._id)}>
                      Paid
                    </button>

                    <button className="mini warning" disabled={orderSavingId === order._id} onClick={() => markPaymentFailed(order._id)}>
                      Failed
                    </button>

                    <button className="mini danger" disabled={orderSavingId === order._id} onClick={() => cancelOrder(order)}>
                      Cancel Order
                    </button>

                    <button className="mini danger" onClick={() => deleteOrder(order._id)}>
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
