import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faClipboardList, faHelmetSafety} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../../context";
import { servicesService } from "../../api";
import { useApi } from "../../hooks";
import {
  Card,
  Loader,
  ErrorAlert,
  StatusBadge,
  EmptyState,
} from "../../components/common";
import ProgressBar from "./ProgressBar";
import WorkChart from "./WorkChart";



const CustomerDashboard = () => {
  const { user } = useAuth();
  const { loading, error, execute, clearError } = useApi();
  const [requests, setRequests] = useState([]);
  
  const prevRequestsRef = useRef([]);

  const getRecentRequests = useCallback(async () => {
    const data = await servicesService.getRequests();
    return Array.isArray(data)
      ? data.slice(0, 5)
      : data.results?.slice(0, 5) || [];
  }, []);

  const areStatusesEqual = (oldRequests = [], newRequests = []) => {
    if (oldRequests.length !== newRequests.length) return false;

    return oldRequests.every((oldRequest, index) => {
      const newRequest = newRequests[index];
      const oldStatus = oldRequest?.status?.toString()?.trim().toLowerCase() || "";
      const newStatus = newRequest?.status?.toString()?.trim().toLowerCase() || "";
      return oldRequest?.id === newRequest?.id && oldStatus === newStatus;
    });
  };

  useEffect(() => {
    const loadInitialRequests = async () => {
      try {
        const data = await execute(getRecentRequests);
        if (data) {
          setRequests(data);
          prevRequestsRef.current = data;
        }
      } catch (err) {
        // Error handled by useApi
      }
    };

    loadInitialRequests();
  }, [execute, getRecentRequests]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const newData = await getRecentRequests();
        if (!newData) return;

        if (!areStatusesEqual(prevRequestsRef.current, newData)) {
          setRequests(newData);
          prevRequestsRef.current = newData;
        }
      } catch (err) {
        // Ignore polling failures to avoid flashing the dashboard
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [getRecentRequests]);

  const activeRequest = requests?.find(
    (request) =>
      request?.status &&
      !["completed", "cancelled"].includes(request.status.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome Back, {user?.first_name || user?.username}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your service requests.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/customer/search-workers">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center py-4">
              <div className="text-4xl mb-2"><FontAwesomeIcon icon={faMagnifyingGlass} /></div>
              <h3 className="font-medium text-gray-900">Find Workers</h3>
              <p className="text-sm text-gray-500">
                Search for available workers
              </p>
            </div>
          </Card>
        </Link>

        <Link to="/customer/my-requests">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center py-4">
              <div className="text-4xl mb-2"><FontAwesomeIcon icon={faClipboardList} /></div>
              <h3 className="font-medium text-gray-900">Request History</h3>
              <p className="text-sm text-gray-500">Select worker then fill request form</p>
            </div>
          </Card>
        </Link>

        <Link to="/worker/become-worker">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center py-4">
              <div className="text-4xl mb-2"><FontAwesomeIcon icon={faHelmetSafety} /></div>
              <h3 className="font-medium text-gray-900">Become Worker</h3>
              <p className="text-sm text-gray-500">
                Switch to worker mode and start earning
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Requests */}
      <Card title="Current Request">
        <ErrorAlert message={error} onClose={clearError} />

        {loading ? (
         <></>
        ) : requests?.length === 0 ? (
          <EmptyState
            title="No requests yet"
            message="You haven't created any service requests yet."
            icon="📋"
            action={{
              label: "Find Workers",
              onClick: () =>
                (window.location.href = "/customer/search-workers"),
            }}
          />
        ) : activeRequest? (
          <div className="space-y-2">
            <ProgressBar status={activeRequest.status} />
          </div>
        ) : (
          <EmptyState
            title="No active requests"
            message="Your recent request is completed or cancelled."
            icon=""
          />
          
        )}
      </Card>
       <div className="mt-4"></div>
      <Card title="Request Category Split">
       {/* <h4 className="">Request Category split</h4> */}
        <WorkChart/>
      </Card>

  
    </div>
  );
};

export default CustomerDashboard;
