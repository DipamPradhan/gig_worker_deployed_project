  import api from "./axios";

  // apis to get all ratings and review related data
  const ratingsService = {
    // GET /ratings/reviews/
    // provides review of workers
    getReviews: async (workerId = null) => {
      let url = "/ratings/reviews/";
      if (workerId) {
        url += `?worker_id=${workerId}`;
      }
      const response = await api.get(url);
      return response.data;
    },

    // POST /ratings/reviews/
    // writes review to the worker
    createReview: async (reviewData) => {
      const response = await api.post("/ratings/reviews/", reviewData);
      return response.data;
    },

    // GET /ratings/sentiments/
    // to get sentiment score of worker
    getSentiments: async () => {
      const response = await api.get("/ratings/sentiments/");
      return response.data;
    },
  };

  export default ratingsService;
