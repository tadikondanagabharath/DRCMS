export default {
  title: 'Disaster Map',
  html: `
    <section class="map-page glass glass-raise">
      <div class="map-intro">
        <h3>Active Disaster Zones</h3>
        <p>Review the current hazard footprint, impact severity, and field team assignments.</p>
      </div>
      <div class="map-grid">
        <div class="map-card glass">
          <div class="map-placeholder">Interactive Zone Footprint</div>
        </div>
        <aside class="map-sidebar">
          <div class="impact-block glass">
            <strong>Flood Zone A</strong>
            <span class="status-pill status-active">Severe</span>
          </div>
          <div class="impact-block glass">
            <strong>Coastal Storm</strong>
            <span class="status-pill status-active">Moderate</span>
          </div>
          <div class="impact-block glass">
            <strong>Wildfire Perimeter</strong>
            <span class="status-pill status-active">High</span>
          </div>
          <div class="impact-block glass">
            <strong>Seismic Epicenter</strong>
            <span class="status-pill status-active">Critical</span>
          </div>
        </aside>
      </div>
    </section>
  `,
};

