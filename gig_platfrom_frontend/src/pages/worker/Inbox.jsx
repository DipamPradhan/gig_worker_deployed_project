import { useState, useEffect } from "react";
import { servicesService } from "../../api";
import { useApi } from "../../hooks";
import { useNavigate } from "react-router-dom";



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


// const navigate1 = useNavigate();

const WorkerInbox = () => {
  const navigate1 = useNavigate();

  const { loading, error, execute, clearError } = useApi();
  const [inbox, setInbox] = useState([]);
  const [success, setSuccess] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    requestId: null,
    action: null,
  });

  useEffect(() => {
    fetchInbox();
  }, []);

//   useEffect(() => {
  // fetchInbox();
//   const interval = setInterval(() => {
//     fetchInbox();
//   }, 5000);

//   return () => clearInterval(interval);
// }, []);

  const fetchInbox = async () => {
    try {
      const data = await execute(() => servicesService.getWorkerInbox());
      setInbox(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      // Error handled by useApi
      console.log(err)
    }
  };

  const handleAction = async (requestId, action) => {
    clearError();
    setSuccess("");

    try {
      await execute(() =>
        servicesService.respondToRequest(
          requestId,
          action,
          action === "reject" ? "Worker rejected this request." : "",
        ),
      );
      setSuccess(
        `Request ${action === "accept" ? "accepted" : "rejected"} successfully!`,
      );

      if (action === "accept") {
        navigate1("/worker/jobs");
        return;
      }
      if (action === "reject") {
        navigate1("/worker/dashboard");
        return;
      }

      await fetchInbox();
    } catch (err) {
      // Error handled by useApi
    } finally {
      setConfirmModal({ isOpen: false, requestId: null, action: null });
    }
  };

  const openConfirmModal = (requestId, action) => {
    setConfirmModal({ isOpen: true, requestId, action });
    // navigate1("/worker/jobs")
    
  };

  if (loading && inbox.length === 0) {
    return <Loader text="Loading inbox..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Inbox</h1>
        <Button variant="outline" onClick={fetchInbox} disabled={loading}>
          Refresh
        </Button>
      </div>

      <ErrorAlert message={error} onClose={clearError} />
      <SuccessAlert message={success} onClose={() => setSuccess("")} />

      {inbox.length === 0 ? (
        <EmptyState
          title="No job requests"
          message="There are no pending job requests at this time. Check back later!"
          icon=""
        />
      ) : (
        <div className="space-y-4">
          {inbox.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                {/* info section */}
                <div className="flex-1 mb-4 md:mb-0 w-4/5">

                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900">
                      {item.title || "Service Request"}
                    </h3>
                    <StatusBadge status={item.status || "MATCHING"} />
                  </div>

                  <p className="text-sm text-gray-600 mb-1">
                    <strong> Category: </strong> {" "}
                    {item.category_name || "N/A"}
                  </p>

                  <p className="text-sm text-gray-600 mb-1">
                   <strong> Description: </strong> {" "}
                   {item.description ||
                      "No description provided"}
                  </p>

                  <div className=" mt-2 text-sm text-gray-600">
                    <div>
                      <strong>Customer:</strong>{" "}
                      {item.requester_details?.first_name ||
                        "Anonymous"}
                    </div>
                    <div>
                      <strong>Location:</strong>{" "}
                      {item.request_address || "Not specified"}
                    </div>
                    <div>
                      <strong>Received:</strong>{" "}
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                    {/* accept / reject section */}
                {item.status === "MATCHING" && (
                  <div className="flex flex-col space-y-2 md:ml-4 w-1/5">
                    <Button
                      variant="success"
                      size="lg"
                      
                      onClick={() => {
                        openConfirmModal(item.id, "accept")
                        // navigate1("/worker/jobs")
                      }}
                      disabled={loading}
                    >
                      Accept Job
                    </Button>
                    <Button
                      variant="danger"
                      size="lg"
                      onClick={() => openConfirmModal(item.id, "reject")}
                      disabled={loading}
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.action === "accept" ? "Accept Job?" : "Decline Job?"
        }
        message={
          confirmModal.action === "accept"
            ? "Are you sure you want to accept this job? You will be assigned to this service request."
            : "Are you sure you want to decline this job? It will be removed from your inbox."
        }
        confirmText={confirmModal.action === "accept" ? "Accept" : "Decline"}
        variant={confirmModal.action === "accept" ? "success" : "danger"}
        onConfirm={() =>
          handleAction(confirmModal.requestId, confirmModal.action)
        }
        onCancel={() =>
          setConfirmModal({ isOpen: false, requestId: null, action: null })
        }
      />
    </div>
  );
};

export default WorkerInbox;
