import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ratingsService, servicesService } from "../../api";
import { useApi, useForm } from "../../hooks";
import {
  Card,
  Button,
  TextArea,
  Loader,
  ErrorAlert,
  SuccessAlert,
  StarRating,
} from "../../components/common";

const SubmitReview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("request");

  const { loading, error, execute, clearError } = useApi();
  const [request, setRequest] = useState(null);
  const [success, setSuccess] = useState("");
  const [rating, setRating] = useState(0);

  const { values, handleChange } = useForm({
    comment: "",
  });

  useEffect(() => {
    if (requestId) {
      fetchRequest();
    }
  }, [requestId]);

  const fetchRequest = async () => {
    try {
      const data = await execute(() => servicesService.getRequests());
      const requests = Array.isArray(data) ? data : data.results || [];
      const foundRequest = requests.find((r) => r.id.toString() === requestId);
      if (foundRequest) {
        setRequest(foundRequest);
      }
    } catch (err) {
      // Error handled by useApi
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setSuccess("");

    if (rating === 0) {
      return;
    }

    try {
      await execute(() =>
        ratingsService.createReview({
          request: requestId,
          rating,
          review_text: values.comment,
        }),
      );
      setSuccess("Review submitted successfully!");
      setTimeout(() => {
        navigate("/customer/my-requests");
      }, 500);
    } catch (err) {
      // Error handled by useApi
    }
  };

  const reviewAlreadySubmitted = Boolean(request?.has_review);

  if (loading && !request) {
    return <Loader text="Loading..." />;
  }

  if (!requestId) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-gray-600">
            No request specified. Please select a completed request to review.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate("/customer/my-requests")}
            className="mt-4"
          >
            View My Requests
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit Review</h1>

      <Card>
        <ErrorAlert message={error} onClose={clearError} />
        <SuccessAlert message={success} />

        {request && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Service Details
            </h2>
            <p className="text-sm text-gray-600">
              <strong>Category:</strong> {request.category_name || "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Description:</strong> {request.description}
            </p>
            {request.assigned_worker_details && (
              <p className="text-sm text-gray-600">
                <strong>Worker:</strong>{" "}
                {request.assigned_worker_details.first_name}{" "}
                {request.assigned_worker_details.last_name}
              </p>
            )}
          </div>
        )}

        {reviewAlreadySubmitted && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Review already submitted for this request.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <StarRating
              rating={rating}
              onRatingChange={reviewAlreadySubmitted ? undefined : setRating}
              size="lg"
            />
            {rating === 0 && (
              <p className="text-sm text-gray-500 mt-1">Click to rate</p>
            )}
          </div>

          <TextArea
            label="Your Review"
            name="comment"
            value={values.comment}
            onChange={handleChange}
            placeholder="Share your experience with this worker..."
            rows={4}
          />

          <div className="flex space-x-4 mt-6">
            <Button
              type="submit"
              variant={reviewAlreadySubmitted ? "secondary" : "primary"}
              loading={loading}
              disabled={loading || rating === 0 || reviewAlreadySubmitted}
            >
              Submit Review
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SubmitReview;
