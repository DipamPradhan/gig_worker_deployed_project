  const ErrorAlert = ({ message, onClose }) => {
    if (!message) return null;
// common component to show the error in login or request creation ...
    return (
      <div className="border-2 border-red-700 text-red-700 px-4 py-3 rounded relative mb-4">
        <span className="block sm:inline">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            aria-label="Close"
          >
            <span className="text-red-700 hover:text-red-700 text-xl">
              &times;
            </span>
          </button>
        )}
      </div>
    );
  };

  export default ErrorAlert;
