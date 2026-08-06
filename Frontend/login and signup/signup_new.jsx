import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bulbOn, setBulbOn] = useState(false);
  const [bulbColor, setBulbColor] = useState("#555");
  const [bulbOpacity, setBulbOpacity] = useState(1);
  const [isPulling, setIsPulling] = useState(false);
  const flickerTimer = useRef(null);
  useEffect(() => {
    return () => {
      if (flickerTimer.current) {
        window.clearInterval(flickerTimer.current);
      }
    };
  }, []);
  const randomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue},100%,60%)`;
  };
  const toggleBulb = () => {
    setIsPulling(true);
    window.setTimeout(() => setIsPulling(false), 400);
    if (flickerTimer.current) {
      window.clearInterval(flickerTimer.current);
      flickerTimer.current = null;
    }
    if (!bulbOn) {
      const color = randomColor();
      setBulbColor(color);
      let count = 0;
      flickerTimer.current = window.setInterval(() => {
        setBulbOpacity((prev) => (prev === 1 ? 0.3 : 1));
        count += 1;
        if (count > 5) {
          if (flickerTimer.current) {
            window.clearInterval(flickerTimer.current);
            flickerTimer.current = null;
          }
          setBulbOpacity(1);
          setBulbOn(true);
        }
      }, 80);
    } else {
      setBulbOn(false);
      setBulbOpacity(1);
    }
  };
  const handleSignup = async (event) => {
    event.preventDefault();
    try {
      const res = await axios.post("http://localhost:5001/api/auth/signup", {
        name,
        email,
        password,
      });
      alert(res.data.message || "Account created");
      navigate("/");
    } catch (err) {
      if (err.response) {
        alert(err.response.data.error || err.response.data.message || "Signup failed");
      } else {
        alert("Server not running");
      }
    }
  };
  const lightStyle = {
    opacity: bulbOn ? 1 : 0,
    background: bulbOn ? `radial-gradient(circle, ${bulbColor}, transparent 70%)` : "transparent",
  };
  const glowStyle = {
    opacity: bulbOn ? 0.35 : 0,
    background: bulbOn ? `radial-gradient(circle, ${bulbColor}, transparent 80%)` : "transparent",
  };
  const bulbStyle = {
    background: bulbOn ? bulbColor : "#555",
    boxShadow: bulbOn
      ? `0 0 30px ${bulbColor}, 0 0 70px ${bulbColor}, 0 0 150px ${bulbColor}, 0 0 300px ${bulbColor}`
      : "none",
    opacity: bulbOpacity,
  };
  return (
    <div className="auth-page">
      <div className="auth-glow" style={glowStyle} />
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-wire" />
          <div className="auth-bulb" style={bulbStyle} />
          <div className={`auth-string ${isPulling ? "pull" : ""}`} onClick={toggleBulb}>
            <div className="knob" />
          </div>
          <div className="auth-hint">Pull the cord to power the signup panel</div>
          <div className="auth-light" style={lightStyle} />
        </div>
        <div className="auth-right">
          <div className={`auth-card ${bulbOn ? "show" : ""}`}>
            <h2>Signup</h2>
            <form onSubmit={handleSignup}>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">Signup</button>
            </form>
            <div className="auth-switch">
              Already have an account? <Link to="/">Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Signup;
