import loginPage from '../pages/login.js';
import signupPage from '../pages/signup.js';
import homePage from '../pages/home.js';
import dashboardPage from '../pages/dashboard.js';
import disasterPage from '../pages/disaster.js';
import adminPage from '../pages/admin.js';
import incidentPage from '../pages/incidentreport.js';
import locationPage from '../pages/currentlocation.js';


const pages = {
  home: homePage,
  dashboard: dashboardPage,
  disaster: disasterPage,
  adminreview: adminPage,
  incidentreport: incidentPage,
  currentlocation: locationPage,
  login: loginPage,
  signup: signupPage,
};

const pagesOrder = ['home', 'dashboard', 'disaster', 'adminreview', 'incidentreport', 'currentlocation', 'login', 'signup'];
let lastPageId = null;

const contentElement = document.getElementById('page-content');
// All nav buttons live inside .navbar-nav in the new navbar
const navButtons = Array.from(document.querySelectorAll('.navbar-nav button, .sidebar-nav button'));
const topbarNavButtons = []; // consolidated into navButtons above
const appShell = document.querySelector('.app-shell');
const logoutButtons = Array.from(document.querySelectorAll('.logout-trigger'));

const authPageNames = new Set(['login', 'signup']);
const authStorageKey = 'drcms-auth-user';
let locationMap = null;
let locationMarker = null;
let googleMap = null;
let googleMarker = null;
let googleMapsLoading = false;
let lastAlertLocation = null;

function getHslaColor(hue, saturation, lightness, alpha) {
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
}

function applyDynamicBackground() {
  const baseHue = Math.floor(Math.random() * 360);
  const secondHue = (baseHue + 72) % 360;
  const thirdHue = (baseHue + 148) % 360;

  document.documentElement.style.setProperty('--bg1', getHslaColor(baseHue, 90, 66, 0.24));
  document.documentElement.style.setProperty('--bg2', getHslaColor(secondHue, 88, 54, 0.18));
  document.documentElement.style.setProperty('--bg3', getHslaColor(thirdHue, 54, 15, 1));
  document.documentElement.style.setProperty('--bg4', getHslaColor((thirdHue + 28) % 360, 50, 10, 1));
}

applyDynamicBackground();
window.addEventListener('pageshow', applyDynamicBackground);

function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => {
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  });
}

function getAuthUser() {
  try {
    const stored = window.localStorage.getItem(authStorageKey);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function setAuthUser(user) {
  if (!user || typeof user !== 'object') return;
  window.localStorage.setItem(authStorageKey, JSON.stringify(user));
}

function isAdminAuthenticated() {
  return Boolean(window.localStorage.getItem('drcms-admin-unlocked'));
}

function setAdminAuthenticated() {
  window.localStorage.setItem('drcms-admin-unlocked', '1');
}

function clearAdminAuthenticated() {
  window.localStorage.removeItem('drcms-admin-unlocked');
}

const ADMIN_PASSWORD = 'Admin@123';

function isCorrectAdminPassword(password) {
  return password === ADMIN_PASSWORD;
}

function clearAuthUser() {
  window.localStorage.removeItem(authStorageKey);
}

function isAuthenticated() {
  const user = getAuthUser();
  return Boolean(user && user.email);
}

function requireAuth(pageId) {
  if (authPageNames.has(pageId)) {
    return pageId;
  }
  return isAuthenticated() ? pageId : 'login';
}

function updateAdminReviewVisibility() {
  const gate = document.getElementById('admin-access-gate');
  const reviewContent = document.getElementById('admin-review-content');
  if (!gate || !reviewContent) return;
  const unlocked = isAdminAuthenticated();
  gate.style.display = unlocked ? 'none' : '';
  reviewContent.style.display = unlocked ? '' : 'none';
}

function updateAppShellForAuth(pageId) {
  const authLocked = !isAuthenticated();
  if (appShell) {
    appShell.classList.toggle('auth-locked', authLocked);
  }
  logoutButtons.forEach((btn) => btn.classList.toggle('hidden', !isAuthenticated()));
}

function updateHomeGreeting() {
  const greetingEl = document.getElementById('welcome-greeting');
  if (!greetingEl) return;
  const user = getAuthUser();
  if (user?.name) {
    greetingEl.textContent = `Welcome to DRCMS, Mr/Mrs ${user.name}`;
  } else {
    greetingEl.textContent = 'Welcome to DRCMS';
  }
}

async function fetchBackendJson(path) {
  try {
    const response = await fetch(`http://localhost:4000${path}`);
    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function refreshPageData(pageId) {
  if (pageId === 'home' || pageId === 'dashboard' || pageId === 'currentlocation') {
    if (pageId === 'home') {
      updateHomeGreeting();
    }
    const result = await fetchBackendJson('/api/status');
    const metrics = result?.metrics || {};

    const metricMap = {
      activeDisasters: 'metric-activeDisasters',
      teamsDeployed: 'metric-teamsDeployed',
      availableResources: 'metric-availableResources',
      incidentsOpen: 'metric-incidentsOpen',
      rescueTeams: 'metric-rescueTeams',
      medicalUnits: 'metric-medicalUnits',
      shelterCapacity: 'metric-shelterCapacity',
      supplyConvoys: 'metric-supplyConvoys',
      signalCoverage: 'metric-signalCoverage',
      openChannels: 'metric-openChannels',
    };

    Object.entries(metricMap).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el && metrics[key] !== undefined) {
        el.textContent = metrics[key];
      }
    });

    const progressMap = {
      incidentContainment: 'progress-incidentContainment',
      communicationCoverage: 'progress-communicationCoverage',
      resourceDelivery: 'progress-resourceDelivery',
    };

    Object.entries(progressMap).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el && metrics[key] !== undefined) {
        el.style.width = `${metrics[key]}%`;
      }
    });
  }

  if (pageId === 'currentlocation') {
    const mapEl = document.getElementById('location-map');
    if (mapEl) {
      await initializeLocationMap();
      const loc = await getUserLocation();
      const displayLocation = loc || lastAlertLocation;
      updateLocationMap(displayLocation);
      updateYourLocationBox(displayLocation);
      if (!loc && lastAlertLocation) {
        const status = document.getElementById('location-status');
        if (status) {
          status.textContent = 'Showing last alert location because GPS access was unavailable.';
        }
      }
    }
  }

  if (pageId === 'incidentreport') {
    const result = await fetchBackendJson('/api/alerts');
    const alerts = result?.alerts || [];
    const tbody = document.getElementById('alerts-table-body');
    if (!tbody) return;

    if (!alerts.length) {
      tbody.innerHTML = '<tr><td colspan="5">No alerts found.</td></tr>';
      return;
    }

    tbody.innerHTML = alerts
      .map((alert) => {
        const location = alert.latitude && alert.longitude
          ? `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}`
          : 'Unknown';
        return `
          <tr>
            <td>${alert.name}</td>
            <td>${alert.phone}</td>
            <td>${alert.message}</td>
            <td>${location}</td>
            <td>${new Date(alert.timestamp).toLocaleString()}</td>
          </tr>
        `;
      })
      .join('');
  }

  if (pageId === 'adminreview') {
    const status = document.getElementById('admin-review-status');
    const summaryAction = document.getElementById('admin-summary-action');
    const summaryVerified = document.getElementById('admin-summary-verified');
    const summaryFalse = document.getElementById('admin-summary-false');
    const tbody = document.getElementById('admin-review-table-body');

    if (status) {
      status.textContent = 'Press the button to run automated review on pending reports.';
    }
    if (summaryAction) {
      summaryAction.textContent = 'Awaiting review';
    }
    if (summaryVerified) {
      summaryVerified.textContent = '0';
    }
    if (summaryFalse) {
      summaryFalse.textContent = '0';
    }
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5">Run the automated review to process pending alerts.</td></tr>';
    }
  }
}

async function loadGoogleMaps(apiKey) {
  if (!apiKey) throw new Error('No Google Maps API key provided');
  if (window.google && window.google.maps) return;
  if (googleMapsLoading) {
    // wait until loaded by previous caller
    return new Promise((resolve, reject) => {
      const wait = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(wait);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(wait);
        reject(new Error('Timed out loading Google Maps'));
      }, 10000);
    });
  }
  googleMapsLoading = true;
  return new Promise((resolve, reject) => {
    window.__initGoogleMaps = () => {
      googleMapsLoading = false;
      resolve();
      delete window.__initGoogleMaps;
    };
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=__initGoogleMaps`;
    s.async = true;
    s.onerror = () => {
      googleMapsLoading = false;
      reject(new Error('Failed to load Google Maps script'));
    };
    document.head.appendChild(s);
  });
}

async function initializeLocationMap() {
  const mapEl = document.getElementById('location-map');
  const googleEl = document.getElementById('google-map-container');
  if (!mapEl && !googleEl) return;

  // Try Google Maps if API key is present
  const apiKey = window.GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    try {
      await loadGoogleMaps(apiKey);
      if (window.google && window.google.maps) {
        // remove Leaflet map if previously created
        if (locationMap && locationMap.remove) {
          try { locationMap.remove(); } catch (e) { /* ignore */ }
          locationMap = null;
          locationMarker = null;
        }
        // hide Leaflet container if present
        if (mapEl) mapEl.style.display = 'none';
        if (googleEl) googleEl.style.display = '';
        if (!googleMap) {
          googleMap = new window.google.maps.Map(googleEl || mapEl, { center: { lat: 0, lng: 0 }, zoom: 2 });
          googleMarker = new window.google.maps.Marker({ position: { lat: 0, lng: 0 }, map: googleMap });
        } else {
          window.google.maps.event.trigger(googleMap, 'resize');
        }
        return;
      }
    } catch (e) {
      console.warn('Google Maps load failed, falling back to Leaflet:', e);
    }
  }

  // Fallback to Leaflet if available
  if (!window.L) return;
  // hide google container when using Leaflet
  if (googleEl) googleEl.style.display = 'none';
  if (mapEl) mapEl.style.display = '';
  if (locationMap) {
    const existingContainer = locationMap.getContainer ? locationMap.getContainer() : null;
    if (!existingContainer || existingContainer !== mapEl) {
      try { locationMap.remove(); } catch (e) { console.warn('Failed to remove existing map instance', e); }
      locationMap = null;
      locationMarker = null;
    } else {
      if (locationMap.invalidateSize) setTimeout(() => locationMap.invalidateSize(), 120);
      return;
    }
  }
  locationMap = window.L.map(mapEl).setView([0, 0], 2);
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(locationMap);
  locationMarker = window.L.marker([0, 0]).addTo(locationMap);
}

function updateLocationMap(location) {
  const status = document.getElementById('location-status');
  if (!location) {
    if (status) status.textContent = 'Location unavailable. Please allow geolocation or refresh the page.';
    updateYourLocationBox(null);
    return;
  }

  if (googleMap && googleMarker && window.google && window.google.maps) {
    const pos = { lat: location.latitude, lng: location.longitude };
    googleMarker.setPosition(pos);
    googleMap.setCenter(pos);
    googleMap.setZoom(13);
    if (status) status.textContent = `Current coordinates: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
    return;
  }

  if (locationMap && locationMarker) {
    const coords = [location.latitude, location.longitude];
    locationMarker.setLatLng(coords);
    locationMap.setView(coords, 13);
    if (status) status.textContent = `Current coordinates: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
    return;
  }

  if (status) status.textContent = 'Map not initialized. Please refresh the page.';
}

function updateYourLocationBox(location) {
  const latEl = document.getElementById('your-lat');
  const lngEl = document.getElementById('your-lng');
  const accEl = document.getElementById('your-accuracy');
  const upEl = document.getElementById('your-updated');
  if (!latEl || !lngEl || !accEl || !upEl) return;
  if (!location) {
    latEl.textContent = '—';
    lngEl.textContent = '—';
    accEl.textContent = '—';
    upEl.textContent = '—';
    return;
  }
  latEl.textContent = location.latitude.toFixed(6);
  lngEl.textContent = location.longitude.toFixed(6);
  accEl.textContent = location.accuracy ? `${Math.round(location.accuracy)}` : 'N/A';
  upEl.textContent = new Date().toLocaleString();
}

function bindPageEvents(pageId) {
  const alertForm = document.querySelector('.alert-form');
  if (alertForm) {
    const alertStatus = document.querySelector('.alert-status');
    alertForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = alertForm.querySelector('input[name="name"]').value.trim();
      const phone = alertForm.querySelector('input[name="phone"]').value.trim();
      const message = alertForm.querySelector('textarea[name="message"]').value.trim();

      if (!name || !phone || !message) {
        alertStatus.textContent = 'Name, phone, and an alert message are all required.';
        return;
      }

      alertStatus.textContent = 'Fetching your location and sending alert to rescue teams...';
      const location = await getUserLocation();
      if (!location) {
        alertStatus.textContent = 'Location unavailable. Sending without coordinates...';
      }

      try {
        const response = await fetch('http://localhost:4000/api/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            phone,
            message,
            location,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Unable to send alert');
        }
        alertStatus.textContent = 'Your alert was sent automatically to rescue teams.';
        if (location) {
          lastAlertLocation = location;
          if (lastPageId === 'currentlocation') {
            updateLocationMap(location);
            updateYourLocationBox(location);
          }
        }
        alertForm.reset();
        await refreshPageData('incidentreport');
      } catch (error) {
        alertStatus.textContent = `Send failed: ${error.message}`;
      }
    });
  }

  const loginForm = document.querySelector('.login-form');
  if (loginForm) {
    const authStatus = document.querySelector('.auth-status');
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = loginForm.querySelector('input[name="email"]').value.trim();
      const password = loginForm.querySelector('input[name="password"]').value.trim();
      if (!email || !password) {
        authStatus.textContent = 'Email and password are required.';
        return;
      }
      authStatus.textContent = 'Signing in...';
      try {
        const response = await fetch('http://localhost:4000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || result.message || 'Login failed');
        }
        setAuthUser(result.user);
        authStatus.textContent = 'Login successful. Redirecting...';
        window.location.hash = '#home';
        await renderPage('home');
      } catch (error) {
        authStatus.textContent = `Login failed: ${error.message}`;
      }
    });
  }

  const signupForm = document.querySelector('.signup-form');
  if (signupForm) {
    const authStatus = document.querySelector('.auth-status');
    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = signupForm.querySelector('input[name="name"]').value.trim();
      const email = signupForm.querySelector('input[name="email"]').value.trim();
      const password = signupForm.querySelector('input[name="password"]').value.trim();
      if (!name || !email || !password) {
        authStatus.textContent = 'Name, email, and password are required.';
        return;
      }
      authStatus.textContent = 'Creating your account...';
      try {
        const response = await fetch('http://localhost:4000/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || result.message || 'Signup failed');
        }
        authStatus.textContent = 'Account created. Redirecting to home...';
        setAuthUser(result.user);
        window.location.hash = '#home';
        await renderPage('home');
      } catch (error) {
        authStatus.textContent = `Signup failed: ${error.message}`;
      }
    });
  }

  const adminPasswordForm = document.getElementById('admin-password-form');
  if (adminPasswordForm) {
    const accessStatus = document.getElementById('admin-access-status');
    adminPasswordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const passwordInput = adminPasswordForm.querySelector('input[name="adminPassword"]');
      const passwordValue = passwordInput?.value.trim() || '';
      if (!passwordValue) {
        if (accessStatus) accessStatus.textContent = 'Admin password is required.';
        return;
      }
      if (!isCorrectAdminPassword(passwordValue)) {
        if (accessStatus) accessStatus.textContent = 'Incorrect admin password.';
        return;
      }
      setAdminAuthenticated();
      if (accessStatus) accessStatus.textContent = 'Admin access granted. You may now run the review.';
      await renderPage('adminreview');
    });
  }

  const refreshButton = document.querySelector('.location-refresh-button');
  if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
      refreshButton.disabled = true;
      const status = document.getElementById('location-status');
      if (status) {
        status.textContent = 'Updating current location...';
      }
      const location = await getUserLocation();
      updateLocationMap(location);
      updateYourLocationBox(location);
      refreshButton.disabled = false;
    });
  }

  const reviewButton = document.getElementById('run-admin-review');
  if (reviewButton) {
    const status = document.getElementById('admin-review-status');
    reviewButton.addEventListener('click', async () => {
      reviewButton.disabled = true;
      if (status) status.textContent = 'Running automated review...';
      try {
        const response = await fetch('http://localhost:4000/api/admin/review-alerts', {
          method: 'POST',
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Review failed');
        }
        const reviewed = Array.isArray(result.reviewed) ? result.reviewed : [];
        const verifiedCount = reviewed.filter((item) => item.status === 'verified').length;
        const falseCount = reviewed.filter((item) => item.status === 'false alarm').length;
        const tbody = document.getElementById('admin-review-table-body');
        const summaryAction = document.getElementById('admin-summary-action');
        const summaryVerified = document.getElementById('admin-summary-verified');
        const summaryFalse = document.getElementById('admin-summary-false');

        if (status) status.textContent = `Review completed: ${reviewed.length} pending report(s) processed.`;
        if (summaryAction) summaryAction.textContent = `${reviewed.length} reports processed`;
        if (summaryVerified) summaryVerified.textContent = String(verifiedCount);
        if (summaryFalse) summaryFalse.textContent = String(falseCount);
        if (tbody) {
          if (!reviewed.length) {
            tbody.innerHTML = '<tr><td colspan="5">No open alerts were pending review.</td></tr>';
          } else {
            tbody.innerHTML = reviewed
              .map((alert) => {
                const disposition = alert.status === 'verified' ? 'Verified' : 'False Alarm';
                return `
                  <tr>
                    <td>${alert.message}</td>
                    <td>${disposition}</td>
                    <td>${alert.review_reason || 'Auto-reviewed'}</td>
                    <td>${alert.contacted ? 'Yes' : 'No'}</td>
                    <td>${new Date(alert.reviewed_at).toLocaleString()}</td>
                  </tr>
                `;
              })
              .join('');
          }
        }
        await refreshPageData('incidentreport');
      } catch (error) {
        if (status) status.textContent = `Review failed: ${error.message}`;
      } finally {
        reviewButton.disabled = false;
      }
    });
  }

  const switchButtons = document.querySelectorAll('.link-button[data-target-page]');
  switchButtons.forEach((button) => {
    button.addEventListener('click', () => {
      renderPage(button.dataset.targetPage);
    });
  });
}

async function renderPage(pageId) {
  const page = pages[pageId] || pages.home;
  document.title = `${page.title} · DRCMS`;
  // insert new content
  contentElement.innerHTML = page.html;
  updateAdminReviewVisibility();
  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.page === pageId);
  });
  topbarNavButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.page === pageId);
  });
  // add directional slide class based on page order
  contentElement.classList.remove('page-loaded', 'slide-in-forward', 'slide-in-back');
  const newIndex = pagesOrder.indexOf(pageId);
  const oldIndex = pagesOrder.indexOf(lastPageId);
  if (oldIndex === -1 || lastPageId === null) {
    contentElement.classList.add('page-loaded');
  } else if (newIndex >= 0 && oldIndex >= 0 && newIndex > oldIndex) {
    contentElement.classList.add('slide-in-forward');
  } else if (newIndex >= 0 && oldIndex >= 0 && newIndex < oldIndex) {
    contentElement.classList.add('slide-in-back');
  } else {
    contentElement.classList.add('page-loaded');
  }
  // ensure the animation class is applied in next frame
  window.requestAnimationFrame(() => { });
  lastPageId = pageId;
  window.history.replaceState({}, '', `#${pageId}`);
  updateAppShellForAuth(pageId);
  bindPageEvents(pageId);
  await refreshPageData(pageId);
}

const pageButtons = [...navButtons, ...topbarNavButtons];
pageButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    if (button.dataset.page === 'logout') {
      clearAuthUser();
      clearAdminAuthenticated();
      await renderPage('login');
      return;
    }
    await renderPage(requireAuth(button.dataset.page));
  });
});

logoutButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    clearAuthUser();
    clearAdminAuthenticated();
    await renderPage('login');
  });
});

const initialHash = window.location.hash.replace('#', '');
const startPage = initialHash || 'home';
const targetPage = requireAuth(startPage);
if (targetPage !== initialHash) {
  window.location.hash = `#${targetPage}`;
}
renderPage(targetPage);
