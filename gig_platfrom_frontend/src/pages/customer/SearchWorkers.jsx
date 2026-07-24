import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { servicesService } from "../../api";
import { useApi } from "../../hooks";
import {
  Card,
  Button,
  Select,
  Input,
  Loader,
  ErrorAlert,
  EmptyState,
} from "../../components/common";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faUser } from "@fortawesome/free-solid-svg-icons";

const getRankTheme = (rank) => {
  const unifiedCardStyle = "border-purple-200 bg-purple-50";

  if (rank === 1) {
    return {
      card: unifiedCardStyle,
      badge: "bg-yellow-500 text-white",
      label: "Best Recommended",
    };
  }

  if (rank === 2) {
    return {
      card: unifiedCardStyle,
      badge: "bg-slate-500 text-white",
      label: "",
    };
  }

  if (rank === 3) {
    return {
      card: unifiedCardStyle,
      badge: "bg-amber-700 text-white",
      label: "",
    };
  }

  return {
    card: unifiedCardStyle,
    badge: "bg-gray-100 text-gray-700",
    label: "",
  };
};

const formatRankingPercent = (score) => {
  if (score === undefined || score === null) return "N/A";
  return `${(Number(score) * 100).toFixed(1)}`;
};

const formatBayesianRating = (rating) => {
  if (rating === undefined || rating === null) return "N/A";
  return `${Number(rating).toFixed(2)}/5`;
};

const formatSentimentScore = (score) => {
  if (score === undefined || score === null) return "N/A";
  return Number(score).toFixed(4);
};

const getNumericValue = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const SearchWorkers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialRadius = searchParams.get("radius") || "10";
  const shouldRestoreSearch = searchParams.get("searched") === "1";
  const hasRestoredSearch = useRef(false);

  const { loading, error, execute, clearError } = useApi();
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [pendingReviewRequest, setPendingReviewRequest] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [radius, setRadius] = useState(initialRadius);
  const [searched, setSearched] = useState(shouldRestoreSearch);
  const [selectedWorker, setSelectedWorker] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchPendingReviewRequest();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await execute(() => servicesService.getCategories());
      setCategories(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      // Error handled by useApi
    }
  };

  const fetchPendingReviewRequest = async () => {
    try {
      const data = await execute(() => servicesService.getRequests());
      const requests = Array.isArray(data) ? data : data.results || [];
      const pending = requests.find((request) => {
        const status = String(request.status).toUpperCase();
        return (
          status === "COMPLETION_PENDING" ||
          (status === "COMPLETED" && !request.has_review)
        );
      });
      setPendingReviewRequest(pending || null);
    } catch (err) {
      // Error handled by useApi
    }
  };

  const searchWorkers = async (category, radiusValue, shouldPersist = true) => {
    if (!category) return;
    if (requestLocked) return;

    setSearched(true);
    if (shouldPersist) {
      setSearchParams({
        category: String(category),
        radius: String(radiusValue || "10"),
        searched: "1",
      });
    }

    try {
      const data = await execute(() =>
        servicesService.getRecommendedWorkers(category, radiusValue),
      );
      setWorkers(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      // Error handled by useApi
    }
  };

  useEffect(() => {
    if (
      !shouldRestoreSearch ||
      hasRestoredSearch.current ||
      !selectedCategory
    ) {
      return;
    }

    hasRestoredSearch.current = true;
    searchWorkers(selectedCategory, radius, false);
  }, [shouldRestoreSearch, selectedCategory, radius]);

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name || cat.title,
  }));

  const sortedWorkers = [...workers].sort(
    (a, b) => Number(b.final_score || 0) - Number(a.final_score || 0),
  );

  const workersWithDistance = sortedWorkers
    .map((worker) => ({
      workerId: worker.worker_id,
      distance: getNumericValue(worker.distance_km),
    }))
    .filter((item) => item.distance !== null);

  const nearestWorkerId = workersWithDistance.length
    ? workersWithDistance.reduce((nearest, current) =>
        current.distance < nearest.distance ? current : nearest,
      ).workerId
    : null;

  const workersWithSentiment = sortedWorkers
    .map((worker) => ({
      workerId: worker.worker_id,
      sentiment: getNumericValue(worker.sentiment_score),
    }))
    .filter((item) => item.sentiment !== null);

  const bestReviewWorkerId = workersWithSentiment.length
    ? workersWithSentiment.reduce((best, current) =>
        current.sentiment > best.sentiment ? current : best,
      ).workerId
    : null;

  const requestLocked = Boolean(pendingReviewRequest);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Find Workers</h1>

      {/* Search Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <Select
            label="Service Category"
            name="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={categoryOptions}
            placeholder="Select a category"
            required
          />

          <Input
            label="Search Radius (km)"
            name="radius"
            type="number"
            value={radius}
            onChange={(e) => {
              const value = Number(e.target.value);
              setRadius(value < 0 ? 0 : value);
            }}
            placeholder="10"
            min="0.1"
            max="100"
          />

          <Button
            onClick={() => searchWorkers(selectedCategory, radius)}
            variant="primary"
            size="lg"
            disabled={!selectedCategory || loading || requestLocked}
            loading={loading}
          >
            Search Workers
          </Button>
        </div>
      </Card>

      <ErrorAlert message={error} onClose={clearError} />

      {requestLocked && (
        <div className="mb-4 rounded-lg border border-yellow-700  px-4 py-3 text-sm text-yellow-700 flex items-center justify-between gap-4">
          <p className="font-bold">
            {String(pendingReviewRequest?.status).toUpperCase() ===
            "COMPLETION_PENDING"
              ? "You must confirm your previously completed work before hiring another worker."
              : "You must submit a review for your previous completed work before hiring another worker."}
          </p>
          {pendingReviewRequest?.id && (
            <Link
              to={
                String(pendingReviewRequest?.status).toUpperCase() ===
                "COMPLETION_PENDING"
                  ? "/customer/my-requests"
                  : `/customer/submit-review?request=${pendingReviewRequest.id}`
              }
              className="inline-flex items-center rounded-md bg-yellow-700 px-3 py-2 text-white font-medium hover:bg-yellow-800"
            >
              {String(pendingReviewRequest?.status).toUpperCase() ===
              "COMPLETION_PENDING"
                ? "Go to My Requests"
                : "Review now"}
            </Link>
          )}
        </div>
      )}

      {/* Results */}
      {loading && searched ? (
        <Loader text="Searching for workers..." />
      ) : searched && workers.length === 0 ? (
        <EmptyState
          title="No workers found"
          message="No workers found matching your criteria. Try adjusting your search."
        />
      ) : workers.length > 0 ? (
        <>
          <div className="space-y-4">
            {sortedWorkers.map((worker, index) => {
              const rank = index + 1;
              const rankTheme = getRankTheme(rank);
              const badges = [];
              if (rankTheme.label) badges.push(rankTheme.label);
              if (worker.worker_id === nearestWorkerId) badges.push("Nearest");
              if (worker.worker_id === bestReviewWorkerId) {
                badges.push("Best Review");
              }
              if (worker.hired_before) badges.push("Hired Before");

              return (
                <Card
                  key={worker.worker_id}
                  className={`border ${rankTheme.card} hover:shadow-md transition-shadow cursor-pointer`}
                  onClick={() => setSelectedWorker(worker)}
                >
                  <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center md:gap-6">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${rankTheme.badge}`}
                      >
                        {rank}
                      </div>
                      <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-2xl">
                          <FontAwesomeIcon icon={faUser} />
                        </span>
                      </div>
                      <div>
                        {badges.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mb-1">
                            {badges.map((badge) => (
                              <span
                                key={`${worker.worker_id}-${badge}`}
                                className="text-xs uppercase tracking-wide text-purple-600 border border-black bg-white px-2 py-0.5 rounded"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {worker.worker_name || "Worker"}
                        </h3>
                        <p className="text-sm text-amber-600 font-medium">
                          Rating: {formatBayesianRating(worker.bayesian_rating)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {worker.service_category || selectedCategory}
                        </p>
                      </div>
                    </div>

                    <div className="w-[220px] text-sm text-gray-700 text-right justify-self-end">
                      <p>
                        {worker.distance_km !== undefined
                          ? `${Number(worker.distance_km).toFixed(1)} km away`
                          : "Distance: N/A"}
                      </p>
                      <p className="font-medium text-gray-900">
                        Ranking score:{" "}
                        {formatRankingPercent(worker.final_score)}
                      </p>
                    </div>

                    <div className="flex space-x-2 justify-self-end">
                      <Link
                        to={`/customer/create-request?worker=${worker.worker_id}&category=${selectedCategory}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={requestLocked}
                        >
                          Request Service
                        </Button>
                      </Link>
                      <Link
                        to={`/customer/reviews?worker=${worker.worker_id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="outline" size="sm">
                          View Reviews
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {selectedWorker && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={() => setSelectedWorker(null)}
              ></div>
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedWorker.worker_name || "Worker Details"}
                    </h3>
                    <button
                      type="button"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => setSelectedWorker(null)}
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700 mb-6">
                    <p>
                      <span className="font-medium">Category:</span>{" "}
                      {selectedWorker.service_category || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {selectedWorker.phone_number || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Username:</span>{" "}
                      {selectedWorker.username || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Hourly Rate:</span>{" "}
                      {selectedWorker.hourly_rate
                        ? `NPR ${selectedWorker.hourly_rate}`
                        : "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Distance:</span>{" "}
                      {selectedWorker.distance_km !== undefined
                        ? `${Number(selectedWorker.distance_km).toFixed(1)} km`
                        : "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Ranking Score:</span>{" "}
                      {selectedWorker.final_score !== undefined
                        ? formatRankingPercent(selectedWorker.final_score)
                        : "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Average Sentiment:</span>{" "}
                      {formatSentimentScore(selectedWorker.sentiment_score)}
                    </p>
                    {Number(selectedWorker.total_reviews || 0) > 0 ? (
                      <p>
                        <span className="font-medium">Total Reviews:</span>{" "}
                        {selectedWorker.total_reviews}
                      </p>
                    ) : null}
                    {Number(selectedWorker.total_jobs_completed || 0) > 0 ? (
                      <p>
                        <span className="font-medium">Jobs Completed:</span>{" "}
                        {selectedWorker.total_jobs_completed}
                      </p>
                    ) : null}
                    <p>
                      <span className="font-medium">Skills:</span>{" "}
                      {selectedWorker.skills || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Bio:</span>{" "}
                      {selectedWorker.bio || "N/A"}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Link
                      to={`/customer/reviews?worker=${selectedWorker.worker_id}`}
                    >
                      <Button variant="outline" size="sm">
                        View Reviews
                      </Button>
                    </Link>
                    <Link
                      to={`/customer/create-request?worker=${selectedWorker.worker_id}&category=${selectedCategory}`}
                    >
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={requestLocked}
                      >
                        Request Service
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">
              <FontAwesomeIcon icon={faMagnifyingGlass}></FontAwesomeIcon>
            </div>
            <p className="text-gray-600">
              Select a category and search radius to find available workers
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SearchWorkers;
