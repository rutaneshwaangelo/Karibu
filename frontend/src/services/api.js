
// Deploy-time override. Setting VITE_API_URL (e.g. https://my-api.example.com/api
// or simply /api for a same-origin deploy) points the whole SPA at that backend
// without a code change. The default keeps the current production host working.
const DEFAULT_API_BASE_URL = 'https://karibu-backend-0569.onrender.com/api';

export const API_BASE_URL = (
  import.meta.env?.VITE_API_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, '');

/**
 * Realtime server origin. Socket.IO is served by the API process itself, so the
 * socket has to follow the configured API host instead of the page origin -
 * otherwise a frontend and backend on different domains never connect.
 * Defaults to the page's own origin for same-origin / relative API URLs.
 */
export const SOCKET_URL =
  import.meta.env?.VITE_SOCKET_URL ||
  (() => {
    try {
      return new URL(API_BASE_URL, window.location.origin).origin;
    } catch {
      // Relative API URL (e.g. "/api") - the socket lives on this same origin
      return window.location.origin;
    }
  })();

/**
 * Universal API request wrapper with token header injection and error normalization
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('karibu_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || 'An API error occurred');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) =>
    request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) =>
    request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body, options) =>
    request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
