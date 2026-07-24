import api from "./axios";

// apis that counter all the services of system
const servicesService = {
  // GET /services/categories/
  // categories of worker for dropdown selection
  getCategories: async () => {
    const response = await api.get("/services/categories/");
    return response.data;
  },

  // GET /services/recommended-workers/?service_category=<category_id_or_name>&radius=<km>
  // finds all the ranked workers
  getRecommendedWorkers: async (serviceCategory, radius) => {
    const params = new URLSearchParams();
    if (serviceCategory) params.append("service_category", serviceCategory);
    if (radius) params.append("radius", radius);

    const response = await api.get(
      `/services/recommended-workers/?${params.toString()}`,
    );
    return response.data;
  },

  // GET /services/requests/
  // all the request of customer
  getRequests: async () => {
    const response = await api.get("/services/requests/");
    return response.data;
  },

  // GET /services/worker/assigned-requests/
  // all the request assigned to worker
  getAssignedRequests: async () => {
    const response = await api.get("/services/worker/assigned-requests/");
    return response.data;
  },

  // POST /services/requests/
  // customer creating request
  createRequest: async (requestData) => {
    const response = await api.post("/services/requests/", requestData);
    return response.data;
  },

  // POST /services/requests/{request_id}/cancel/
  // to cancel request by worker and customer before acceptance for customer
  cancelRequest: async (requestId, reason = "") => {
    const payload = reason?.trim() ? { reason: reason.trim() } : {};
    const response = await api.post(
      `/services/requests/${requestId}/cancel/`,
      payload,
    );
    return response.data;
  },

  // GET /services/worker/inbox/
  // all incoming work request
  getWorkerInbox: async () => {
    const response = await api.get("/services/worker/inbox/");
    return response.data;
  },

  // POST /services/requests/{request_id}/worker-action/
  // workers acceptance or rejection of work
  respondToRequest: async (requestId, action, rejectionReason = "") => {
    const payload = { action };
    if (action === "reject" && rejectionReason.trim()) {
      payload.rejection_reason = rejectionReason.trim();
    }

    const response = await api.post(
      `/services/requests/${requestId}/worker-action/`,
      payload,
    );
    return response.data;
  },

  // POST /services/requests/{request_id}/worker-status/
  // change the request status "pending", "assigned"
  updateRequestStatus: async (requestId, status) => {
    const response = await api.post(
      `/services/requests/${requestId}/worker-status/`,
      { status },
    );
    return response.data;
  },

  // POST /services/requests/{request_id}/confirm-completion/
  // two side confirmation of work completion
  confirmRequestCompletion: async (requestId) => {
    const response = await api.post(
      `/services/requests/${requestId}/confirm-completion/`,
      {},
    );
    return response.data;
  },
};

export default servicesService;
