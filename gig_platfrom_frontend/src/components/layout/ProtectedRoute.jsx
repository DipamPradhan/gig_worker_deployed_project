import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context";
import { Loader } from "../common";
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated()) {
    // Redirect to login page but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
    // state is used to store the path that user directly wanted to calll but
    //  failed for auth, so redirect after auth complete
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardPaths = {
      customer: "/customer/dashboard",
      worker: "/worker/dashboard",
      admin: "/customer/dashboard",
    };

    return <Navigate to={dashboardPaths[user?.role] || "/"} replace />;
  }

  return children;
};

export default ProtectedRoute;
