/**
 * API Configuration
 * Centralized API endpoint management
 */

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:32000';

export const API_ENDPOINTS = {
  // Health
  HEALTH: `${API_BASE_URL}/status`, // Keep as is or update if backend changed
  PING: `${API_BASE_URL}/status`, // Changed to match server.py /status

  // Authentication
  SIGNUP: `${API_BASE_URL}/api/user/signup`,
  LOGIN: `${API_BASE_URL}/api/user/login`,

  // User
  PROFILE: `${API_BASE_URL}/api/user/me`,
  CREDITS: `${API_BASE_URL}/api/user`, // Base for credits

  // Generation
  GENERATE_IMAGE: `${API_BASE_URL}/api/generate`,
  GENERATE_VIDEO: `${API_BASE_URL}/api/generate-video`,

  // Admin
  ADMIN_LOGIN: `${API_BASE_URL}/api/admin/login`,
  ADMIN_USERS: `${API_BASE_URL}/api/admin/users`,
  ADMIN_GENERATIONS: `${API_BASE_URL}/api/admin/generations`,
  ADMIN_STATS: `${API_BASE_URL}/api/admin/analytics`,

  // Helper to get history endpoint
  getHistory: (email) => `${API_BASE_URL}/api/user/${email}/generations`,
  getCredits: (email) => `${API_BASE_URL}/api/user/${email}/credits`,
  useCredits: (email) => `${API_BASE_URL}/api/user/${email}/use-credits`,
  addCredits: (email) => `${API_BASE_URL}/api/user/${email}/add-credits`,
};

export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
};

export const getApiUrl = (endpoint) => {
  return API_ENDPOINTS[endpoint] || endpoint;
};
