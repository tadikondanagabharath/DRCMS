const http = require('http');
const url = require('url');
const fallbackDb = require('./db_fallback');

function loadDatabase() {
  if (process.env.DATABASE_URL) {
    try {
      return require('./db_postgres');
    } catch (error) {
      console.warn('Failed to load Postgres database module, using fallback database.', error.message || error);
    }
  }
  return fallbackDb;
}

function resolveDbMethods(database) {
  return {
    initDb: database.initDb || fallbackDb.initDb,
    createAlert: database.createAlert || fallbackDb.createAlert,
    getMetrics: database.getMetrics || fallbackDb.getMetrics,
    getAlerts: database.getAlerts || fallbackDb.getAlerts,
    createUser: database.createUser || fallbackDb.createUser,
    authenticateUser: database.authenticateUser || fallbackDb.authenticateUser,
    reviewOpenAlerts: database.reviewOpenAlerts || fallbackDb.reviewOpenAlerts,
    verifyIncident: database.verifyIncident || fallbackDb.verifyIncident,
    getIncidents: database.getIncidents || fallbackDb.getIncidents,
    getEmergencyBroadcasts: database.getEmergencyBroadcasts || fallbackDb.getEmergencyBroadcasts,
  };
}

let db = loadDatabase();
let {
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
} = resolveDbMethods(db);

const preferredPorts = [Number(process.env.PORT) || 4000, 4001, 4002];

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
  'Access-Control-Max-Age': '86400',
};

function sendJson(res, status, data) {
  res.writeHead(status, headers);
  if (status === 204) {
    res.end();
    return;
  }
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 100 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

async function handleRequest(req, res) {
  const { pathname } = url.parse(req.url || '', true);

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && pathname === '/api/status') {
    const metrics = await getMetrics();
    sendJson(res, 200, { status: 'ok', metrics });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/alerts') {
    const alerts = await getAlerts();
    sendJson(res, 200, { status: 'ok', alerts });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/incidents') {
    const incidents = await getIncidents();
    sendJson(res, 200, { status: 'ok', incidents });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/emergency-broadcasts') {
    const broadcasts = await getEmergencyBroadcasts();
    sendJson(res, 200, { status: 'ok', broadcasts });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/admin/review-alerts') {
    const reviewed = await reviewOpenAlerts();
    sendJson(res, 200, { status: 'ok', reviewed });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/message') {
    const payload = await parseJsonBody(req);
    const name = String(payload.name || '').trim();
    const phone = String(payload.phone || '').trim();
    const message = String(payload.message || payload.text || '').trim();
    const location = payload.location || null;

    if (!name || !phone || !message) {
      sendJson(res, 400, { error: 'Name, phone, and message are required.' });
      return;
    }

    const verification = await verifyIncident({ name, phone, message, location });
    const alert = await createAlert({ name, phone, message, location });
    sendJson(res, 200, {
      status: 'ok',
      alert,
      verification,
      message: verification.isLikelyReal ? 'Incident accepted and emergency channels notified.' : 'Incident recorded for review.',
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/incident/verify') {
    const payload = await parseJsonBody(req);
    const verification = await verifyIncident(payload);
    sendJson(res, 200, { status: 'ok', verification });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/signup') {
    const payload = await parseJsonBody(req);
    const name = String(payload.name || '').trim();
    const email = String(payload.email || '').trim();
    const password = String(payload.password || '').trim();

    if (!name || !email || !password) {
      sendJson(res, 400, { error: 'Name, email, and password are required.' });
      return;
    }

    try {
      const user = await createUser({ name, email, password });
      sendJson(res, 201, { status: 'ok', user });
    } catch (error) {
      sendJson(res, 409, { error: error.message });
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const payload = await parseJsonBody(req);
    const email = String(payload.email || '').trim();
    const password = String(payload.password || '').trim();

    if (!email || !password) {
      sendJson(res, 400, { error: 'Email and password are required.' });
      return;
    }

    const user = await authenticateUser({ email, password });
    if (!user) {
      sendJson(res, 401, { error: 'Invalid email or password.' });
      return;
    }

    sendJson(res, 200, { status: 'ok', user });
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
}

process.on('uncaughtException', (error) => {
  console.error('Unhandled exception:', error && error.stack ? error.stack : error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error && error.stack ? error.stack : error);
});

async function startServer() {
  const requestHandler = (req, res) => {
    handleRequest(req, res).catch((error) => {
      if (error.message === 'Payload too large') {
        sendJson(res, 413, { error: 'Request body too large' });
        return;
      }
      console.error('Request handler error:', error && error.stack ? error.stack : error);
      sendJson(res, 500, { error: 'Internal server error' });
    });
  };

  let lastError;
  for (const port of preferredPorts) {
    try {
      const server = http.createServer(requestHandler);
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, () => resolve(server));
      });
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${port} is already in use. Trying another port if available.`);
        } else {
          console.error('Server error:', error && error.stack ? error.stack : error);
        }
      });
      console.log(`Backend API listening on http://localhost:${port}`);
      return server;
    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('Unable to start backend server.');
}

(async () => {
  try {
    await initDb();
  } catch (error) {
    console.error('Database initialization failed:', error && error.stack ? error.stack : error);
    if (db !== fallbackDb) {
      console.warn('Switching to fallback in-memory database.');
      db = fallbackDb;
      ({
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
      } = resolveDbMethods(db));
      await initDb();
    } else {
      process.exit(1);
    }
  }

  try {
    await startServer();
  } catch (error) {
    console.error('Failed to start server:', error && error.stack ? error.stack : error);
    process.exit(1);
  }
})();
