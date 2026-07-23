  import api from "./axios";

  //  apis related to the accounts
  const accountsService = {
    // POST /accounts/register/
    //  to register an account
    register: async (userData) => {
      const response = await api.post("/accounts/register/", userData);
      return response.data;
    },

    // GET /accounts/me/
    // return account data
    getMe: async () => {
      const response = await api.get("/accounts/me/");
      return response.data;
    },

    // GET /accounts/profile/
    // return profile of user
    getProfile: async () => {
      const response = await api.get("/accounts/profile/");
      return response.data;
    },

    // PATCH /accounts/profile/
    // to update the loacation
    updateProfile: async (profileData) => {
      const response = await api.patch("/accounts/profile/", profileData);
      return response.data;
    },

    // POST /accounts/become-worker/
    // to change the client to worker
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

    // DELETE /accounts/worker/documents/:id/
    deleteWorkerDocument: async (documentId) => {
      const response = await api.delete(
        `/accounts/worker/documents/${documentId}/`,
      );
      return response.data;
    },

    // PATCH /accounts/worker/availability/
    // change status of worker busy , active inactive
    updateAvailability: async (availabilityStatus) => {
      const response = await api.patch("/accounts/worker/availability/", {
        availability_status: availabilityStatus,
      });
      return response.data;
    },
  };

  export default accountsService;
