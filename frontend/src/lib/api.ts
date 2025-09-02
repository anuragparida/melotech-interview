// lib/api.ts
// API configuration for backend services

// Base URL configuration
const API_BASE_URL = import.meta.env.PROD
  ? "https://melotech.anuragparida.com/api"
  : "http://localhost:8000";

// WebSocket URL configuration
export const WS_BASE_URL = import.meta.env.PROD
  ? "wss://melotech.anuragparida.com/ws"
  : "ws://localhost:8000/ws";

// API utility functions
export const api = {
  baseURL: API_BASE_URL,

  // Generic fetch wrapper
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  },

  // GET request
  async get(endpoint: string) {
    return this.request(endpoint, { method: "GET" });
  },

  // POST request
  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // PUT request
  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // DELETE request
  async delete(endpoint: string) {
    return this.request(endpoint, { method: "DELETE" });
  },
};

export default api;
