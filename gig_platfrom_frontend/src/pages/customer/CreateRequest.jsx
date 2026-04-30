import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  }, [navigate, preSelectedWorker, preSelectedCategory]);

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
    categories.find((cat) => String(cat.id) === String(values.category))?.name ||
    preSelectedCategory ||
    "Selected from worker";

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

export default CreateRequest;
