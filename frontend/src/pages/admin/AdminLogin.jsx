import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api.js";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
    <main className="admin-login">
      <form className="panel" onSubmit={login}>
        <p className="eyebrow">Owner Portal</p>
        <h1>Manan Accessories</h1>

        {error && <p className="error">{error}</p>}

        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Owner email"
          autoComplete="username"
        />

        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
        />

        <button className="button">Login</button>
      </form>
    </main>
  );
}
