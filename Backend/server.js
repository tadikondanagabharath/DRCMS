const http = require('http');
const fs = require('fs');
const path = require('path');
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
const frontendRoot = path.resolve(__dirname, '..', 'Frontend');
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:3001,http://localhost:3000,http://127.0.0.1:3001,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function getCorsHeaders(req) {
  const requestOrigin = req.headers.origin;
  const allowAll = process.env.ALLOW_ALL_ORIGINS === 'true';
  const isAllowed = Boolean(requestOrigin && (allowAll || allowedOrigins.includes(requestOrigin)));
  const origin = isAllowed ? requestOrigin : (allowedOrigins[0] || '*');

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
    'Access-Control-Max-Age': '86400',
  };
}

function applyCorsHeaders(res, req) {
  const headers = getCorsHeaders(req);
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

function sendJson(res, status, data, req) {
  applyCorsHeaders(res, req);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  if (status === 204) {
    res.end();
    return;
  }
  res.end(JSON.stringify(data));
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

function serveStatic(req, res) {
  const { pathname } = url.parse(req.url || '/', true);
  const safePath = decodeURIComponent(pathname || '/');
  const relativePath = safePath === '/' ? 'index.html' : safePath.replace(/^\/+/, '');
  const resolvedPath = path.resolve(frontendRoot, relativePath);
  const basePath = path.resolve(frontendRoot);
  const relativeToBase = path.relative(basePath, resolvedPath);

  if (relativeToBase.startsWith('..') || path.isAbsolute(relativeToBase)) {
    sendJson(res, 403, { error: 'Forbidden' }, req);
    return;
  }

  const filePath = fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()
    ? resolvedPath
    : path.join(basePath, 'index.html');

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendJson(res, 404, { error: 'Not found' }, req);
    return;
  }

  applyCorsHeaders(res, req);
  res.writeHead(200, {
    'Content-Type': getContentType(filePath),
    'Cache-Control': 'no-store',
  });

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'Unable to read static asset' }, req);
      return;
    }
    res.destroy();
  });
  stream.pipe(res);
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
    sendJson(res, 204, {}, req);
    return;
  }

  if (pathname && pathname.startsWith('/api/')) {
    if (req.method === 'GET' && pathname === '/api/status') {
      const metrics = await getMetrics();
      sendJson(res, 200, { status: 'ok', metrics }, req);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/alerts') {
      const alerts = await getAlerts();
      sendJson(res, 200, { status: 'ok', alerts }, req);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/incidents') {
      const incidents = await getIncidents();
      sendJson(res, 200, { status: 'ok', incidents }, req);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/emergency-broadcasts') {
      const broadcasts = await getEmergencyBroadcasts();
      sendJson(res, 200, { status: 'ok', broadcasts }, req);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/admin/review-alerts') {
      const reviewed = await reviewOpenAlerts();
      sendJson(res, 200, { status: 'ok', reviewed }, req);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/message') {
      const payload = await parseJsonBody(req);
      const name = String(payload.name || '').trim();
      const phone = String(payload.phone || '').trim();
      const message = String(payload.message || payload.text || '').trim();
      const location = payload.location || null;

      if (!name || !phone || !message) {
        sendJson(res, 400, { error: 'Name, phone, and message are required.' }, req);
        return;
      }

      const verification = await verifyIncident({ name, phone, message, location });
      const alert = await createAlert({ name, phone, message, location });
      sendJson(res, 200, {
        status: 'ok',
        alert,
        verification,
        message: verification.isLikelyReal ? 'Incident accepted and emergency channels notified.' : 'Incident recorded for review.',
      }, req);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/incident/verify') {
      const payload = await parseJsonBody(req);
      const verification = await verifyIncident(payload);
      sendJson(res, 200, { status: 'ok', verification }, req);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/auth/signup') {
      const payload = await parseJsonBody(req);
      const name = String(payload.name || '').trim();
      const email = String(payload.email || '').trim();
      const password = String(payload.password || '').trim();

      if (!name || !email || !password) {
        sendJson(res, 400, { error: 'Name, email, and password are required.' }, req);
        return;
      }

      try {
        const user = await createUser({ name, email, password });
        sendJson(res, 201, { status: 'ok', user }, req);
      } catch (error) {
        sendJson(res, 409, { error: error.message }, req);
      }
      return;
    }

    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const payload = await parseJsonBody(req);
      const email = String(payload.email || '').trim();
      const password = String(payload.password || '').trim();

      if (!email || !password) {
        sendJson(res, 400, { error: 'Email and password are required.' }, req);
        return;
      }

      const user = await authenticateUser({ email, password });
      if (!user) {
        sendJson(res, 401, { error: 'Invalid email or password.' }, req);
        return;
      }

      sendJson(res, 200, { status: 'ok', user }, req);
      return;
    }

    sendJson(res, 404, { error: 'Not found' }, req);
    return;
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 404, { error: 'Not found' }, req);
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
        sendJson(res, 413, { error: 'Request body too large' }, req);
        return;
      }
      console.error('Request handler error:', error && error.stack ? error.stack : error);
      sendJson(res, 500, { error: 'Internal server error' }, req);
    });
  };

  let lastError;
  for (const port of preferredPorts) {
    try {
      const server = http.createServer(requestHandler);
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '0.0.0.0', () => resolve(server));
      });
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${port} is already in use. Trying another port if available.`);
        } else {
          console.error('Server error:', error && error.stack ? error.stack : error);
        }
      });
      console.log(`DRCMS app listening on http://0.0.0.0:${port}`);
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
