import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authService, accountsService } from "../api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
 
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine user role from the /accounts/me/ response
  // Backend uses user_type field with values: "User", "Worker", "Admin"
  const determineRole = (userData) => {
    const userType = userData.user_type?.toLowerCase();

    if (userType === "admin" || userData.is_staff || userData.is_superuser) {
      return "admin";
    }
    if (userType === "worker") {
      return "worker";
    }
    // Default to customer for "User" type or any other
    return "customer";
  };

  // Fetch current user data
  const fetchUser = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await accountsService.getMe();
      const role = determineRole(userData);
      setUser({ ...userData, role });
      setError(null);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setUser(null);
      // If unauthorized, clear tokens
      if (err.response?.status === 401) {
        authService.logout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Login function
  const login = async (email, password) => {
    setError(null);
    try {
      await authService.login(email, password);
      await fetchUser();
      return true;
    } catch (err) {
      // Better error extraction
      let message = "Login failed";
      if (err.response?.data) {
        const data = err.response.data;
        if (data.detail) {
          message = data.detail;
        } else if (data.non_field_errors) {
          message = Array.isArray(data.non_field_errors)
            ? data.non_field_errors[0]
            : data.non_field_errors;
        } else if (data.email) {
          message = Array.isArray(data.email) ? data.email[0] : data.email;
        } else if (data.password) {
          message = Array.isArray(data.password) ? data.password[0] : data.password;
        }
      }
      setError(message);
      throw new Error(message);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  // Register function
  const register = async (userData) => {
    setError(null);
    try {
      const result = await accountsService.register(userData);
      return result;
    } catch (err) {
      // Don't set a generic error message here - let the component handle it
      // since it already extracts field-specific errors
      throw err;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    await fetchUser();
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && authService.isAuthenticated();
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    refreshUser,
    hasRole,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
