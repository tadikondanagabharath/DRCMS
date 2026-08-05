const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const db = require('./db_postgres');
const {
  initDb,
  createAlert,
  getMetrics,
  getAlerts,
  createUser,
  authenticateUser,
  reviewOpenAlerts,
} = db;

const port = process.env.PORT || 4000;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

(async () => {
  try {
    await initDb();
    const server = http.createServer((req, res) => {
      const { pathname } = url.parse(req.url, true);
      if (req.method === 'OPTIONS') {
        res.writeHead(204, headers);
        res.end();
        return;
      }

      if (pathname === '/api/status' && req.method === 'GET') {
        (async () => {
          try {
            const metrics = await getMetrics();
            res.writeHead(200, headers);
            res.end(JSON.stringify({ status: 'ok', metrics }));
          } catch (error) {
            res.writeHead(500, headers);
            res.end(JSON.stringify({ error: error.message }));
          }
        })();
        return;
      }

      if (pathname === '/api/alerts' && req.method === 'GET') {
        (async () => {
          try {
            const alerts = await getAlerts();
            res.writeHead(200, headers);
            res.end(JSON.stringify({ status: 'ok', alerts }));
          } catch (error) {
            res.writeHead(500, headers);
            res.end(JSON.stringify({ error: error.message }));
          }
        })();
        return;
      }

      if (pathname === '/api/admin/review-alerts' && req.method === 'POST') {
        (async () => {
          try {
            const reviewed = await reviewOpenAlerts();
            res.writeHead(200, headers);
            res.end(JSON.stringify({ status: 'ok', reviewed }));
          } catch (error) {
            res.writeHead(500, headers);
            res.end(JSON.stringify({ error: error.message }));
          }
        })();
        return;
      }

      if (pathname === '/api/message' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const name = (payload.name || '').trim();
            const phone = (payload.phone || '').trim();
            const messageText = (payload.message || payload.text || '').trim();
            const location = payload.location || null;

            if (!name || !phone || !messageText) {
              res.writeHead(400, headers);
              res.end(JSON.stringify({ error: 'Name, phone, and message are required.' }));
              return;
            }

            try {
              const alert = await createAlert({ name, phone, message: messageText, location });
              console.log('Alert received and dispatched to rescue teams:', alert);
              res.writeHead(200, headers);
              res.end(JSON.stringify({ status: 'sent', alert }));
            } catch (error) {
              res.writeHead(500, headers);
              res.end(JSON.stringify({ error: error.message }));
            }
          } catch (error) {
            res.writeHead(400, headers);
            res.end(JSON.stringify({ error: 'Invalid JSON payload.' }));
          }
        });
        return;
      }

      if (pathname === '/api/auth/signup' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const name = (payload.name || '').trim();
            const email = (payload.email || '').trim();
            const password = (payload.password || '').trim();

            if (!name || !email || !password) {
              res.writeHead(400, headers);
              res.end(JSON.stringify({ error: 'Name, email, and password are required.' }));
              return;
            }

            try {
              const user = await createUser({ name, email, password });
              res.writeHead(201, headers);
              res.end(JSON.stringify({ status: 'ok', message: 'User created', user }));
            } catch (error) {
              res.writeHead(409, headers);
              res.end(JSON.stringify({ error: error.message }));
            }
          } catch (error) {
            res.writeHead(400, headers);
            res.end(JSON.stringify({ error: 'Invalid JSON payload.' }));
          }
        });
        return;
      }

      if (pathname === '/api/auth/login' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const email = (payload.email || '').trim();
            const password = (payload.password || '').trim();

            if (!email || !password) {
              res.writeHead(400, headers);
              res.end(JSON.stringify({ error: 'Email and password are required.' }));
              return;
            }

            const user = await authenticateUser({ email, password });
            if (!user) {
              res.writeHead(401, headers);
              res.end(JSON.stringify({ error: 'Invalid email or password.' }));
              return;
            }

            res.writeHead(200, headers);
            res.end(JSON.stringify({ status: 'ok', message: 'Login successful', user }));
          } catch (error) {
            res.writeHead(400, headers);
            res.end(JSON.stringify({ error: 'Invalid JSON payload.' }));
          }
        });
        return;
      }

      // Serve frontend static files for non-API GET requests
      if (req.method === 'GET' && !pathname.startsWith('/api')) {
        const frontendDir = path.resolve(__dirname, '../Frontend');
        let filePath = pathname === '/' ? path.join(frontendDir, 'index.html') : path.join(frontendDir, pathname);
        filePath = path.normalize(filePath);
        if (!filePath.startsWith(frontendDir)) {
          res.writeHead(400, headers);
          res.end(JSON.stringify({ error: 'Bad request' }));
          return;
        }

        fs.stat(filePath, (err, stat) => {
          if (err || !stat.isFile()) {
            filePath = path.join(frontendDir, 'index.html');
          }
          fs.readFile(filePath, (err, data) => {
            if (err) {
              res.writeHead(500, headers);
              res.end(JSON.stringify({ error: 'Failed to read file' }));
              return;
            }
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = {
              '.html': 'text/html',
              '.js': 'application/javascript',
              '.css': 'text/css',
              '.json': 'application/json',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.svg': 'image/svg+xml',
              '.ico': 'image/x-icon',
              '.map': 'application/octet-stream'
            };
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            const staticHeaders = Object.assign({}, headers, { 'Content-Type': contentType });
            res.writeHead(200, staticHeaders);
            res.end(data);
          });
        });
        return;
      }

      res.writeHead(404, headers);
      res.end(JSON.stringify({ error: 'Not found' }));
    });
    server.listen(port, () => {
      console.log(`Backend server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
})();
