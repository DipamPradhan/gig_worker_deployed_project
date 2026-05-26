import api from "./axios";

const authService = {
  // POST /api/token/
  login: async (email, password) => {
    const response = await api.post("/api/token/", { email, password });
    const { access, refresh } = response.data;

    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);

    return response.data;
  },

  // POST /api/token/refresh/
  refreshToken: async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await api.post("/api/token/refresh/", {
      refresh: refreshToken,
    });
    const { access } = response.data;

    localStorage.setItem("access_token", access);

    return response.data;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("access_token");
  },

  getAccessToken: () => {
    return localStorage.getItem("access_token");
  },
};

export default authService;
