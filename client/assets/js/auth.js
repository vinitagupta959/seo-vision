import { apiRequest } from './api.js';

// Save user session in localStorage
export const setSession = (token, user) => {
  localStorage.setItem('jwt_token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

// Clear user session
export const clearSession = () => {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user');
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Get current JWT token
export const getToken = () => {
  return localStorage.getItem('jwt_token');
};

// Check if authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Register request
export const register = async (name, email, password) => {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: { name, email, password }
  });
  setSession(data.token, data.data.user);
  return data;
};

// Login request
export const login = async (email, password) => {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  setSession(data.token, data.data.user);
  return data;
};

// Logout request
export const logout = () => {
  clearSession();
  window.location.href = '/pages/login.html';
};

// Fetch user profile from database
export const fetchProfile = async () => {
  const data = await apiRequest('/auth/profile', { method: 'GET' });
  localStorage.setItem('user', JSON.stringify(data.data.user));
  return data.data.user;
};

// Update user profile
export const updateProfile = async (name, email, password) => {
  const payload = {};
  if (name) payload.name = name;
  if (email) payload.email = email;
  if (password) payload.password = password;

  const data = await apiRequest('/auth/profile', {
    method: 'PUT',
    body: payload
  });
  
  // Refresh stored user session
  setSession(localStorage.getItem('jwt_token'), data.data.user);
  return data.data.user;
};

// Protection helper: redirect to login if not authenticated
export const checkAuthAndProtect = () => {
  if (!isAuthenticated()) {
    window.location.href = '/pages/login.html';
  }
};

// Protection helper: redirect to dashboard if already authenticated
export const checkGuestAndRedirect = () => {
  if (isAuthenticated()) {
    window.location.href = '/pages/dashboard.html';
  }
};
