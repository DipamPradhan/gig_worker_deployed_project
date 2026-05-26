
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context";
import { Layout, ProtectedRoute } from "./components/layout";

// Public pages
import { Login, Register, NotFound, Profile } from "./pages/public";

// Customer pages
import {
  CustomerDashboard,
  SearchWorkers,
  CreateRequest,
  MyRequests,
  SubmitReview,
  WorkerReviews,
} from "./pages/customer";

// Worker pages
import {
  WorkerDashboard,
  BecomeWorker,
  UploadDocument,
  Availability,
  WorkerInbox,
  AssignedJobs,
} from "./pages/worker";

// Home redirect component
const HomeRedirect = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  const dashboards = {
    customer: "/customer/dashboard",
    worker: "/worker/dashboard",
    admin: "/customer/dashboard",
  };

  return <Navigate to={dashboards[user?.role] || "/login"} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Home redirect */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Protected Routes with Layout */}
          <Route element={<Layout />}>
            {/* Shared Profile - accessible by all authenticated users */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Customer Routes */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/search-workers"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <SearchWorkers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/create-request"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CreateRequest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/my-requests"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <MyRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/submit-review"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <SubmitReview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/reviews"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <WorkerReviews />
                </ProtectedRoute>
              }
            />

            {/* Worker Routes */}
            <Route
              path="/worker/dashboard"
              element={
                <ProtectedRoute allowedRoles={["worker"]}>
                  <WorkerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/become-worker"
              element={
                <ProtectedRoute allowedRoles={["worker", "customer"]}>
                  <BecomeWorker />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/upload-document"
              element={
                <ProtectedRoute allowedRoles={["worker"]}>
                  <UploadDocument />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/availability"
              element={
                <ProtectedRoute allowedRoles={["worker"]}>
                  <Availability />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/inbox"
              element={
                <ProtectedRoute allowedRoles={["worker"]}>
                  <WorkerInbox />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/jobs"
              element={
                <ProtectedRoute allowedRoles={["worker"]}>
                  <AssignedJobs />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
