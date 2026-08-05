export default {
  title: 'Dashboard',
  html: `
    <section class="dashboard-grid">
      <div class="dashboard-panel glass glass-raise">
        <h3>Response Overview</h3>
        <div class="overview-cards">
          <article class="status-card glass">
            <span>Rescue Teams</span>
            <strong id="metric-rescueTeams">0</strong>
            <p>Online and responding</p>
          </article>
          <article class="status-card glass">
            <span>Medical Units</span>
            <strong id="metric-medicalUnits">0</strong>
            <p>On standby</p>
          </article>
          <article class="status-card glass">
            <span>Shelter Capacity</span>
            <strong id="metric-shelterCapacity">0</strong>
            <p>Available beds</p>
          </article>
          <article class="status-card glass">
            <span>Supply Convoys</span>
            <strong id="metric-supplyConvoys">0</strong>
            <p>En route</p>
          </article>
        </div>
      </div>
      <section class="charts-card glass glass-raise">
        <h3>Operational Status</h3>
        <div class="progress-list">
          <div>
            <span>Incident Containment</span>
            <div class="progress-bar"><span id="progress-incidentContainment" style="width: 0%"></span></div>
          </div>
          <div>
            <span>Communication Coverage</span>
            <div class="progress-bar"><span id="progress-communicationCoverage" style="width: 0%"></span></div>
          </div>
          <div>
            <span>Resource Delivery</span>
            <div class="progress-bar"><span id="progress-resourceDelivery" style="width: 0%"></span></div>
          </div>
        </div>
      </section>
    </section>
  `,
};

