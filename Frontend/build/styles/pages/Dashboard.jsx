import { useEffect, useState } from "react";
import { apiRequest } from "../api.mjs";

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsData, alertsData] = await Promise.all([
          apiRequest("/api/status"),
          apiRequest("/api/alerts"),
        ]);
        setMetrics(metricsData.metrics || null);
        setAlerts(alertsData.alerts || []);
      } catch (error) {
        console.error(error);
      }
    }

    loadData();
  }, []);

  return (
    <div style={{ padding: "24px", color: "#fff" }}>
      <h2>Dashboard</h2>
      <p>Operations overview</p>
      {metrics ? (
        <ul>
          <li>Active disasters: {metrics.activeDisasters}</li>
          <li>Teams deployed: {metrics.teamsDeployed}</li>
          <li>Available resources: {metrics.availableResources}</li>
          <li>Open incidents: {metrics.incidentsOpen}</li>
        </ul>
      ) : (
        <p>Loading metrics...</p>
      )}

      <h3>Alerts</h3>
      {alerts.length ? (
        <ul>
          {alerts.map((alert) => (
            <li key={alert.id}>{alert.message}</li>
          ))}
        </ul>
      ) : (
        <p>No alerts yet.</p>
      )}
    </div>
  );
}
