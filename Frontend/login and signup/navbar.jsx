import { useLocation } from "react-router-dom";
import { Bell, Search, User } from "lucide-react";
const pageTitles = {
  home: "Home",
  disasters: "Disasters",
  "incident-report": "Incident Report",
  map: "Live Map",
  "current-location": "Current Location",
};
export default function Navbar() {
  const location = useLocation();
  const currentRoute = location.pathname.split("/").pop() || "home";
  const title = pageTitles[currentRoute] || "Operations";
  return (
    <div className="navbar">
      <div className="navbar-left">
        <img src="/logo.jpeg" alt="Disaster Response logo" className="navbar-logo" />
        <div>
          <h2>{title}</h2>
          <p>Clean command interface for response coordination.</p>
        </div>
      </div>
      <div className="navbar-search">
        <Search size={18} />
        <input type="text" placeholder="Search incidents, teams, or locations" />
      </div>
      <div className="navbar-right">
        <div className="live-chip">
          <span className="dot"></span>
          LIVE
        </div>
        <button className="nav-icon" type="button">
          <Bell size={20} />
        </button>
        <div className="user-box">
          <div className="avatar">
            <User size={18} />
          </div>
          <div>
            <h4>Admin</h4>
            <small>Operations Head</small>
          </div>
        </div>
      </div>
    </div>
  );
}
