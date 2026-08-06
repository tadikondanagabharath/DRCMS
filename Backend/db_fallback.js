// In-memory fallback database for local development when Postgres is unavailable
const bcrypt = require('bcrypt');

const defaultData = {
  metrics: {
    activeDisasters: 0,
    teamsDeployed: 0,
    availableResources: 0,
    incidentsOpen: 0,
    rescueTeams: 0,
    medicalUnits: 0,
    shelterCapacity: 0,
    supplyConvoys: 0,
    incidentContainment: 0,
    communicationCoverage: 0,
    resourceDelivery: 0,
    signalCoverage: 0,
    openChannels: 0,
  },
  alerts: [],
  users: [],
  incidents: [],
  emergencyBroadcasts: [],
};

let data = JSON.parse(JSON.stringify(defaultData));

function normalizeMetrics() {
  data.alerts = Array.isArray(data.alerts) ? data.alerts : [];
  data.users = Array.isArray(data.users) ? data.users : [];
  data.incidents = Array.isArray(data.incidents) ? data.incidents : [];
  data.emergencyBroadcasts = Array.isArray(data.emergencyBroadcasts) ? data.emergencyBroadcasts : [];
  const totalAlerts = data.alerts.length;
  const openAlerts = data.alerts.filter((a) => a.status === 'open').length;
  data.metrics = {
    ...defaultData.metrics,
    ...(data.metrics || {}),
    activeDisasters: 0,
    incidentsOpen: 0,
    teamsDeployed: Math.min(24, totalAlerts * 2),
    rescueTeams: Math.min(18, totalAlerts),
    availableResources: Math.max(0, 120 - totalAlerts * 5),
    shelterCapacity: Math.max(0, 180 - totalAlerts * 6),
    supplyConvoys: Math.min(16, Math.ceil(totalAlerts / 2)),
    incidentContainment: Math.min(95, 30 + totalAlerts * 12),
    communicationCoverage: Math.min(100, 45 + totalAlerts * 10),
    resourceDelivery: Math.min(90, 35 + totalAlerts * 11),
    signalCoverage: Math.min(100, 50 + totalAlerts * 8),
    openChannels: Math.min(30, 6 + totalAlerts * 2),
  };
}

function initDb() {
  data = JSON.parse(JSON.stringify(defaultData));
  return Promise.resolve();
}

function normalizeLocation(location) {
  if (!location) return '';
  if (typeof location === 'string') return location.trim().toLowerCase();
  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.region) parts.push(location.region);
  if (location.address) parts.push(location.address);
  if (location.latitude != null && location.longitude != null) parts.push(`${location.latitude},${location.longitude}`);
  return parts.join(' ').trim().toLowerCase();
}

function buildVerificationContext({ message, location }) {
  const normalizedMessage = String(message || '').trim().toLowerCase();
  const normalizedLocation = normalizeLocation(location);
  const knownLocations = ['north district', 'harbor street', 'central avenue', 'riverfront', 'west gate'];
  const emergencyKeywords = ['fire', 'flood', 'earthquake', 'collapsed', 'trapped', 'injured', 'accident', 'drowning', 'missing', 'explosion', 'gas leak', 'storm', 'tornado', 'cyclone', 'hurricane', 'landslide', 'wildfire', 'medical emergency', 'danger', 'rescue', 'sos', 'attack', 'violence'];

  const matches = emergencyKeywords.filter((keyword) => normalizedMessage.includes(keyword));
  const locationMatch = knownLocations.some((place) => normalizedLocation.includes(place) || normalizedMessage.includes(place));
  const hasCoordinates = Boolean(location && (location.latitude != null || location.longitude != null));
  const hasUrgency = normalizedMessage.includes('help') || normalizedMessage.includes('urgent') || normalizedMessage.includes('immediate');

  return {
    normalizedMessage,
    normalizedLocation,
    matches,
    locationMatch,
    hasCoordinates,
    hasUrgency,
  };
}

function verifyIncident(payload = {}) {
  const context = buildVerificationContext(payload);
  const isLikelyReal = context.matches.length > 0 && (context.locationMatch || context.hasCoordinates || context.hasUrgency || context.normalizedMessage.length > 20);
  const channels = isLikelyReal ? [100, 101, 112, 108] : [];
  const reason = isLikelyReal
    ? (context.matches.length > 0 ? 'Emergency keywords and location context indicate a real incident.' : 'Location and urgency cues indicate a real incident.')
    : 'The report did not meet the verification threshold for an emergency broadcast.';

  const incident = {
    id: data.incidents.length ? Math.max(...data.incidents.map((item) => item.id)) + 1 : 1,
    name: String(payload.name || '').trim(),
    phone: String(payload.phone || '').trim(),
    message: String(payload.message || payload.text || '').trim(),
    location: payload.location || null,
    verifiedAt: new Date().toISOString(),
    isLikelyReal,
    reason,
    channels,
    status: isLikelyReal ? 'verified' : 'review',
  };

  data.incidents.unshift(incident);

  if (isLikelyReal) {
    data.emergencyBroadcasts.unshift({
      id: data.emergencyBroadcasts.length ? Math.max(...data.emergencyBroadcasts.map((item) => item.id)) + 1 : 1,
      incidentId: incident.id,
      message: `Emergency alert dispatched for ${incident.message}`,
      channels,
      sentAt: new Date().toISOString(),
      status: 'sent',
    });
  }

  normalizeMetrics();
  return Promise.resolve({
    isLikelyReal,
    reason,
    channels,
    incident,
  });
}

function autoReviewAlert({ message, location }) {
  const normalized = String(message || '').trim().toLowerCase();
  const falseKeywords = ['test', 'drill', 'false alarm', 'hoax', 'no danger', 'training', 'routine check'];
  const trueKeywords = ['fire', 'flood', 'earthquake', 'collapsed', 'trapped', 'injured', 'accident', 'drowning', 'missing', 'explosion', 'gas leak', 'storm', 'tornado', 'cyclone', 'hurricane', 'landslide', 'wildfire', 'medical emergency', 'help', 'urgent', 'danger', 'rescue', 'sos', 'attack', 'violence'];
  const foundFalse = falseKeywords.some((k) => normalized.includes(k));
  const foundTrue = trueKeywords.filter((k) => normalized.includes(k)).length;
  let isValid = false;
  let reviewReason = 'Report did not match emergency patterns and was classified as a false alarm.';
  if (foundFalse) {
    isValid = false;
    reviewReason = 'Alert appears to be a drill, test, or false alarm.';
  } else if (foundTrue > 0) {
    isValid = true;
    reviewReason = 'Incident verified by emergency keyword detection.';
  } else if (normalized.length >= 20 && location && location.latitude && location.longitude) {
    isValid = true;
    reviewReason = 'Alert includes location and a detailed description; classified as valid.';
  } else if (normalized.includes('help') || normalized.includes('urgent')) {
    isValid = true;
    reviewReason = 'Urgent assistance request detected; classified as verified.';
  }
  return {
    status: isValid ? 'verified' : 'false alarm',
    review_reason: reviewReason,
    reviewed_at: new Date().toISOString(),
    contacted: isValid ? 1 : 0,
    sent_to: isValid ? 'rescue teams' : 'monitoring',
    review_source: 'automated',
  };
}

function dispatchRescueTeams(alert) {
  if (!alert || alert.status !== 'verified') return;
  console.log(`Dispatch issued for alert ${alert.id} to ${alert.sent_to || 'rescue teams'}:`, alert.message);
}

function createAlert({ name, phone, message, location }) {
  const nextId = data.alerts.length ? Math.max(...data.alerts.map((a) => a.id)) + 1 : 1;
  const timestamp = new Date().toISOString();
  const alert = {
    id: nextId,
    name,
    phone,
    message,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    accuracy: location?.accuracy ?? null,
    timestamp,
    status: 'open',
    sent_to: 'monitoring',
    reviewed_at: null,
    review_reason: 'Pending review',
    contacted: 0,
    review_source: 'pending',
  };
  data.alerts.unshift(alert);
  normalizeMetrics();
  return Promise.resolve(alert);
}

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
}

async function verifyPassword(candidatePassword, storedPassword) {
  if (!storedPassword) return false;
  if (storedPassword.startsWith('$2')) {
    return bcrypt.compare(candidatePassword, storedPassword);
  }
  return candidatePassword === storedPassword;
}

function findUserByEmail(email) {
  return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

async function createUser({ name, email, password }) {
  if (findUserByEmail(email)) {
    throw new Error('User already exists');
  }
  const nextId = data.users.length ? Math.max(...data.users.map((u) => u.id)) + 1 : 1;
  const createdAt = new Date().toISOString();
  const hashedPassword = await hashPassword(password);
  const user = { id: nextId, name, email, password: hashedPassword, createdAt };
  data.users.push(user);
  normalizeMetrics();
  return { id: user.id, name: user.name, email: user.email };
}

async function authenticateUser({ email, password }) {
  const user = findUserByEmail(email);
  if (!user) return null;
  const passwordMatches = await verifyPassword(password, user.password);
  if (!passwordMatches) return null;
  return { id: user.id, name: user.name, email: user.email };
}

function getAlerts() {
  return Promise.resolve(data.alerts);
}

function reviewOpenAlerts() {
  const reviewed = [];
  data.alerts = data.alerts.map((alert) => {
    if (alert.status !== 'open') return alert;
    const review = autoReviewAlert({ message: alert.message, location: { latitude: alert.latitude, longitude: alert.longitude } });
    const updated = { ...alert, ...review };
    if (review.status === 'verified') dispatchRescueTeams(updated);
    reviewed.push(updated);
    return updated;
  });
  normalizeMetrics();
  return Promise.resolve(reviewed);
}

function getMetrics() {
  normalizeMetrics();
  return Promise.resolve(data.metrics);
}

function getIncidents() {
  return Promise.resolve(data.incidents);
}

function getEmergencyBroadcasts() {
  return Promise.resolve(data.emergencyBroadcasts);
}

module.exports = {
  initDb,
  createAlert,
  getMetrics,
  getAlerts,
  createUser,
  authenticateUser,
  reviewOpenAlerts,
  verifyIncident,
  getIncidents,
  getEmergencyBroadcasts,
};
