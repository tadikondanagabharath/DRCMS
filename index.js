// Root entry that starts the backend server (which serves the frontend)
try {
  require('./Backend/server.js');
  console.log('DRCMS backend started via root index.js');
} catch (err) {
  console.error('Failed to start backend from root index.js:', err && err.stack ? err.stack : err);
  process.exit(1);
}
