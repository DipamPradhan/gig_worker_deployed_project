import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context";
import { accountsService } from "../../api";
import { useApi } from "../../hooks";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faToggleOn, faToggleOff, faUserTie} from "@fortawesome/free-solid-svg-icons";
import {
  Card,
  Button,
  Loader,
  ErrorAlert,
  SuccessAlert,
  StatusBadge,
} from "../../components/common";

const Availability = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { loading, error, execute, clearError } = useApi();
  const [workerProfile, setWorkerProfile] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchWorkerProfile();
  }, []);

  const fetchWorkerProfile = async () => {
    try {
      const data = await execute(() => accountsService.getWorkerProfile());
      setWorkerProfile(data);
    } catch (err) {
      // Error handled by useApi
    }
  };

  const updateAvailability = async (status) => {
    clearError();
    setSuccess("");

    try {
      await execute(() => accountsService.updateAvailability(status));
      setSuccess(`Status updated to ${status}`);
      await fetchWorkerProfile();
      await refreshUser();
    } catch (err) {
      // Error handled by useApi
    }
  };

  if (loading && !workerProfile) {
    return <Loader text="Loading..." />;
  }

  // Check if worker can change availability
  const canBeActive =
    workerProfile?.verification_status === "Verified" &&
    workerProfile?.has_verified_document;
  const currentStatus = workerProfile?.availability_status || "Inactive";

  const availabilityOptions = [
    {
      value: "Active",
      label: "Active",
      description: "Available to receive and accept job requests",
      icon: faToggleOn,
      disabled: !canBeActive,
    },
    {
      value: "Inactive",
      label: "Inactive",
      description: "Not accepting any job requests",
      icon: faToggleOff,
      disabled: false,
    },
    {
      value: "Busy",
      label: "Busy",
      description: "Currently working, not accepting new requests",
      icon: faUserTie,
      disabled: !canBeActive,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Availability Settings
      </h1>

      <ErrorAlert message={error} onClose={clearError} />
      <SuccessAlert message={success} onClose={() => setSuccess("")} />

      {/* Current Status */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Current Status
            </h2>
            <p className="text-sm text-gray-500">
              Your current availability status
            </p>
          </div>
          <StatusBadge status={currentStatus.toUpperCase()} />
        </div>
      </Card>

      {/* Verification Status */}
      {!canBeActive && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <div className="flex items-start">
            <div className="text-2xl mr-4">⚠️</div>
            <div>
              <h3 className="font-medium text-yellow-800">
                Cannot Set Active Status
              </h3>
              <p className="text-sm text-yellow-700 mb-2">
                To set your status to Active or Busy, you need:
              </p>
              <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                {workerProfile?.verification_status !== "Verified" && (
                  <li>Worker verification (pending admin approval)</li>
                )}
                {!workerProfile?.has_verified_document && (
                  <li>
                    A verified document{" "}
                    <button
                      onClick={() => navigate("/worker/upload-document")}
                      className="text-yellow-800 underline"
                    >
                      Upload now
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Availability Options */}
      <Card title="Set Your Availability">
        <div className="space-y-4">
          {availabilityOptions.map((option) => (
            <div
              key={option.value}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                currentStatus === option.value
                  ? "border-primary-500 bg-primary-50"
                  : option.disabled
                    ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                    : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
              }`}
              onClick={() => {
                if (!option.disabled && currentStatus !== option.value) {
                  updateAvailability(option.value);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3"><FontAwesomeIcon icon={option.icon} /></span>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {option.label}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {option.description}
                    </p>
                  </div>
                </div>
                {currentStatus === option.value && (
                  <span className="text-primary-600">✓ Current</span>
                )}
                {option.disabled && currentStatus !== option.value && (
                  <span className="text-xs text-gray-400">
                    Requires verification
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6">
        <Button variant="outline" onClick={() => navigate("/worker/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Availability;
