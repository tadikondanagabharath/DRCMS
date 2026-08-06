import {
  AlertTriangle,
  Users,
  ShieldCheck,
  Package,
  CheckCircle,
} from "lucide-react";
const icons = {
  incidents: <AlertTriangle size={26} />,
  teams: <Users size={26} />,
  volunteers: <ShieldCheck size={26} />,
  resources: <Package size={26} />,
  solved: <CheckCircle size={26} />,
};
export default function StatCard({
  type,
  title,
  value,
  color,
  growth = "+12%",
}) {
  return (
    <div className="stat-card">
      <div className="stat-line" style={{ background: color }} />
      <div
        className="stat-icon"
        style={{
          color: color,
          border: `1px solid ${color}40`,
        }}
      >
        {icons[type]}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
      <div className="stat-footer">
        <span className="stat-growth">▲ {growth}</span>
        <span>Today</span>
      </div>
    </div>
  );
}
