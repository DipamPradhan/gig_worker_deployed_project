import axios from "axios";

const isDevelopment = import.meta.env.MODE === "development";
// const API_BASE_URL = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;
// const API_BASE_URL = "http://127.0.0.1:8000/";
const API_BASE_URL = "https://api.gig-work.me/";
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
});

  // Request interceptor to add auth 
  // adding the bearer token on each api to make it secure
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
  // checking to see if the access token is expired and in case refreshing it. 
  api.interceptors.response.use(
    // if everything fine send response normal
    (response) => response,
    // if error
    async (error) => {
      const originalRequest = error.config;

      // If error is 401  (unauthorized check) and we haven't tried to refresh yet
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
            //  if refresh failed, clear tokens and redirect to login
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        } else {
          // if No refresh token then redirect to login
          window.location.href = "/login";
        }
      }

      return Promise.reject(error);
    },
  );

  export default api;
