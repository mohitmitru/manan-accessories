import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api.js";

export default function AdminLogin() {
  const loginVersion = "owner-login-light-v2";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [beamDegrees, setBeamDegrees] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const moveBeam = (event) => {
    const wrapper = event.currentTarget.querySelector(".owner-password-beam");
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const mouseX = rect.right + rect.width / 2;
    const mouseY = rect.top + rect.height / 2;
    const radians = Math.atan2(mouseX - event.pageX, mouseY - event.pageY);
    setBeamDegrees((radians * (20 / Math.PI) * -1) - 350);
  };

  const login = async (event) => {
    event.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("manan_admin_token", res.data.token);
      navigate("/admin");
    } catch (err) {
      if (!err.response) {
        setError("Backend or MongoDB is not running. Please start the server and database first.");
        return;
      }
      setError(err.response.data?.message || "Invalid owner login details");
    }
  };

  return (
    <main className={`admin-login ${showPassword ? "show-password" : ""}`} data-login-version={loginVersion} onMouseMove={moveBeam}>
      <form className="panel" onSubmit={login}>
        <p className="eyebrow">Owner Portal</p>
        <h1>Manan Accessories</h1>
        {error && <p className="error">{error}</p>}
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Owner email" autoComplete="username" />
        <div className="owner-password-wrap">
          <input
            required
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="owner-eye-button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <span className="owner-eye" />
          </button>
          <span className="owner-password-beam" style={{ transform: `translateY(-50%) rotate(${beamDegrees}deg)` }} />
        </div>
        <button className="button">Login</button>
      </form>
    </main>
  );
}
