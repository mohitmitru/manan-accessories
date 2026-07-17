import { useEffect, useState } from "react";

const STORAGE_KEY = "manan_buyer_profile";
const emptyBuyer = { name: "", phone: "", email: "", address: "", state: "", pincode: "" };

export default function BuyerInfoPopup() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY));
  const [form, setForm] = useState(() => ({
    ...emptyBuyer,
    ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
  }));

  useEffect(() => {
    const openPopup = () => {
      setForm({ ...emptyBuyer, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") });
      setVisible(true);
    };

    window.addEventListener("manan_open_buyer_profile", openPopup);
    return () => window.removeEventListener("manan_open_buyer_profile", openPopup);
  }, []);

  if (!visible) return null;

  const saveBuyer = (event) => {
    event.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    window.dispatchEvent(new Event("manan_buyer_profile_updated"));
    setVisible(false);
  };

  return (
    <div className="buyer-popup-backdrop">
      <form className="buyer-popup panel" onSubmit={saveBuyer}>
        <p className="eyebrow">Welcome to Manan Accessories</p>
        <h2>Enter your details</h2>
        <label className="buyer-popup-field">
          <span>Name</span>
          <input
            required
            placeholder="Your name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <label className="buyer-popup-field">
          <span>Phone</span>
          <input
            required
            type="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </label>
        <label className="buyer-popup-field full">
          <span>Address</span>
          <textarea
            required
            placeholder="House no, street, area"
            value={form.address}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
          />
        </label>
        <div className="buyer-popup-row">
          <label className="buyer-popup-field">
            <span>State</span>
            <input
              required
              placeholder="State"
              value={form.state}
              onChange={(event) => setForm({ ...form, state: event.target.value })}
            />
          </label>
          <label className="buyer-popup-field">
            <span>Pincode</span>
            <input
              required
              inputMode="numeric"
              placeholder="Pincode"
              value={form.pincode}
              onChange={(event) => setForm({ ...form, pincode: event.target.value })}
            />
          </label>
        </div>
        <button className="button">Continue Shopping</button>
      </form>
    </div>
  );
}
