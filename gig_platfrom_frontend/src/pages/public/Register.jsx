import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context";
import {
  Button,
  Input,
  ErrorAlert,
  SuccessAlert,
  Card,
} from "../../components/common";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password2: "",
    first_name: "",
    last_name: "",
    phone_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email) errors.email = "Email is required";
    if (!formData.first_name) errors.first_name = "First name is required";
    if (!formData.last_name) errors.last_name = "Last name is required";
    if (!formData.phone_number) errors.phone_number = "Phone number is required";
    if (!formData.password) errors.password = "Password is required";
    if (formData.password !== formData.password2) {
      errors.password2 = "Passwords do not match";
    }
    if (formData.password && formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      await register(formData);
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (err) {
      // Handle field-specific errors from backend
      if (err.response?.data) {
        const backendErrors = err.response.data;
        if (typeof backendErrors === "object" && !backendErrors.detail) {
          const newFieldErrors = {};
          Object.keys(backendErrors).forEach((key) => {
            const value = backendErrors[key];
            newFieldErrors[key] = Array.isArray(value) ? value[0] : value;
          });
          setFieldErrors(newFieldErrors);
          // Create a summary error message
          const errorMessages = Object.entries(newFieldErrors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join(", ");
          setError(errorMessages || "Registration failed. Please check your input.");
        } else {
          setError(backendErrors.detail || "Registration failed. Please try again.");
        }
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GigWork</h1>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>

        <Card>
          <ErrorAlert message={error} onClose={() => setError("")} />
          <SuccessAlert message={success} />

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Chetan"
                required
                error={fieldErrors.first_name}
              />

              <Input
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Bhattarai"
                required
                error={fieldErrors.last_name}
              />
            </div>

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="chetanbhattarai@gmail.com"
              required
              error={fieldErrors.email}
            />

            <Input
              label="Phone Number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="+xxx xxxxxxxxxx"
              required
              error={fieldErrors.phone_number}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              required
              error={fieldErrors.password}
            />

            <Input
              label="Confirm Password"
              name="password2"
              type="password"
              value={formData.password2}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              error={fieldErrors.password2}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
