import { useState, useEffect } from "react";
import { useAuth } from "../../context";
import { accountsService } from "../../api";
import { useApi, useForm } from "../../hooks";
import { getCurrentBrowserLocation, reverseGeocodeAddress } from "../../utils";
import {
  Button,
  Input,
  Card,
  Loader,
  ErrorAlert,
  SuccessAlert,
  LocationPickerModal,
} from "../../components/common";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { loading, error, execute, clearError } = useApi();
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const { values, handleChange, setValues } = useForm({
    current_address: "",
    current_latitude: "",
    current_longitude: "",
    preferred_radius_km: "5",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await execute(() => accountsService.getProfile());
      setProfile(data);
      setValues({
        current_address: data.current_address || "",
        current_latitude: data.current_latitude || "",
        current_longitude: data.current_longitude || "",
        preferred_radius_km: data.preferred_radius_km || "5",
      });
    } catch (err) {
      // Error is handled by useApi
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    clearError();

    try {
      await execute(() =>
        accountsService.updateProfile({
          ...values,
          preferred_radius_km: values.preferred_radius_km
            ? Number(values.preferred_radius_km)
            : 5,
          current_latitude: values.current_latitude
            ? Number(values.current_latitude)
            : null,
          current_longitude: values.current_longitude
            ? Number(values.current_longitude)
            : null,
        }),
      );
      setSuccess("Profile updated successfully!");
      await refreshUser();
    } catch (err) {
      // Error is handled by useApi
    }
  };

  const useCurrentLocation = async () => {
    clearError();
    setSuccess("");

    try {
      const location = await getCurrentBrowserLocation();
      const resolvedAddress = await reverseGeocodeAddress(
        location.latitude,
        location.longitude,
      );

      setValues((prev) => ({
        ...prev,
        current_latitude: String(location.latitude),
        current_longitude: String(location.longitude),
        current_address: resolvedAddress || prev.current_address,
      }));
      setSuccess(
        "Current location and address captured. Save profile to persist it.",
      );
    } catch (err) {
      // useApi does not set errors for non-API actions; surface through window alert fallback.
      window.alert(err.message || "Unable to capture location.");
    }
  };

  const handleMapLocationSelect = async (location) => {
    try {
      const resolvedAddress = await reverseGeocodeAddress(
        location.latitude,
        location.longitude,
      );

      setValues((prev) => ({
        ...prev,
        current_latitude: String(location.latitude),
        current_longitude: String(location.longitude),
        current_address: resolvedAddress || prev.current_address,
      }));
      setSuccess("Location selected from map. Save profile to persist it.");
    } catch {
      setValues((prev) => ({
        ...prev,
        current_latitude: String(location.latitude),
        current_longitude: String(location.longitude),
      }));
      setSuccess("Location selected from map. Save profile to persist it.");
    } finally {
      setIsMapOpen(false);
    }
  };

  if (loading && !profile) {
    return <Loader text="Loading profile..." />;
  }

   const {  logout } = useAuth();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className=" flex items-center justify-between  mb-6">
      <h1 className="text-2xl font-bold text-gray-900 ">My Profile</h1>

        <div className="mt-4 ml-2 flex gap-2">
                {user.role === "customer" && (
                  <Link to="/worker/become-worker">
                    <Button 
                  variant="success"
                  >
                    Become Worker
                  </Button>
                  </Link>
                  
                )}
                <Button
                  onClick={handleLogout}
                  size="md"
                  variant="danger"
                  className="text-sm text-gray-600 hover:text-red-600"
                >
                  Logout
                </Button>
          </div>
    
                </div>
      <Card>
        {/* User Info Section */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Account Information
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Username:</span>
              <span className="ml-2 text-gray-900">{user?.username}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2 text-gray-900">{user?.email}</span>
            </div>
            <div>
              <span className="text-gray-500">Role:</span>
              <span className="ml-2 text-gray-900 capitalize">
                {user?.role}
              </span>
            </div>
            {user?.role === "worker" && (
              <div>
                <span className="text-gray-500">Worker Status:</span>
                <span className="ml-2 text-gray-900">
                  Pending/managed by admin
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Edit Profile Form */}
        <ErrorAlert message={error} onClose={clearError} />
        <SuccessAlert message={success} onClose={() => setSuccess("")} />

        <form onSubmit={handleSubmit}>
          <Input
            label="Address"
            name="current_address"
            value={values.current_address}
            placeholder="Auto-filled from selected location"
            disabled
            readOnly
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Latitude"
              name="current_latitude"
              type="number"
              step="any"
              value={values.current_latitude}
              placeholder="Auto-filled from your location"
              disabled
            />

            <Input
              label="Longitude"
              name="current_longitude"
              type="number"
              step="any"
              value={values.current_longitude}
              placeholder="Auto-filled from your location"
              disabled
            />
          </div>

          <Input
            label="Preferred Radius (km)"
            name="preferred_radius_km"
            type="number"
            min="0.2"
            max="20"
            step="0.1"
            value={values.preferred_radius_km}
            onChange={handleChange}
          />

          <p className="text-sm text-gray-500 mb-4">
            Use your current location to update coordinates quickly.
          </p>

          <div className="mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={useCurrentLocation}
            >
              Use Current Location
            </Button>
            <Button
              type="button"
              variant="outline"
              className="ml-2"
              onClick={() => setIsMapOpen(true)}
            >
              Pick on Map
            </Button>
          </div>

          <Button type="submit" variant="primary" loading={loading}>
            Update Profile
          </Button>
        </form>
         
      </Card>
    
    
    

      <LocationPickerModal
        isOpen={isMapOpen}
        title="Select Your Current Location"
        initialLatitude={values.current_latitude}
        initialLongitude={values.current_longitude}
        onClose={() => setIsMapOpen(false)}
        onSelect={handleMapLocationSelect}
      />
    </div>
  );
};

export default Profile;
