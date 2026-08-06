function getApiCandidates() {
  const currentOrigin = typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null'
    ? window.location.origin
    : '';

  return [currentOrigin, 'http://127.0.0.1:4000', 'http://localhost:4000'].filter(Boolean);
}

function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiCandidates()[0]}${normalizedPath}`;
}

async function apiRequest(path, options = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const candidates = getApiCandidates();
  let lastError = new Error('Unable to reach the backend.');

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}${normalizedPath}`, options);
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : await response.text();

      if (response.ok) {
        return typeof data === 'string' ? { message: data } : (data || {});
      }

      lastError = new Error(typeof data === 'object' && data !== null ? (data.error || data.message || 'Request failed') : (data || 'Request failed'));
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export { buildApiUrl, apiRequest };
