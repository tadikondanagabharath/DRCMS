export default function ResourceChart() {
  const resources = [
    { name: "Ambulances", value: 85, color: "#3B82F6" },
    { name: "Rescue Teams", value: 72, color: "#22C55E" },
    { name: "Medical Kits", value: 94, color: "#F59E0B" },
    { name: "Shelters", value: 60, color: "#EF4444" },
  ];
  return (
    <div className="chart-card">
      <h3>Resource Availability</h3>
      {resources.map((item) => (
        <div key={item.name} className="resource-item">
          <div className="resource-header">
            <span>{item.name}</span>
            <span>{item.value}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${item.value}%`,
                background: item.color,
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}
