import api from "./axios";

const accountsService = {
  // POST /accounts/register/
  register: async (userData) => {
    const response = await api.post("/accounts/register/", userData);
    return response.data;
  },

  // GET /accounts/me/
  getMe: async () => {
    const response = await api.get("/accounts/me/");
    return response.data;
  },

  // GET /accounts/profile/
  getProfile: async () => {
    const response = await api.get("/accounts/profile/");
    return response.data;
  },

  // PATCH /accounts/profile/
  updateProfile: async (profileData) => {
    const response = await api.patch("/accounts/profile/", profileData);
    return response.data;
  },

  // POST /accounts/become-worker/
  becomeWorker: async (workerData) => {
    const response = await api.post("/accounts/become-worker/", workerData);
    return response.data;
  },

  // GET /accounts/worker/profile/
  getWorkerProfile: async () => {
    const response = await api.get("/accounts/worker/profile/");
    return response.data;
  },

  // PATCH /accounts/worker/profile/
  updateWorkerProfile: async (profileData) => {
    const response = await api.patch("/accounts/worker/profile/", profileData);
    return response.data;
  },

  // GET /accounts/worker/documents/
  getWorkerDocuments: async () => {
    const response = await api.get("/accounts/worker/documents/");
    return response.data;
  },

  // POST /accounts/worker/documents/upload/
  uploadDocument: async (formData) => {
    const response = await api.post(
      "/accounts/worker/documents/upload/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  // PATCH /accounts/worker/availability/
  updateAvailability: async (availabilityStatus) => {
    const response = await api.patch("/accounts/worker/availability/", {
      availability_status: availabilityStatus,
    });
    return response.data;
  },
};

export default accountsService;
