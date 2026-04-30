const StatusBadge = ({ status, type = "default" }) => {
  const statusStyles = {
    // Request statuses
    OPEN: "bg-yellow-100 text-yellow-800",
    MATCHING: "bg-blue-100 text-blue-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    BROADCASTING: "bg-blue-100 text-blue-800",
    ASSIGNED: "bg-purple-100 text-purple-800",
    ARRIVING: "bg-indigo-100 text-indigo-800",
    IN_PROGRESS: "bg-orange-100 text-orange-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",

    // Broadcast statuses
    SENT: "bg-blue-100 text-blue-800",
    VIEWED: "bg-indigo-100 text-indigo-800",
    ACCEPTED: "bg-green-100 text-green-800",
    EXPIRED: "bg-gray-100 text-gray-800",

    // Worker availability
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    BUSY: "bg-orange-100 text-orange-800",

    // Verification statuses
    VERIFIED: "bg-green-100 text-green-800",
    UNVERIFIED: "bg-yellow-100 text-yellow-800",
    REJECTED: "bg-red-100 text-red-800",

    // Generic statuses
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    default: "bg-gray-100 text-gray-800",
  };

  const styleClass =
    statusStyles[status] || statusStyles[type] || statusStyles.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styleClass}`}
    >
      {status?.replace(/_/g, " ") || "Unknown"}
    </span>
  );
};

export default StatusBadge;
