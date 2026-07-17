import { useEffect, useState } from "react";

const STORAGE_KEY = "manan_buyer_profile";
const emptyBuyer = { name: "", phone: "", email: "", address: "", state: "", pincode: "" };
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

const onlyDigits = (value, maxLength) => value.replace(/\D/g, "").slice(0, maxLength);

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
    const selectedState = INDIAN_STATES.find((state) => state.toLowerCase() === form.state.trim().toLowerCase());
    if (!selectedState) {
      alert("Please select a valid Indian state from the list.");
      return;
    }
    if (form.phone.length !== 10) {
      alert("Please enter a valid 10 digit phone number.");
      return;
    }
    if (form.pincode.length !== 6) {
      alert("Please enter a valid 6 digit pincode.");
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...form, state: selectedState }));
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
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            placeholder="Phone number"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: onlyDigits(event.target.value, 10) })}
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
              list="indian-states"
              placeholder="Search/select state"
              value={form.state}
              onChange={(event) => setForm({ ...form, state: event.target.value })}
            />
            <datalist id="indian-states">
              {INDIAN_STATES.map((state) => <option value={state} key={state} />)}
            </datalist>
          </label>
          <label className="buyer-popup-field">
            <span>Pincode</span>
            <input
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="Pincode"
              value={form.pincode}
              onChange={(event) => setForm({ ...form, pincode: onlyDigits(event.target.value, 6) })}
            />
          </label>
        </div>
        <button className="button">Continue Shopping</button>
      </form>
    </div>
  );
}
