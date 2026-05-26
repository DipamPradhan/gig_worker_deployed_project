import { useState, useCallback } from "react";

const extractErrorMessage = (responseData) => {
  if (!responseData) {
    return null;
  }

  if (typeof responseData === "string") {
    return responseData;
  }

  if (responseData.detail) {
    return Array.isArray(responseData.detail)
      ? responseData.detail[0]
      : responseData.detail;
  }

  if (responseData.message) {
    return responseData.message;
  }

  if (Array.isArray(responseData.non_field_errors) && responseData.non_field_errors.length > 0) {
    return responseData.non_field_errors[0];
  }

  for (const value of Object.values(responseData)) {
    if (typeof value === "string" && value) {
      return value;
    }

    if (Array.isArray(value) && value.length > 0) {
      const firstItem = value[0];
      if (typeof firstItem === "string" && firstItem) {
        return firstItem;
      }
    }
  }

  return null;
};

// Hook for handling API calls with loading and error states
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      const message =
        extractErrorMessage(err.response?.data) ||
        err.message ||
        "An error occurred";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { loading, error, execute, clearError };
};

// Hook for managing form state
export const useForm = (initialState = {}) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const setFieldValue = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const reset = () => {
    setValues(initialState);
    setErrors({});
  };

  const setFieldError = (name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  return {
    values,
    errors,
    handleChange,
    setFieldValue,
    setFieldError,
    setErrors,
    reset,
    setValues,
  };
};
