/**
 * API Client Service
 * Handles all HTTP requests to the backend with error handling, retries, and timeouts
 */

import { API_CONFIG, API_ENDPOINTS } from '../config/api';

class ApiClient {
  constructor() {
    this.timeout = API_CONFIG.timeout;
    this.retries = API_CONFIG.retries;
    this.retryDelay = API_CONFIG.retryDelay;
  }

  /**
   * Make an HTTP request with retry logic and error handling
   */
  async request(url, options = {}) {
    const maxRetries = options.retries ?? this.retries;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...API_CONFIG.headers,
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new ApiError(
            `HTTP ${response.status}`,
            response.status,
            await response.text()
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          await new Promise(resolve => 
            setTimeout(resolve, this.retryDelay * (attempt + 1))
          );
        }
      }
    }

    throw lastError;
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    const url = typeof endpoint === 'string' 
      ? endpoint 
      : API_ENDPOINTS[endpoint] || endpoint;
    
    return this.request(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data, options = {}) {
    const url = typeof endpoint === 'string' 
      ? endpoint 
      : API_ENDPOINTS[endpoint] || endpoint;
    
    // Don't set Content-Type for FormData
    const headers = data instanceof FormData 
      ? {} 
      : { 'Content-Type': 'application/json' };

    const body = data instanceof FormData ? data : JSON.stringify(data);

    return this.request(url, {
      ...options,
      method: 'POST',
      headers,
      body,
    });
  }

  /**
   * Add authorization token to requests
   */
  setAuthToken(token) {
    if (token) {
      API_CONFIG.headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete API_CONFIG.headers['Authorization'];
    }
  }

  /**
   * Clear authorization token
   */
  clearAuthToken() {
    delete API_CONFIG.headers['Authorization'];
  }
}

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
