import axios from "axios";

const isDevelopment = import.meta.env.MODE === "development";
// Allow a runtime override (set `window.__API_BASE_URL__` from hosting env)
const runtimeApiBase = typeof window !== "undefined" ? window.__API_BASE_URL__ : undefined;
const envApiBase = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;
const API_BASE_URL = runtimeApiBase || envApiBase || "";

if (!API_BASE_URL) {
  // Helpful warning in console for production debugging
  // This will make it obvious in the browser that the API URL was not provided
  // and that requests will be sent to the frontend host (causing 404s).
  // Remove or silence this in a stable production release if desired.
  // eslint-disable-next-line no-console
  console.warn("API base URL is not defined. Set VITE_API_BASE_URL_PROD at build time or window.__API_BASE_URL__ at runtime.");
} else {
  // eslint-disable-next-line no-console
  console.debug("Using API base URL:", API_BASE_URL);
}
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const response = await api.post("/api/token/refresh/", {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem("access_token", access);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
