import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ratingsService } from "../../api";
import { useApi } from "../../hooks";
import {
  Card,
  Button,
  Loader,
  ErrorAlert,
  EmptyState,
  StarRating,
} from "../../components/common";

const WorkerReviews = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const workerId = searchParams.get("worker");

  const { loading, error, execute, clearError } = useApi();
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (workerId) {
      fetchReviews();
    }
  }, [workerId]);

  const fetchReviews = async () => {
    try {
      const data = await execute(() => ratingsService.getReviews(workerId));
      setReviews(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      // Error handled by useApi
    }
  };

  if (!workerId) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-gray-600">No worker specified.</p>
          <Button
            variant="primary"
            onClick={() => navigate("/customer/search-workers")}
            className="mt-4"
          >
            Find Workers
          </Button>
        </div>
      </Card>
    );
  }

  if (loading) {
    return <Loader text="Loading reviews..." />;
  }

  // Calculate average rating
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Worker Reviews</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <ErrorAlert message={error} onClose={clearError} />

      {/* Summary Card */}
      <Card className="mb-6">
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </div>
            <StarRating rating={averageRating} readonly size="md" />
            <div className="text-sm text-gray-500 mt-1">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </div>
          </div>

          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter(
                (r) => Math.floor(r.rating) === star,
              ).length;
              const percentage =
                reviews.length > 0 ? (count / reviews.length) * 100 : 0;

              return (
                <div key={star} className="flex items-center space-x-2 mb-1">
                  <span className="text-sm text-gray-600 w-4">{star}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          message="This worker hasn't received any reviews yet."
          icon="⭐"
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {review.reviewer_display_name ||
                        review.reviewer_details?.first_name ||
                        review.reviewer?.first_name ||
                        "Customer"}
                    </span>
                    <StarRating rating={review.rating} readonly size="sm" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {review.review_text && (
                <p className="text-gray-600">{review.review_text}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkerReviews;
