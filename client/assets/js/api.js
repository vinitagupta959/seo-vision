import { showToast } from './components/toast.js';

export const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://seo-vision.onrender.com/api";

/**
 * Perform an HTTP fetch request against the backend REST API.
 * @param {string} endpoint - API route (e.g. '/auth/login')
 * @param {object} options - Request options (headers, body, method)
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('jwt_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  // 204 represents No Content (e.g., successful deletes)
  if (response.status === 204) return null;

  const data = await response.json();
  if (!response.ok) {
    // Session expiration trigger
    if (response.status === 401) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      showToast('Your session has expired. Please login again.', 'error');
      setTimeout(() => {
        window.location.href = '/pages/login.html';
      }, 1500);
    }
    throw new Error(data.message || 'API request failed.');
  }

  return data;
};
