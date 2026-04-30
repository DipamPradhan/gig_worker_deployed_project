// Date formatting utilities
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return formatDate(dateString);
};

// String utilities
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncate = (str, maxLength = 100) => {
  if (!str || str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
};

// Status utilities
export const getStatusColor = (status) => {
  const colors = {
    PENDING: "yellow",
    BROADCASTING: "blue",
    ASSIGNED: "purple",
    ARRIVING: "indigo",
    IN_PROGRESS: "orange",
    COMPLETED: "green",
    CANCELLED: "red",
    ACTIVE: "green",
    INACTIVE: "gray",
    BUSY: "orange",
    VERIFIED: "green",
    UNVERIFIED: "yellow",
    REJECTED: "red",
  };
  return colors[status] || "gray";
};

export const getNextStatuses = (currentStatus) => {
  const statusFlow = {
    PENDING: ["BROADCASTING"],
    BROADCASTING: ["ASSIGNED"],
    ASSIGNED: ["ARRIVING", "CANCELLED"],
    ARRIVING: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  };
  return statusFlow[currentStatus] || [];
};

// Validation utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

// Number utilities
export const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

export const formatDistance = (km) => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

// Array utilities
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

export const sortBy = (array, key, order = "asc") => {
  return [...array].sort((a, b) => {
    if (order === "asc") {
      return a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
    }
    return a[key] > b[key] ? -1 : a[key] < b[key] ? 1 : 0;
  });
};

export const getCurrentBrowserLocation = (options = {}) =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }

    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 60000,
    } = options;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Location permission denied."));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location information is unavailable."));
            break;
          case error.TIMEOUT:
            reject(new Error("Location request timed out."));
            break;
          default:
            reject(new Error("Unable to fetch your location."));
        }
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      },
    );
  });

export const reverseGeocodeAddress = async (latitude, longitude) => {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to resolve address from current location.");
  }

  const data = await response.json();
  return data.display_name || "";
};
