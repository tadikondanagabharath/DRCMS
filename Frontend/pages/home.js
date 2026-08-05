export default {
  title: 'Home',
  html: `
    <div class="home-container">
      <section class="home-top-grid">
        <div class="hero-card glass glass-raise">
          <h3 id="welcome-greeting">Welcome to DRCMS</h3>
          <p>Centralized incident tracking, responder dispatch, and relief coordination for any disaster event.</p>
          <div class="quick-status-pills">
            <span class="status-pill status-active">● Command Operations Active</span>
            <span class="status-pill status-active">● 24/7 Responder Network</span>
          </div>
        </div>
        <div class="alert-card glass glass-raise">
          <h4>Emergency Alert</h4>
          <p>Send an urgent message now if a disaster occurs. Your alert will be forwarded automatically to rescue teams.</p>
          <form class="alert-form">
            <label for="alert-name">Your name</label>
            <input id="alert-name" name="name" type="text" placeholder="Enter your full name" required />
            <label for="alert-phone">Phone number</label>
            <input id="alert-phone" name="phone" type="tel" placeholder="Enter your phone number" required />
            <label for="alert-message">Alert message</label>
            <textarea id="alert-message" name="message" rows="3" placeholder="Describe the disaster and required assistance"></textarea>
            <button type="submit">Send Alert</button>
            <div class="alert-status" aria-live="polite"></div>
          </form>
        </div>
      </section>

      <section class="summary-grid">
        <article class="metric-card glass glass-raise">
          <span>Active Disasters</span>
          <strong id="metric-activeDisasters">0</strong>
        </article>
        <article class="metric-card glass glass-raise">
          <span>Teams Deployed</span>
          <strong id="metric-teamsDeployed">0</strong>
        </article>
        <article class="metric-card glass glass-raise">
          <span>Available Resources</span>
          <strong id="metric-availableResources">0</strong>
        </article>
        <article class="metric-card glass glass-raise">
          <span>Incidents Open</span>
          <strong id="metric-incidentsOpen">0</strong>
        </article>
      </section>

      <section class="mission-cards">
        <article class="mission-card glass glass-raise">
          <h4>Rapid Response</h4>
          <p>Automatically assign the nearest response teams and maintain visibility on field progress.</p>
        </article>
        <article class="mission-card glass glass-raise">
          <h4>Resource Logistics</h4>
          <p>Track relief supplies, medical kits, water, and shelter inventory across affected zones.</p>
        </article>
        <article class="mission-card glass glass-raise">
          <h4>Evacuation Support</h4>
          <p>Identify safe routes, population clusters, and evacuation centers during active response.</p>
        </article>
      </section>
    </div>
  `,
};

