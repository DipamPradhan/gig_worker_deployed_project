  import { useState, useEffect } from "react";
  import { Link, useNavigate, useSearchParams } from "react-router-dom";
  import { servicesService } from "../../api";
  import { useApi, useForm } from "../../hooks";
  import {
    Card,
    Button,
    Input,
    TextArea,
    Loader,
    ErrorAlert,
    SuccessAlert,
  } from "../../components/common";

  const CreateRequest = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preSelectedWorker = searchParams.get("worker");
    const preSelectedCategory = searchParams.get("category");

    const { loading, error, execute, clearError } = useApi();
    const [categories, setCategories] = useState([]);
    const [success, setSuccess] = useState("");
    const [pendingReviewRequest, setPendingReviewRequest] = useState(null);

    const { values, handleChange, setFieldValue } = useForm({
      category: "",
      title: "",
      description: "",
    });

    useEffect(() => {
      if (!preSelectedWorker || !preSelectedCategory) {
        navigate("/customer/search-workers", { replace: true });
        return;
      }

      setFieldValue("category", String(preSelectedCategory));

      fetchCategories();
      fetchPendingReviewRequest();
    }, [navigate, preSelectedWorker, preSelectedCategory]);

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

    const fetchCategories = async () => {
      try {
        const data = await execute(() => servicesService.getCategories());
        const categoryList = Array.isArray(data) ? data : data.results || [];
        setCategories(categoryList);

        if (preSelectedCategory) {
          const matchedCategory = categoryList.find(
            (cat) =>
              String(cat.id) === String(preSelectedCategory) ||
              String(cat.name).toLowerCase() ===
                String(preSelectedCategory).toLowerCase(),
          );
          if (matchedCategory) {
            setFieldValue("category", String(matchedCategory.id));
          }
        }
      } catch (err) {
        // Error handled by useApi
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      clearError();
      setSuccess("");

      if (pendingReviewRequest) {
        return;
      }

      try {
        const requestData = {
          category: values.category,
          title: values.title,
          description: values.description,
          preferred_worker_id: preSelectedWorker || null,
        };

        await execute(() => servicesService.createRequest(requestData));
        setSuccess("Service request created successfully!");
        setTimeout(() => {
          navigate("/");
        }, 500);
      } catch (err) {
        // Error handled by useApi
      }
    };

    const selectedCategoryLabel =
      categories.find((cat) => String(cat.id) === String(values.category))
        ?.name ||
      preSelectedCategory ||
      "Selected from worker";

    const requestLocked = Boolean(pendingReviewRequest);

    if (loading && categories.length === 0) {
      return <Loader text="Loading..." />;
    }

    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Create Service Request
        </h1>

        <Card>
          <ErrorAlert message={error} onClose={clearError} />
          <SuccessAlert message={success} />

          {requestLocked && (
            <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              {String(pendingReviewRequest?.status).toUpperCase() ===
              "COMPLETION_PENDING"
                ? "You must confirm your previously completed work before hiring another worker."
                : "You must submit a review for your previous completed work before hiring another worker."}
              {pendingReviewRequest?.id && (
                <span className="ml-1">
                  <Link
                    to={
                      String(pendingReviewRequest?.status).toUpperCase() ===
                      "COMPLETION_PENDING"
                        ? "/customer/my-requests"
                        : `/customer/submit-review?request=${pendingReviewRequest.id}`
                    }
                    className="font-medium underline"
                  >
                    {String(pendingReviewRequest?.status).toUpperCase() ===
                    "COMPLETION_PENDING"
                      ? "Go to My Requests"
                      : "Review now"}
                  </Link>
                </span>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Service Category"
              name="category"
              value={selectedCategoryLabel}
              readOnly
              disabled
              required
            />

            <Input
              label="Request Title"
              name="title"
              value={values.title}
              onChange={handleChange}
              placeholder="Need urgent wiring fix"
              required
            />

            <TextArea
              label="Description"
              name="description"
              value={values.description}
              onChange={handleChange}
              placeholder="Describe your service needs in detail..."
              required
              rows={4}
            />

            {preSelectedWorker && (
              <p className="text-sm text-gray-500 mb-4">
                This request will be sent directly to your selected worker.
              </p>
            )}

            <div className="flex space-x-4 mt-6">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
              >
                Create Request
              </Button>

              <Button
                type="button"
                disabled={loading || requestLocked}
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

  export default CreateRequest;
