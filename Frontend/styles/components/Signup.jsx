import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api.mjs";

const lampColor = "#ffdd6a";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bulbOn, setBulbOn] = useState(true);
  const [isPulling, setIsPulling] = useState(false);

  const handleSignup = async (event) => {
    event.preventDefault();
    try {
      const data = await apiRequest("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      alert(data.message || "Account created");
      navigate("/", { state: { email, password } });
    } catch (err) {
      alert(err.message || "Server not running");
    }
  };

  const toggleBulb = () => {
    setIsPulling(true);
    setTimeout(() => setIsPulling(false), 400);
    setBulbOn((prev) => !prev);
  };

  return (
    <div className="login-page" data-on={bulbOn}>
      <div className="login-header">
        <img src="/logo.jpeg" alt="Disaster Response logo" className="login-logo" />
        <div className="login-brand">
          <strong>Disaster Response</strong>
          <span>Coordination System</span>
        </div>
      </div>
      <div className="pageGlow" style={{ background: bulbOn ? `radial-gradient(circle at 45% 35%, ${lampColor} 0%, transparent 35%, rgba(9, 7, 15, 0.95) 100%)` : "transparent", opacity: bulbOn ? 1 : 0 }} />
      <div className="light" style={{ background: bulbOn ? `radial-gradient(circle at 50% 35%, ${lampColor} 0%, transparent 35%)` : "transparent", opacity: bulbOn ? 1 : 0 }} />
      <div className="login-layout">
        <div className="lamp-wrapper">
          <svg className="lamp-svg" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
            <ellipse className="inner-glow" cx="100" cy="110" rx="60" ry="30" />
            <rect className="lamp-base" x="92" y="100" width="16" height="160" rx="8" />
            <rect className="lamp-base" x="60" y="250" width="80" height="12" rx="6" />
            <g className="pull-cord" onClick={toggleBulb}>
              <line className="cord-line" x1="130" y1="110" x2="130" y2="180" />
              <circle className="cord-bead" cx="130" cy="190" r="6" />
              <circle className="cord-hit" cx="130" cy="190" r="25" fill="transparent" />
            </g>
            <path className="lamp-shade" d="M30 110 C 30 50, 170 50, 170 110 C 170 125, 30 125, 30 110 Z" />
          </svg>
        </div>
        <div className={`login-form ${bulbOn ? "active" : ""}`}>
          <h2>Signup</h2>
          <form onSubmit={handleSignup} autoComplete="off">
            <input type="text" name="fake-signup-username" autoComplete="username" style={{ display: "none" }} />
            <input type="password" name="fake-signup-password" autoComplete="new-password" style={{ display: "none" }} />
            <div className="form-group">
              <label htmlFor="signup-name">Name</label>
              <input id="signup-name" name="signup-name" type="text" autoComplete="name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="signup-email">Email</label>
              <input id="signup-email" name="signup-email" type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input id="signup-password" name="signup-password" type="password" autoComplete="new-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="login-btn" type="submit">Create Account</button>
          </form>
          <div className="switch">
            Already have an account? <Link to="/">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
