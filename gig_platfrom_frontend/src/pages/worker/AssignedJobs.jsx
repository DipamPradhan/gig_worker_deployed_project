import { useState, useEffect } from "react";
import { servicesService } from "../../api";
import { useApi } from "../../hooks";
import {
  Card,
  Button,
  Loader,
  ErrorAlert,
  SuccessAlert,
  EmptyState,
  StatusBadge,
  ConfirmModal,
} from "../../components/common";

const AssignedJobs = () => {
  const { loading, error, execute, clearError } = useApi();
  const [jobs, setJobs] = useState([]);
  const [success, setSuccess] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    requestId: null,
    status: null,
  });

  useEffect(() => {
    fetchJobs();
  }, []);

//       useEffect(() => {
//         fetchJobs();
//   const interval = setInterval(() => {
//     fetchJobs();
//   }, 1000);

//   return () => clearInterval(interval);
// }, []);

  const fetchJobs = async () => {
    try {
      const data = await execute(() => servicesService.getAssignedRequests());
      setJobs(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      // Error handled by useApi
    }
  };

  const updateStatus = async (requestId, status) => {
    clearError();
    setSuccess("");

    try {
      await execute(() =>
        servicesService.updateRequestStatus(requestId, status),
      );
      setSuccess(`Status updated to ${status.replace("_", " ")}`);
      await fetchJobs();
    } catch (err) {
      // Error handled by useApi
    } finally {
      setConfirmModal({ isOpen: false, requestId: null, status: null });
    }
  };

  const openConfirmModal = (requestId, status) => {
    setConfirmModal({ isOpen: true, requestId, status });
  };

  // Get allowed next statuses based on current status
  const getNextStatuses = (currentStatus) => {
    const statusFlow = {
      ASSIGNED: ["ARRIVING", "CANCELLED"],
      ARRIVING: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED", "CANCELLED"],
    };
    return statusFlow[currentStatus] || [];
  };

  const getStatusButtonStyle = (status) => {
    switch (status) {
      case "ARRIVING":
        return "primary";
      case "IN_PROGRESS":
        return "warning";
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "ARRIVING":
        return "Mark as Arriving";
      case "IN_PROGRESS":
        return "Start Work";
      case "COMPLETED":
        return "Mark Complete";
      case "CANCELLED":
        return "Cancel Job";
      default:
        return status;
    }
  };

  if (loading && jobs.length === 0) {
    return <Loader text="Loading jobs..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Assigned Jobs</h1>
        <Button variant="outline" onClick={fetchJobs} disabled={loading}>
          Refresh
        </Button>
      </div>

      <ErrorAlert message={error} onClose={clearError} />
      <SuccessAlert message={success} onClose={() => setSuccess("")} />

      {jobs.length === 0 ? (
        <EmptyState
          title="No assigned jobs"
          message="You don't have any assigned jobs at the moment."
          icon="📋"
        />
      ) : (
        <div className="space-y-4">
          {jobs.map((item) => {
            const request = item;
            const requestId = request.id;
            const currentStatus = request.status || "ASSIGNED";
            const nextStatuses = getNextStatuses(currentStatus);

            return (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 mb-4 md:mb-0 w-4/5">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">
                        {request.title || "Service Request"}
                      </h3>
                      <StatusBadge status={currentStatus} />
                    </div>

                    <p className="text-sm text-gray-600 mb-1">
                      <strong> Category: </strong>{" "}
                     {request.category_name || "N/A"}
                    </p>

                    <p className="text-sm text-gray-600 mb-1">
                     <strong> Description: </strong>{" "}
                      {request.description || "No description provided"}
                    </p>

                    <div className=" mt-2 text-sm text-gray-600">
                      <div>
                        <strong>Customer:</strong>{" "}
                        {request.requester_details?.first_name || "Anonymous"}{" "}
                        {request.requester_details?.last_name || ""}
                      </div>
                      <div>
                        <strong>Phone:</strong>{" "}
                        {request.requester_details?.phone_number || "Not available"}
                      </div>
                      <div>
                        <strong>Address:</strong>{" "}
                        {request.request_address || "Not specified"}
                      </div>
                      <div>
                        <strong>Created:</strong>{" "}
                        {new Date(request.created_at).toLocaleString()}
                      </div>
                      {request.expected_start_at && (
                        <div>
                          <strong>Work Started:</strong>{" "}
                          {new Date(request.expected_start_at).toLocaleString()}
                        </div>
                      )}
                      {request.closed_at && (
                        <div>
                          <strong>Work Ended:</strong>{" "}
                          {new Date(request.closed_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Update Buttons */}
                  <div className="flex flex-col space-y-2 md:ml-4 w-1/5">
                    {nextStatuses.map((status) => (
                      <Button
                        key={status}
                        variant={getStatusButtonStyle(status)}
                        size="lg"
                        onClick={() => openConfirmModal(requestId, status)}
                        disabled={loading}
                      >
                        {getStatusLabel(status)}
                      </Button>
                    ))}

                    {currentStatus === "COMPLETED" && (
                      <div className="text-green-600 font-medium text-center">
                        ✓ Completed
                      </div>
                    )}

                    {currentStatus === "CANCELLED" && (
                      <div className="text-red-600 font-medium text-center">
                        ✗ Cancelled
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={`Update Status to ${confirmModal.status?.replace("_", " ")}?`}
        message={
          confirmModal.status === "CANCELLED"
            ? "Are you sure you want to cancel this job? This action cannot be undone."
            : `Are you sure you want to update the job status to ${confirmModal.status?.replace("_", " ")}?`
        }
        confirmText="Update Status"
        variant={confirmModal.status === "CANCELLED" ? "danger" : "primary"}
        onConfirm={() =>
          updateStatus(confirmModal.requestId, confirmModal.status)
        }
        onCancel={() =>
          setConfirmModal({ isOpen: false, requestId: null, status: null })
        }
      />
    </div>
  );
};

export default AssignedJobs;
