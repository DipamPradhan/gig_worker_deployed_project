import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context";
import { accountsService, servicesService } from "../../api";
import { useApi, useForm } from "../../hooks";
import { getCurrentBrowserLocation } from "../../utils";
import {
  Card,
  Button,
  Input,
  Select,
  TextArea,
  Loader,
  ErrorAlert,
  SuccessAlert,
  LocationPickerModal,
  Label,
} from "../../components/common";

const BecomeWorker = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { loading, error, execute, clearError } = useApi();
  const [categories, setCategories] = useState([]);
  const [success, setSuccess] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);

  const { values, handleChange } = useForm({
    service_category: "",
    skills: "",
    bio: "",
    hourly_rate: "",
    service_radius_km: "10",
    service_latitude: "",
    service_longitude: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await execute(() => servicesService.getCategories());
      setCategories(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      // Error handled by useApi
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setSuccess("");

    try {
      const workerData = {
        service_category: values.service_category,
        skills: values.skills,
        bio: values.bio,
        hourly_rate: values.hourly_rate ? parseFloat(values.hourly_rate) : null,
        service_radius_km: values.service_radius_km
          ? parseFloat(values.service_radius_km)
          : 10,
        service_latitude: values.service_latitude
          ? parseFloat(values.service_latitude)
          : null,
        service_longitude: values.service_longitude
          ? parseFloat(values.service_longitude)
          : null,
      };

      await execute(() => accountsService.becomeWorker(workerData));
      setSuccess(
        "Successfully registered as a worker! Please upload required documents.",
      );
      await refreshUser();
      setTimeout(() => {
        navigate("/worker/upload-document");
      }, 2000);
    } catch (err) {
      // Error handled by useApi
    }
  };

  const handleUseCurrentLocation = async () => {
    clearError();
    try {
      const location = await getCurrentBrowserLocation();
      handleChange({
        target: { name: "service_latitude", value: String(location.latitude) },
      });
      handleChange({
        target: {
          name: "service_longitude",
          value: String(location.longitude),
        },
      });
    } catch (err) {
      // Error surfaced as local success/error banner for consistency
      setSuccess("");
    }
  };

  const handleMapLocationSelect = (location) => {
    handleChange({
      target: { name: "service_latitude", value: String(location.latitude) },
    });
    handleChange({
      target: {
        name: "service_longitude",
        value: String(location.longitude),
      },
    });
    setIsMapOpen(false);
  };

  // Redirect if already a worker
  if (user?.role === "worker") {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            You're already a worker!
          </h2>
          <p className="text-gray-600 mb-4">
            Your worker account is pending verification and profile updates.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate("/worker/dashboard")}
          >
            Go to Dashboard
          </Button>
        </div>
      </Card>
    );
  }

  const categoryOptions = categories.map((cat) => ({
    value: cat.name || cat.id,
    label: cat.name || cat.title,
  }));

  if (loading && categories.length === 0) {
    return <Loader text="Loading..." />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Become a Worker</h1>

      <Card>
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Start Earning with GigWork
          </h2>
          <p className="text-gray-600">
            Fill out the form below to register as a service provider. Once
            approved, you'll be able to receive and accept job requests from
            customers.
          </p>
        </div>

        <ErrorAlert message={error} onClose={clearError} />
        <SuccessAlert message={success} />

        <form onSubmit={handleSubmit}>
          <Select
            label="Service Category"
            name="service_category"
            value={values.service_category}
            onChange={handleChange}
            options={categoryOptions}
            placeholder="Select your service category"
            required
          />

          <TextArea
            label="Skills"
            name="skills"
            value={values.skills}
            onChange={handleChange}
            placeholder="Wiring, repair, diagnostics..."
            rows={3}
          />

          <TextArea
            label="Bio"
            name="bio"
            value={values.bio}
            onChange={handleChange}
            placeholder="Tell customers about yourself, your skills, and experience..."
            rows={4}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Hourly Rate ($)"
              name="hourly_rate"
              type="number"
              step="0.01"
              value={values.hourly_rate}
              onChange={handleChange}
              placeholder="e.g., 25.00"
              min="0"
            />

            <Input
              label="Service Radius (km)"
              name="service_radius_km"
              type="number"
              step="0.1"
              value={values.service_radius_km}
              onChange={handleChange}
              min="0.2"
              max="50"
            />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 mb-3">
             <Label 
             children="Location"
             required="true"></Label>
              <Button

              type="button"
              variant="outline"
              className="self-end"
              onClick={handleUseCurrentLocation}
            >
              Use Current Location
            </Button>

            <Button
              type="button"
              variant="outline"
              className="self-end"
              onClick={() => setIsMapOpen(true)}
            >
              Pick on Map
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Service Latitude"
              name="service_latitude"
              type="number"
              step="any"
              value={values.service_latitude}
              placeholder="Auto-fill using location"
              disabled
            />
            <Input
              label="Service Longitude"
              name="service_longitude"
              type="number"
              step="any"
              value={values.service_longitude}
              placeholder="Auto-fill using location"
              disabled
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <h4 className="font-medium text-blue-800 mb-2">
              What happens next?
            </h4>
            <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
              <li>Submit this form to create your worker profile</li>
              <li>Upload required verification documents</li>
              <li>Wait for admin approval</li>
              <li>Start receiving and accepting job requests!</li>
            </ol>
          </div>

          <div className="flex space-x-4">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
            >
              Register as Worker
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      <LocationPickerModal
        isOpen={isMapOpen}
        title="Select Service Location"
        initialLatitude={values.service_latitude}
        initialLongitude={values.service_longitude}
        onClose={() => setIsMapOpen(false)}
        onSelect={handleMapLocationSelect}
      />
    </div>
  );
};

export default BecomeWorker;
