import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faClipboardList, faBarsProgress, faStar } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context";
import { accountsService, servicesService } from "../../api";
import { useApi } from "../../hooks";
import {
  Card,
  Loader,
  ErrorAlert,
  StatusBadge,
  EmptyState,
  SuccessAlert,
} from "../../components/common";
import LocationBar from "./LocationBar";
import WarningAlert from "../../components/common/WarningAlert";

const WorkerDashboard = () => {
  const { user } = useAuth();
  const { loading, error, execute, clearError } = useApi();
  const [workerProfile, setWorkerProfile] = useState(null);
  const [inbox, setInbox] = useState([]);

  // useEffect(() => {
  //   fetchData();
  // }, []);

      useEffect(() => {
        fetchData();
  const interval = setInterval(() => {
    fetchData();
  }, 1000);

  return () => clearInterval(interval);
}, []);

  const fetchData = async () => {
    try {
      const profile = await execute(() => accountsService.getWorkerProfile());
      setWorkerProfile(profile);
    } catch (err) {
      setWorkerProfile(null);
    }

    try {
      const inboxData = await execute(() => servicesService.getWorkerInbox());
      setInbox(
        Array.isArray(inboxData)
          ? inboxData.slice(0, 5)
          : inboxData.results?.slice(0, 5) || [],
      );
    } catch (err) {
      setInbox([]);
    }
  };

  // Check if user needs to complete worker setup
  const needsWorkerSetup = user?.role !== "worker";
  const needsVerification =
    user?.role === "worker" &&
    workerProfile?.verification_status !== "Verified";
  const needsDocument = workerProfile && !workerProfile.has_verified_document;

  return (
    <div>

      {inbox.length>0 &&(
        <WarningAlert message="You have a job request. Please check your inbox" />
      )}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome Back, {user?.first_name || user?.username}!
        </h1>
        <p className="text-gray-600 mt-1">Here's your worker dashboard.</p>
      </div>

      <ErrorAlert message={error} onClose={clearError} />

      {/* Setup Alerts */}
      {needsWorkerSetup && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-yellow-800">
                Complete Your Worker Profile
              </h3>
              <p className="text-sm text-yellow-700">
                You need to register as a worker to start receiving job
                requests.
              </p>
            </div>
            <Link
              to="/worker/become-worker"
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              Become a Worker
            </Link>
          </div>
        </Card>
      )}

      {needsVerification && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <div className="flex items-center">
            <div className="text-3xl mr-4">⏳</div>
            <div>
              <h3 className="font-medium text-blue-800">
                Verification Pending
              </h3>
              <p className="text-sm text-blue-700">
                Your worker account is pending admin verification. You'll be
                notified once approved.
              </p>
            </div>
          </div>
        </Card>
      )}

      {workerProfile?.verification_status === "Rejected" && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <div className="flex items-start">
            <div className="text-3xl mr-4">🛑</div>
            <div>
              <h3 className="font-medium text-red-800">
                Worker Profile Rejected/Halted
              </h3>
              <p className="text-sm text-red-700">
                Reason:{" "}
                {workerProfile.rejection_reason ||
                  "No reason provided by admin."}
              </p>
            </div>
          </div>
        </Card>
      )}

      {needsDocument && user?.role === "worker" && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-orange-800">
                Upload Required Documents
              </h3>
              <p className="text-sm text-orange-700">
                Please upload your verification documents to complete your
                profile.
              </p>
            </div>
            <Link
              to="/worker/upload-document"
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
            >
              Upload Document
            </Link>
          </div>
        </Card>
      )}

      {/* Status Card */}
      {workerProfile && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Availability</p>
              <StatusBadge
                status={(
                  workerProfile.availability_status || "Inactive"
                ).toUpperCase()}
              />
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Verification</p>
              <StatusBadge
                status={
                  workerProfile.verification_status === "Verified"
                    ? "VERIFIED"
                    : workerProfile.verification_status === "Rejected"
                      ? "REJECTED"
                      : "PENDING"
                }
              />
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium text-gray-900">
                {workerProfile.service_category || "Not set"}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Rating</p>
              <p className="font-medium text-gray-900">
                  {Number(workerProfile.average_rating || 0).toFixed(1)} 
                  <span><FontAwesomeIcon icon={faStar} /></span>
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/worker/inbox">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center py-4">
              <div className="relative inline-flex items-center justify-center text-4xl mb-2">
                <FontAwesomeIcon icon={faEnvelope} />
                {inbox.length!=0 && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-600 text-[0.65rem] font-semibold text-white">
                  {inbox.length}
                </span>
                )}
                
              </div>
              <h3 className="font-medium text-gray-900">Job Inbox</h3>
              <p className="text-sm text-gray-500">View available jobs</p>
            </div>
          </Card>
        </Link>

        <Link to="/worker/jobs">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center py-4">
              <div className="text-4xl mb-2"><FontAwesomeIcon icon={faClipboardList} /></div>
              <h3 className="font-medium text-gray-900">My Jobs</h3>
              <p className="text-sm text-gray-500">Manage assigned jobs</p>
            </div>
          </Card>
        </Link>

        <Link to="/worker/availability">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center py-4">
              <div className="text-4xl mb-2"><FontAwesomeIcon icon={faBarsProgress} /></div>
              <h3 className="font-medium text-gray-900">Availability</h3>
              <p className="text-sm text-gray-500">Update your status</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Inbox */}
      {/* <Card title="Recent Job Requests">
        {loading ? (
          <Loader size="sm" />
        ) : inbox.length === 0 ? (
          <EmptyState
            title="No pending requests"
            message="You don't have any pending job requests."
            icon="📭"
          />
        ) : (
          <div className="space-y-4">
            {inbox.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <h4 className="font-medium text-gray-900">
                    {item.category_name || "Service Request"}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={item.status || "MATCHING"} />
              </div>
            ))}

            <div className="text-center pt-4">
              <Link
                to="/worker/inbox"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View all requests →
              </Link>
            </div>
          </div>
        )}
      </Card> */}

{/* job aanalytics */}
<div className="mt-3 analytics-page"></div>
<Card title="Job Location Analytics  ">
        <div className="space-y-4">
          {/* <i className="font-bold text-center ">Location V/S Number of Assigned Jobs</i> */}
          <LocationBar />
        
        </div>
      </Card>

    </div>
  );
};

export default WorkerDashboard;
