export default {
  title: 'Incident Reports',
  html: `
    <div class="reports-page-grid">
      <section class="reports-page glass glass-raise">
        <div class="reports-header">
          <h3>Alert History</h3>
          <p>Recent alerts sent by users and automatically dispatched to rescue teams.</p>
        </div>
        <table class="reports-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Message</th>
              <th>Location</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody id="alerts-table-body">
            <tr>
              <td colspan="5">Loading alerts...</td>
            </tr>
          </tbody>
        </table>
      </section>

      <aside class="reports-sidebar glass glass-raise">
        <h3>Dispatch Summary</h3>
        <div class="dispatch-stat-card glass">
          <span>Priority Level</span>
          <strong class="text-danger">High Alert</strong>
        </div>
        <div class="dispatch-stat-card glass">
          <span>Primary Channel</span>
          <strong>VHF Channel 16</strong>
        </div>
        <div class="dispatch-stat-card glass">
          <span>Active Command</span>
          <span class="status-pill status-active">● Dispatch Active</span>
        </div>
      </aside>
    </div>
  `,
};

