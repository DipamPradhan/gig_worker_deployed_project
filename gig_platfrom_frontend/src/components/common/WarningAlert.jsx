const WarningAlert = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-500 text-yellow-600 px-4 py-3 rounded relative mb-4">
      <span className="block sm:inline font-semibold">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
          aria-label="Close"
        >
          <span className="text-yellow-500 hover:text-yellow-700 text-xl">
            &times;
          </span>
        </button>
      )}
    </div>
  );
};

export default WarningAlert;
