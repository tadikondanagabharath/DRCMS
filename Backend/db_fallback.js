// In-memory fallback database for local development when Postgres is unavailable
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
};

let data = JSON.parse(JSON.stringify(defaultData));

function normalizeMetrics() {
  data.alerts = Array.isArray(data.alerts) ? data.alerts : [];
  data.users = Array.isArray(data.users) ? data.users : [];
  const totalAlerts = data.alerts.length;
  const openAlerts = data.alerts.filter((a) => a.status === 'open').length;
  data.metrics = {
    ...defaultData.metrics,
    ...(data.metrics || {}),
    activeDisasters: openAlerts,
    incidentsOpen: totalAlerts,
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
  const review = autoReviewAlert({ message, location });
  const alert = {
    id: nextId,
    name,
    phone,
    message,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    accuracy: location?.accuracy ?? null,
    timestamp,
    status: review.status,
    sent_to: review.sent_to,
    reviewed_at: review.reviewed_at,
    review_reason: review.review_reason,
    contacted: review.contacted,
    review_source: review.review_source,
  };
  data.alerts.unshift(alert);
  normalizeMetrics();
  if (review.status === 'verified') dispatchRescueTeams(alert);
  return Promise.resolve(alert);
}

function findUserByEmail(email) {
  return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

function createUser({ name, email, password }) {
  if (findUserByEmail(email)) {
    throw new Error('User already exists');
  }
  const nextId = data.users.length ? Math.max(...data.users.map((u) => u.id)) + 1 : 1;
  const createdAt = new Date().toISOString();
  const user = { id: nextId, name, email, password, createdAt };
  data.users.push(user);
  normalizeMetrics();
  return Promise.resolve({ id: user.id, name: user.name, email: user.email });
}

function authenticateUser({ email, password }) {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) return Promise.resolve(null);
  return Promise.resolve({ id: user.id, name: user.name, email: user.email });
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

module.exports = {
  initDb,
  createAlert,
  getMetrics,
  getAlerts,
  createUser,
  authenticateUser,
  reviewOpenAlerts,
};
