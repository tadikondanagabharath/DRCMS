export default {
  title: 'Admin Review',
  html: `
    <div class="admin-review-grid">
      <section class="admin-review-panel glass glass-raise">
        <div class="admin-header">
          <h3>Admin Incident Review</h3>
          <p>Enter the admin password to access incident review and rescue dispatch controls.</p>
        </div>

        <div id="admin-access-gate" class="admin-access-gate">
          <form id="admin-password-form" class="admin-password-form">
            <label for="admin-password-input">Admin Password</label>
            <input id="admin-password-input" name="adminPassword" type="password" placeholder="Enter admin password" required />
            <button type="submit" class="primary-button">Unlock Admin Review</button>
          </form>
          <div id="admin-access-status" class="admin-status">Admin access is required to continue.</div>
        </div>

        <div id="admin-review-content" class="admin-review-content" style="display: none;">
          <div class="admin-actions">
            <button type="button" id="run-admin-review" class="primary-button">Run Automated Review</button>
            <div id="admin-review-status" class="admin-status">No review has been run yet.</div>
          </div>
          <table class="admin-report-table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Status</th>
                <th>Disposition</th>
                <th>Contacted</th>
                <th>Reviewed At</th>
              </tr>
            </thead>
            <tbody id="admin-review-table-body">
              <tr>
                <td colspan="5">Run the automated review to process pending alerts.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <aside class="admin-sidebar glass glass-raise">
        <h3>Review Summary</h3>
        <div class="admin-summary-card glass">
          <span>Last action</span>
          <strong id="admin-summary-action">Waiting for review</strong>
        </div>
        <div class="admin-summary-card glass">
          <span>Alerts verified</span>
          <strong id="admin-summary-verified">0</strong>
        </div>
        <div class="admin-summary-card glass">
          <span>Alerts rejected</span>
          <strong id="admin-summary-false">0</strong>
        </div>
      </aside>
    </div>
  `,
};
