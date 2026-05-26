import api from "./axios";

const ratingsService = {
  // GET /ratings/reviews/
  getReviews: async (workerId = null) => {
    let url = "/ratings/reviews/";
    if (workerId) {
      url += `?worker_id=${workerId}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // POST /ratings/reviews/
  createReview: async (reviewData) => {
    const response = await api.post("/ratings/reviews/", reviewData);
    return response.data;
  },

  // GET /ratings/sentiments/
  getSentiments: async () => {
    const response = await api.get("/ratings/sentiments/");
    return response.data;
  },
};

export default ratingsService;
