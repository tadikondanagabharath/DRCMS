const { Pool } = require('pg');

const defaultMetrics = {
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
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function getAsync(text, params = []) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

async function allAsync(text, params = []) {
  const result = await query(text, params);
  return result.rows;
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS metrics (
      id SERIAL PRIMARY KEY,
      activeDisasters INTEGER NOT NULL,
      teamsDeployed INTEGER NOT NULL,
      availableResources INTEGER NOT NULL,
      incidentsOpen INTEGER NOT NULL,
      rescueTeams INTEGER NOT NULL,
      medicalUnits INTEGER NOT NULL,
      shelterCapacity INTEGER NOT NULL,
      supplyConvoys INTEGER NOT NULL,
      incidentContainment INTEGER NOT NULL,
      communicationCoverage INTEGER NOT NULL,
      resourceDelivery INTEGER NOT NULL,
      signalCoverage INTEGER NOT NULL,
      openChannels INTEGER NOT NULL
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      accuracy DOUBLE PRECISION,
      timestamp TEXT NOT NULL,
      status TEXT NOT NULL,
      sent_to TEXT NOT NULL,
      reviewed_at TEXT,
      review_reason TEXT,
      contacted INTEGER NOT NULL DEFAULT 0,
      review_source TEXT NOT NULL DEFAULT 'automated'
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  await query(
    `INSERT INTO metrics (
      id, activeDisasters, teamsDeployed, availableResources, incidentsOpen,
      rescueTeams, medicalUnits, shelterCapacity, supplyConvoys,
      incidentContainment, communicationCoverage, resourceDelivery,
      signalCoverage, openChannels
    ) VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT (id) DO NOTHING`,
    [
      defaultMetrics.activeDisasters,
      defaultMetrics.teamsDeployed,
      defaultMetrics.availableResources,
      defaultMetrics.incidentsOpen,
      defaultMetrics.rescueTeams,
      defaultMetrics.medicalUnits,
      defaultMetrics.shelterCapacity,
      defaultMetrics.supplyConvoys,
      defaultMetrics.incidentContainment,
      defaultMetrics.communicationCoverage,
      defaultMetrics.resourceDelivery,
      defaultMetrics.signalCoverage,
      defaultMetrics.openChannels,
    ]
  );
}

function normalizeAlertRow(alert) {
  if (!alert) return null;
  return {
    ...alert,
    latitude: alert.latitude === null ? null : Number(alert.latitude),
    longitude: alert.longitude === null ? null : Number(alert.longitude),
    accuracy: alert.accuracy === null ? null : Number(alert.accuracy),
    contacted: Number(alert.contacted),
  };
}

function dispatchRescueTeams(alert) {
  if (!alert || alert.status !== 'verified') return;
  console.log(`Dispatch issued for alert ${alert.id} to ${alert.sent_to || 'rescue teams'}:`, alert.message);
}

function autoReviewAlert({ message, location }) {
  const normalized = String(message || '').trim().toLowerCase();
  const falseKeywords = ['test', 'drill', 'false alarm', 'hoax', 'no danger', 'training', 'routine check'];
  const trueKeywords = ['fire', 'flood', 'earthquake', 'collapsed', 'trapped', 'injured', 'accident', 'drowning', 'missing', 'explosion', 'gas leak', 'storm', 'tornado', 'cyclone', 'hurricane', 'landslide', 'wildfire', 'medical emergency', 'help', 'urgent', 'danger', 'rescue', 'sos', 'attack', 'violence'];

  const foundFalse = falseKeywords.some((keyword) => normalized.includes(keyword));
  const foundTrue = trueKeywords.filter((keyword) => normalized.includes(keyword)).length;

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

async function normalizeMetrics() {
  const alerts = await getAlerts();
  const totalAlerts = alerts.length;
  const openAlerts = alerts.filter((alert) => alert.status === 'open').length;
  const metrics = {
    ...defaultMetrics,
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

  await query(
    `UPDATE metrics SET
      activeDisasters = $1,
      teamsDeployed = $2,
      availableResources = $3,
      incidentsOpen = $4,
      rescueTeams = $5,
      medicalUnits = $6,
      shelterCapacity = $7,
      supplyConvoys = $8,
      incidentContainment = $9,
      communicationCoverage = $10,
      resourceDelivery = $11,
      signalCoverage = $12,
      openChannels = $13
      WHERE id = 1`,
    [
      metrics.activeDisasters,
      metrics.teamsDeployed,
      metrics.availableResources,
      metrics.incidentsOpen,
      metrics.rescueTeams,
      metrics.medicalUnits,
      metrics.shelterCapacity,
      metrics.supplyConvoys,
      metrics.incidentContainment,
      metrics.communicationCoverage,
      metrics.resourceDelivery,
      metrics.signalCoverage,
      metrics.openChannels,
    ]
  );

  return metrics;
}

async function createAlert({ name, phone, message, location }) {
  const timestamp = new Date().toISOString();
  const review = autoReviewAlert({ message, location });
  const result = await query(
    `INSERT INTO alerts (
      name, phone, message, latitude, longitude, accuracy,
      timestamp, status, sent_to, reviewed_at, review_reason,
      contacted, review_source
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING id`,
    [
      name,
      phone,
      message,
      location?.latitude ?? null,
      location?.longitude ?? null,
      location?.accuracy ?? null,
      timestamp,
      review.status,
      review.sent_to,
      review.reviewed_at,
      review.review_reason,
      review.contacted,
      review.review_source,
    ]
  );

  const alert = {
    id: result.rows[0].id,
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

  if (review.status === 'verified') {
    dispatchRescueTeams(alert);
  }

  await normalizeMetrics();
  return alert;
}

async function findUserByEmail(email) {
  return await getAsync('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
}

async function createUser({ name, email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('User already exists');
  }
  const createdAt = new Date().toISOString();
  const result = await query(
    `INSERT INTO users (name, email, password, createdAt)
     VALUES ($1,$2,$3,$4) RETURNING id`,
    [name, email, password, createdAt]
  );
  return { id: result.rows[0].id, name, email };
}

async function authenticateUser({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user || user.password !== password) {
    return null;
  }
  return { id: user.id, name: user.name, email: user.email };
}

async function getAlerts() {
  const rows = await allAsync('SELECT * FROM alerts ORDER BY id DESC');
  return rows.map(normalizeAlertRow);
}

async function reviewOpenAlerts() {
  const pendingAlerts = await allAsync("SELECT * FROM alerts WHERE status = 'open' ORDER BY id DESC");
  const reviewed = [];
  for (const alert of pendingAlerts) {
    const review = autoReviewAlert({ message: alert.message, location: { latitude: alert.latitude, longitude: alert.longitude } });
    await query(
      `UPDATE alerts SET status = $1, sent_to = $2, reviewed_at = $3, review_reason = $4, contacted = $5, review_source = $6 WHERE id = $7`,
      [
        review.status,
        review.sent_to,
        review.reviewed_at,
        review.review_reason,
        review.contacted,
        review.review_source,
        alert.id,
      ]
    );
    const updatedAlert = { ...normalizeAlertRow(alert), ...review };
    if (review.status === 'verified') {
      dispatchRescueTeams(updatedAlert);
    }
    reviewed.push(updatedAlert);
  }
  if (reviewed.length) {
    await normalizeMetrics();
  }
  return reviewed;
}

async function getMetrics() {
  const row = await getAsync('SELECT * FROM metrics WHERE id = 1');
  if (!row) {
    await initDb();
    return { ...defaultMetrics };
  }
  delete row.id;
  return row;
}

async function setMetric(key, value) {
  const metrics = await getMetrics();
  if (!Object.prototype.hasOwnProperty.call(metrics, key)) {
    throw new Error(`Metric ${key} does not exist.`);
  }
  await query(`UPDATE metrics SET ${key} = $1 WHERE id = 1`, [Number(value)]);
  return await getMetrics();
}

async function incrementMetric(key, amount = 1) {
  const metrics = await getMetrics();
  if (!Object.prototype.hasOwnProperty.call(metrics, key)) {
    throw new Error(`Metric ${key} does not exist.`);
  }
  const next = Number(metrics[key]) + Number(amount);
  await setMetric(key, next);
  return next;
}

module.exports = {
  initDb,
  createAlert,
  getAlerts,
  getMetrics,
  setMetric,
  incrementMetric,
  findUserByEmail,
  createUser,
  authenticateUser,
  reviewOpenAlerts,
};
