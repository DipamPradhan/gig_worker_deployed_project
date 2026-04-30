import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

const MyRequests = () => {
  const { loading, error, execute, clearError } = useApi();
  const [requests, setRequests] = useState([]);
  const [success, setSuccess] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    requestId: null,
  });

  // useEffect(() => {
  //   fetchRequests();
  // }, []);

    useEffect(() => {
      fetchRequests();
  const interval = setInterval(() => {
    fetchRequests();
  }, 1000);

  return () => clearInterval(interval);
}, []);

  const fetchRequests = async () => {
    try {
      const data = await execute(() => servicesService.getRequests());
      setRequests(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      // Error handled by useApi
    }
  };

  const openCancelModal = (requestId) => {
    setConfirmModal({ isOpen: true, requestId });
  };

  const cancelRequest = async (requestId) => {
    clearError();
    setSuccess("");

    try {
      await execute(() =>
        servicesService.cancelRequest(
          requestId,
          "Cancelled by customer before worker acceptance.",
        ),
      );
      setSuccess("Request cancelled successfully.");
      await fetchRequests();
    } catch (err) {
      // Error handled by useApi
    } finally {
      setConfirmModal({ isOpen: false, requestId: null });
    }
  };

  if (loading && requests.length === 0) {
    return <Loader text="Loading requests..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
        <Link to="/customer/search-workers">
          <Button variant="primary">Find Workers</Button>
        </Link>
      </div>

      <ErrorAlert message={error} onClose={clearError} />
      <SuccessAlert message={success} onClose={() => setSuccess("")} />

      {requests.length === 0 ? (
        <EmptyState
          title="No requests yet"
          message="You haven't created any service requests yet."
          icon="📋"
          action={{
            label: "Find Workers",
            onClick: () => (window.location.href = "/customer/search-workers"),
          }}
        />
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const displayStatus = request.customer_visible_status || request.status;
            const canCancelBeforeAccept =
              !request.assigned_worker && ["OPEN", "MATCHING"].includes(request.status);

            return (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0 flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900">
                      {request.category_name || "Service Request"}
                    </h3>
                    <StatusBadge status={displayStatus} />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {request.description}
                  </p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Request ID: {request.id}</p>
                    <p
                      className="truncate"
                      title={request.request_address || "Not specified"}
                    >
                      Address: {request.request_address || "Not specified"}
                    </p>
                    <p>
                      Created: {new Date(request.created_at).toLocaleString()}
                    </p>
                    {request.assigned_at && (
                      <p>
                        Accepted At: {new Date(request.assigned_at).toLocaleString()}
                      </p>
                    )}
                    {request.expected_start_at && (
                      <p>
                        Work Started At: {new Date(request.expected_start_at).toLocaleString()}
                      </p>
                    )}
                    {request.closed_at && (
                      <p>
                        Work Ended At: {new Date(request.closed_at).toLocaleString()}
                      </p>
                    )}
                    {displayStatus === "REJECTED" && (
                      <p>Rejection Note: {request.cancellation_reason || "Rejected by worker"}</p>
                    )}
                    {request.assigned_worker_details && (
                      <>
                        <p>
                          Worker: {request.assigned_worker_details.first_name}{" "}
                          {request.assigned_worker_details.last_name}
                        </p>
                        <p>
                          Category:{" "}
                          {request.assigned_worker_details.service_category ||
                            "N/A"}
                        </p>
                        <p>
                          Rating:{" "}
                          {request.assigned_worker_details.average_rating || 0}{" "}
                          ({request.assigned_worker_details.total_reviews || 0}{" "}
                          reviews)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-2 md:w-48 md:flex-shrink-0">
                  {canCancelBeforeAccept && (
                    <Button
                      variant="danger"
                      size="sm"
                      className="w-full"
                      onClick={() => openCancelModal(request.id)}
                    >
                      Cancel Request
                    </Button>
                  )}
                  {request.status === "COMPLETED" &&
                    (request.has_review ? (
                      <Button
                        variant="secondary"
                        size="lg"
                        className="w-full"
                        disabled
                      >
                        Review Submitted
                      </Button>
                    ) : (
                      <Link to={`/customer/submit-review?request=${request.id}`}>
                        <Button variant="success" size="lg" className="w-full">
                          Leave Review
                        </Button>
                      </Link>
                    ))}
                  {request.assigned_worker_details && (
                    <Link
                      to={`/customer/reviews?worker=${request.assigned_worker_details.worker_id}`}
                    >
                      <Button variant="danger" size="lg" className="w-full">
                        View Worker
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );})}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Cancel This Request?"
        message="Are you sure you want to cancel this request before worker acceptance?"
        confirmText="Cancel Request"
        variant="danger"
        onConfirm={() => cancelRequest(confirmModal.requestId)}
        onCancel={() => setConfirmModal({ isOpen: false, requestId: null })}
      />
    </div>
  );
};

export default MyRequests;
