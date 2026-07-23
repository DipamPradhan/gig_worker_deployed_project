    // shows the status of work completed , pending, assigned , etc
    
    const StatusBadge = ({ status, type = "default" }) => {
      
      
      const statusStyles = {
        // Request statuses
        OPEN: "bg-white text-yellow-800 border border-black",
      MATCHING: "bg-white text-blue-800 border border-black",
      PENDING: "bg-white text-yellow-800 border border-black",
      BROADCASTING: "bg-white text-blue-800 border border-black",
      ASSIGNED: "bg-white text-purple-800 border border-black",
      ARRIVING: "bg-white text-indigo-800 border border-black",
      IN_PROGRESS: "bg-white text-orange-800 border border-black",
      COMPLETION_PENDING: "bg-white text-blue-800 border border-black",
      COMPLETED: "bg-white text-green-800 border border-black",
      CANCELLED: "bg-white text-red-800 border border-black",

      // Broadcast statuses
    SENT: "bg-white text-blue-800 border border-black",
    VIEWED: "bg-white text-indigo-800 border border-black",
    ACCEPTED: "bg-white text-green-800 border border-black",
    EXPIRED: "bg-white text-gray-800 border border-black",

    // Worker availability
    ACTIVE: "bg-white text-green-800 border border-black",
    INACTIVE: "bg-white text-gray-800 border border-black",
    BUSY: "bg-white text-orange-800 border border-black",

    // Verification statuses
    VERIFIED: "bg-white text-green-800 border border-black",
    UNVERIFIED: "bg-white text-yellow-800 border border-black",
    REJECTED: "bg-white text-red-800 border border-black",

    // Generic statuses
    success: "bg-white text-green-800 border border-black",
    warning: "bg-white text-yellow-800 border border-black",
    error: "bg-white text-red-800 border border-black",
    info: "bg-white text-blue-800 border border-black",
    default: "bg-white text-gray-800 border border-black",
      };

      const styleClass =
        statusStyles[status] || statusStyles[type] || statusStyles.default;

      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${styleClass}`}
        >
          {status?.replace(/_/g, " ") || "Unknown"}
        </span>
      );
    };

    export default StatusBadge;
