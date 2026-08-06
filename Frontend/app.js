const API_BASES = ['http://localhost:4000', 'http://localhost:4001', 'http://localhost:4002'];

const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const authSwitch = document.getElementById('auth-switch');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const dashboardTitle = document.getElementById('dashboard-title');
const metricsGrid = document.getElementById('metrics-grid');
const alertsList = document.getElementById('alerts-list');
const recentIncidentsList = document.getElementById('recent-incidents-list');
const reviewBtn = document.getElementById('review-btn');
const refreshIncidentsBtn = document.getElementById('refresh-incidents-btn');
const logoutBtn = document.getElementById('logout-btn');
const alertFeedback = document.getElementById('alert-feedback');
const locationStatus = document.getElementById('location-status');
const locationDetails = document.getElementById('location-details');
const mapFrame = document.getElementById('map-frame');
const refreshLocationBtn = document.getElementById('refresh-location-btn');
const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
const tabContents = Array.from(document.querySelectorAll('.tab-content'));

let currentMode = 'login';
let currentUser = null;
let currentLocation = null;

function setActiveTab(tabName) {
  tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });
  tabContents.forEach((content) => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
}

function setMode(mode) {
  currentMode = mode;
  if (mode === 'signup') {
    authTitle.textContent = 'Create an account';
    authSubtitle.textContent = 'Join the coordination workspace.';
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    authSwitch.innerHTML = 'Already have an account? <a href="#" data-mode="login">Sign in</a>';
  } else {
    authTitle.textContent = 'Welcome back';
    authSubtitle.textContent = 'Access the response dashboard securely.';
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    authSwitch.innerHTML = 'Need an account? <a href="#" data-mode="signup">Create one</a>';
  }
}

function showDashboard(user) {
  currentUser = user;
  authView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  dashboardTitle.textContent = `Welcome, ${user.name}`;
  setActiveTab('home');
  refreshMetrics();
  refreshAlerts();
}

function showAuth() {
  currentUser = null;
  dashboardView.classList.add('hidden');
  authView.classList.remove('hidden');
  setMode(currentMode);
}

function updateLocationUI(location, statusMessage) {
  if (!location) {
    locationStatus.textContent = statusMessage || 'No current location available';
    locationDetails.innerHTML = '<p>Latitude: --</p><p>Longitude: --</p><p>Accuracy: --</p>';
    mapFrame.innerHTML = '<p class="small">Allow location access to view the live map.</p>';
    return;
  }

  const latitude = Number(location.latitude).toFixed(6);
  const longitude = Number(location.longitude).toFixed(6);
  const accuracy = location.accuracy != null ? `${Math.round(location.accuracy)} m` : 'Unknown';

  locationStatus.textContent = statusMessage || 'Live coordinates captured';
  locationDetails.innerHTML = `
    <p>Latitude: ${latitude}</p>
    <p>Longitude: ${longitude}</p>
    <p>Accuracy: ${accuracy}</p>
  `;

  const mapsApiKey = window.MAPS_API_KEY || 'AIzaSyC7ane3AgxaNvEbCb4ikxRP5Tb1cW9Kjh0';
  const query = encodeURIComponent(`${latitude},${longitude}`);
  const embedUrl = `https://www.google.com/maps?q=${query}&z=14&output=embed&key=${encodeURIComponent(mapsApiKey)}`;
  mapFrame.innerHTML = `<iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${embedUrl}"></iframe>`;
}

function handleLocationError(error) {
  const message = error && error.message ? error.message : 'Unable to access location.';
  updateLocationUI(null, message);
}

function getCurrentLocation(force = false) {
  if (currentLocation && !force) {
    updateLocationUI(currentLocation, 'Using previously captured location');
    return Promise.resolve(currentLocation);
  }

  if (!navigator.geolocation) {
    handleLocationError(new Error('Geolocation is not supported by this browser.'));
    return Promise.resolve(null);
  }

  updateLocationUI(null, 'Requesting your current location…');

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      handleLocationError(new Error('Location request timed out.'));
      resolve(null);
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        updateLocationUI(currentLocation, 'Live coordinates captured');
        resolve(currentLocation);
      },
      (error) => {
        clearTimeout(timeoutId);
        handleLocationError(error);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

async function api(path, options = {}) {
  const requestOptions = {
    headers: { 'Content-Type': 'application/json' },
    validateStatus: () => true,
    ...options,
  };

  if (requestOptions.body) {
    requestOptions.data = requestOptions.body;
    delete requestOptions.body;
  }

  let lastError = new Error('Unable to reach the backend.');
  for (const baseUrl of API_BASES) {
    try {
      const response = await axios({ url: `${baseUrl}${path}`, ...requestOptions });
      const data = response.data || {};
      if (response.status >= 200 && response.status < 400) {
        return data;
      }
      lastError = new Error(data.error || data.message || 'Request failed');
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function refreshMetrics() {
  try {
    const { metrics } = await api('/api/status');
    const cards = [
      ['Active disasters', metrics.activeDisasters],
      ['Teams deployed', metrics.teamsDeployed],
      ['Open incidents', metrics.incidentsOpen],
      ['Available resources', metrics.availableResources],
      ['Rescue teams', metrics.rescueTeams],
      ['Shelter capacity', metrics.shelterCapacity],
    ];
    metricsGrid.innerHTML = cards.map(([label, value]) => `
      <div class="stat-card">
        <h3>${label}</h3>
        <p>${value}</p>
      </div>
    `).join('');
  } catch (error) {
    metricsGrid.innerHTML = `<div class="stat-card"><h3>Notice</h3><p>${error.message}</p></div>`;
  }
}

async function refreshAlerts() {
  try {
    const { alerts } = await api('/api/alerts');
    if (!alerts.length) {
      alertsList.innerHTML = '<div class="alert-item"><strong>No alerts yet</strong><span class="small">Your incident reports will appear here.</span></div>';
      recentIncidentsList.innerHTML = '<div class="alert-item"><strong>No incidents yet</strong><span class="small">Submitted alerts will appear here.</span></div>';
      return;
    }
    const displayAlerts = alerts.slice(0, 8);
    alertsList.innerHTML = displayAlerts.map((alert) => `
      <div class="alert-item">
        <strong>${alert.name}</strong>
        <div class="small">${alert.message}</div>
        <div class="small">Status: ${alert.status} • ${new Date(alert.timestamp).toLocaleString()}</div>
      </div>
    `).join('');

    recentIncidentsList.innerHTML = alerts.map((alert) => `
      <div class="alert-item">
        <strong>${alert.name}</strong>
        <div class="small">${alert.message}</div>
        <div class="small">Status: ${alert.status} • ${new Date(alert.timestamp).toLocaleString()}</div>
      </div>
    `).join('');
  } catch (error) {
    alertsList.innerHTML = `<div class="alert-item"><strong>Unable to load alerts</strong><div class="small">${error.message}</div></div>`;
    recentIncidentsList.innerHTML = `<div class="alert-item"><strong>Unable to load incidents</strong><div class="small">${error.message}</div></div>`;
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    showDashboard(data.user);
  } catch (error) {
    alert(error.message);
  }
});

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  try {
    const data = await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    alert('Account created successfully. Please sign in.');
    showAuth();
    setMode('login');
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = password;
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById('alert-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  alertFeedback.textContent = 'Capturing current location and processing incident...';
  const location = await getCurrentLocation(true);
  const payload = {
    name: document.getElementById('alert-name').value.trim(),
    phone: document.getElementById('alert-phone').value.trim(),
    message: document.getElementById('alert-message').value.trim(),
    location: location ? {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
    } : null,
  };
  try {
    const data = await api('/api/message', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    document.getElementById('alert-form').reset();
    refreshAlerts();
    refreshMetrics();
    const verification = data.verification || {};
    if (verification.isLikelyReal) {
      alertFeedback.textContent = `Incident likely real. Emergency alert sent to ${verification.channels.join(', ')}.`;
    } else {
      alertFeedback.textContent = `Assessment: ${verification.reason || 'No confirmed emergency.'}`;
    }
  } catch (error) {
    alertFeedback.textContent = error.message;
  }
});

reviewBtn.addEventListener('click', async () => {
  try {
    await api('/api/admin/review-alerts', { method: 'POST' });
    refreshAlerts();
    refreshMetrics();
  } catch (error) {
    alert(error.message);
  }
});

refreshIncidentsBtn.addEventListener('click', () => {
  refreshAlerts();
});

refreshLocationBtn.addEventListener('click', () => {
  getCurrentLocation(true);
});

logoutBtn.addEventListener('click', () => {
  showAuth();
});

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setActiveTab(button.dataset.tab);
    if (button.dataset.tab === 'location') {
      getCurrentLocation();
    }
  });
});

authSwitch.addEventListener('click', (event) => {
  const target = event.target.closest('a');
  if (!target) return;
  event.preventDefault();
  setMode(target.dataset.mode);
});

setMode('login');
showAuth();
getCurrentLocation();
