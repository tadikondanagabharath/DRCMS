import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
const lampColor = "#ffdd6a";
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialOn = Boolean(location.state?.email || location.state?.password);
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState(location.state?.password || "");
  const [isOn, setIsOn] = useState(initialOn);
  const [isPulling, setIsPulling] = useState(false);
  const [bulbColor, setBulbColor] = useState(lampColor);
  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'Login failed');
      alert(data.message || 'Logged in');
      navigate('/dashboard');
    } catch (err) {
      alert(err.message || 'Server not running');
    }
  };
  useEffect(() => {
    if (location.state?.email || location.state?.password) {
      setEmail(location.state.email || "");
      setPassword(location.state.password || "");
      setIsOn(true);
      setBulbColor(lampColor);
    }
  }, [location.state]);
  const toggleLamp = () => {
    setIsPulling(true);
    setTimeout(() => setIsPulling(false), 400);
    setIsOn((prev) => !prev);
  };
  const lightStyle = {
    background: isOn
      ? `radial-gradient(circle at 50% 35%, ${lampColor} 0%, transparent 35%)`
      : "transparent",
    opacity: isOn ? 1 : 0,
  };
  const pageGlowStyle = {
    background: isOn
      ? `radial-gradient(circle at 45% 35%, ${lampColor} 0%, transparent 35%, rgba(9, 7, 15, 0.95) 100%)`
      : "transparent",
    opacity: isOn ? 1 : 0,
  };
  return (
    <div className="login-page" data-on={isOn}>
      <div className="login-header">
        <img src="/logo.jpeg" alt="Disaster Response logo" className="login-logo" />
        <div className="login-brand">
          <strong>Disaster Response</strong>
          <span>Coordination System</span>
        </div>
      </div>
      <div className="pageGlow" />
      <div className="light" style={{ background: isOn ? `radial-gradient(circle, ${bulbColor}, transparent 70%)` : "transparent", opacity: isOn ? 0.6 : 0 }} />
      <div className="login-layout">
        <div className="lamp-wrapper">
          <svg className="lamp-svg" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
            <ellipse className="inner-glow" cx="100" cy="110" rx="60" ry="30" />
            <rect className="lamp-base" x="92" y="100" width="16" height="160" rx="8" />
            <rect className="lamp-base" x="60" y="250" width="80" height="12" rx="6" />
            <g className="pull-cord" onClick={toggleLamp}>
              <line className="cord-line" x1="130" y1="110" x2="130" y2="180" />
              <circle className="cord-bead" cx="130" cy="190" r="6" />
              <circle className="cord-hit" cx="130" cy="190" r="25" fill="transparent" />
            </g>
            <path className="lamp-shade" d="M30 110 C 30 50, 170 50, 170 110 C 170 125, 30 125, 30 110 Z" />
          </svg>
        </div>
        <div className={`login-form ${isOn ? "active" : ""}`}>
          <h2>Welcome</h2>
          <form onSubmit={handleLogin} autoComplete="off">
            <input type="text" name="fake-username" autoComplete="username" style={{ display: "none" }} />
            <input type="password" name="fake-password" autoComplete="new-password" style={{ display: "none" }} />
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="login-email"
                type="email"
                autoComplete="off"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="login-password"
                type="password"
                autoComplete="off"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="login-btn" type="submit">Sign In</button>
          </form>
          <div className="switch">
            Don&apos;t have an account? <Link to="/signup">Signup</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
