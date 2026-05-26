import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  // Navigation items based on role
  const getNavItems = () => {
    if (!user) return [];

    const commonItems = [{ path: "/profile", label: "Profile" }];

    if (user.role === "admin") {
      return [];
    }

    switch (user.role) {
      case "customer":
        return [
          // { path: "/customer/dashboard", label: "Dashboard" },
          { path: "/customer/search-workers", label: "Find Workers" },
          { path: "/customer/my-requests", label: "My Requests" },
          // { path: "/worker/become-worker", label: "Become Worker" },
          // ...commonItems,
        ];
      case "worker":
        return [
          // { path: "/worker/dashboard", label: "Dashboard" },
          { path: "/worker/inbox", label: "Inbox" },
          { path: "/worker/jobs", label: "My Jobs" },
          { path: "/worker/availability", label: "Availability" },
          // ...commonItems,
        ];
      default:
        return commonItems;
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-primary-600">
                GigWork
              </span>
            </Link>
          </div>

          {/* navigations pages */}
          
            {/* Desktop Navigation */}
            {isAuthenticated() && (
              <div className="hidden md:ml-6 md:flex gap-4 md:space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                      isActive(item.path)
                        ? "text-primary-600 border-b-2 border-primary-600"
                        : "text-gray-600 hover:text-primary-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          

          {/* Right side */}
          <div className="flex items-center">
            {isAuthenticated() ? (
              <div className="flex items-center space-x-4">
                <span className="hidden sm:block text-sm text-gray-600">
                  Hello, {user?.username}{" "}
                  <span className="text-xs text-gray-400">({user?.role=="customer"?"C":user?.role=="worker"?"W":user?.role=="admin"?"A":""})</span>
                </span>
                <Link to="/profile"> 
                <FontAwesomeIcon icon={faUser} />

                </Link>
                {/* <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-red-600"
                >
                  Logout
                </button> */}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-primary-600"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {isAuthenticated() && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden ml-4 p-2 rounded text-gray-600 hover:bg-gray-100"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isAuthenticated() && mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="py-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 text-sm ${
                  isActive(item.path)
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
