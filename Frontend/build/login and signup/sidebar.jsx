import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaExclamationTriangle,
  FaFileAlt,
  FaMapMarkedAlt,
  FaLocationArrow,
  FaSignOutAlt,
} from "react-icons/fa";
const menuItems = [
  { icon: <FaHome />, text: "Home", path: "home" },
  { icon: <FaExclamationTriangle />, text: "Disasters", path: "disasters" },
  { icon: <FaFileAlt />, text: "Incident Report", path: "incident-report" },
  { icon: <FaMapMarkedAlt />, text: "Map", path: "map" },
  { icon: <FaLocationArrow />, text: "Current Location", path: "current-location" },
];
export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="logo">
        <img src="/favicon.svg" alt="Disaster Response logo" className="logo-img" />
        <div>
          <strong>Disaster Response</strong>
          <p>Operations Center</p>
        </div>
      </div>
      <div className="menu-group">
        <span className="menu-label">Modules</span>
        <div className="menu">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={`/dashboard/${item.path}`}
              className={({ isActive }) =>
                isActive ? "menu-item active" : "menu-item"
              }
            >
              {item.icon}
              <span>{item.text}</span>
            </NavLink>
          ))}
        </div>
      </div>
      <button className="logout-btn" type="button" onClick={() => window.location.assign("/")}>
        <FaSignOutAlt />
        <span>Logout</span>
      </button>
    </div>
  );
}
