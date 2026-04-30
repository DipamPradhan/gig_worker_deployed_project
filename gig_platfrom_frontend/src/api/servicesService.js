import api from "./axios";

const servicesService = {
  // GET /services/categories/
  getCategories: async () => {
    const response = await api.get("/services/categories/");
    return response.data;
  },

  // GET /services/recommended-workers/?service_category=<category_id_or_name>&radius=<km>
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
  getRequests: async () => {
    const response = await api.get("/services/requests/");
    return response.data;
  },

  // GET /services/worker/assigned-requests/
  getAssignedRequests: async () => {
    const response = await api.get("/services/worker/assigned-requests/");
    return response.data;
  },

  // POST /services/requests/
  createRequest: async (requestData) => {
    const response = await api.post("/services/requests/", requestData);
    return response.data;
  },

  // POST /services/requests/{request_id}/cancel/
  cancelRequest: async (requestId, reason = "") => {
    const payload = reason?.trim() ? { reason: reason.trim() } : {};
    const response = await api.post(`/services/requests/${requestId}/cancel/`, payload);
    return response.data;
  },

  // GET /services/worker/inbox/
  getWorkerInbox: async () => {
    const response = await api.get("/services/worker/inbox/");
    return response.data;
  },

  // POST /services/requests/{request_id}/worker-action/
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
  updateRequestStatus: async (requestId, status) => {
    const response = await api.post(
      `/services/requests/${requestId}/worker-status/`,
      { status },
    );
    return response.data;
  },
};

export default servicesService;
