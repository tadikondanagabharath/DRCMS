export default {
  title: 'Current Location',
  html: `
    <section class="location-page glass glass-raise">
      <div class="location-summary">
        <h3>Team Location Tracker</h3>
        <p>Current field team positions and active coordination points.</p>
      </div>
      <div class="location-grid">
        <div class="location-panel glass">
          <div id="google-map-container" class="google-map-container" style="min-height:420px; width:100%; border-radius:18px; overflow:hidden; border:1px solid rgba(255,255,255,0.08);"></div>
          <div id="location-map" class="location-map" style="min-height:420px; width:100%; display:none;"></div>
          <div class="location-details glass">
            <div class="location-status-text" id="location-status">Waiting for current location...</div>
            <button type="button" class="location-refresh-button">Refresh location</button>
          </div>
        </div>
        <div class="location-sidebar">
          <div class="your-location-box glass" id="your-location-box">
            <h4>Your Location</h4>
            <div><strong>Latitude:</strong> <span id="your-lat">—</span></div>
            <div><strong>Longitude:</strong> <span id="your-lng">—</span></div>
            <div><strong>Accuracy (m):</strong> <span id="your-accuracy">—</span></div>
            <div><strong>Last updated:</strong> <span id="your-updated">—</span></div>
          </div>
          <h4>Field teams</h4>
          <ul class="location-list">
            <li class="glass">
              <strong>Team Alpha</strong>
              <span>Sector 2 - Command post</span>
            </li>
            <li class="glass">
              <strong>Team Bravo</strong>
              <span>Sector 5 - Supply drop</span>
            </li>
            <li class="glass">
              <strong>Team Delta</strong>
              <span>Sector 7 - Evacuation route</span>
            </li>
            <li class="glass">
              <strong>Team Echo</strong>
              <span>Sector 3 - Medical aid</span>
            </li>
          </ul>
          <div class="location-stat">
            <div class="glass">
              <span>Signal Coverage</span>
              <strong id="metric-signalCoverage">0%</strong>
            </div>
            <div class="glass">
              <span>Open Channels</span>
              <strong id="metric-openChannels">0</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
};

