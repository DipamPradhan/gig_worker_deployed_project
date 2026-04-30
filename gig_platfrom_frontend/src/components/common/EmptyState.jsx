import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBroom} from "@fortawesome/free-solid-svg-icons";
const EmptyState = ({
  title = "No data found",
  message = "There are no items to display.",
  icon = "",
  action,
}) => {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-6xl mb-4"><FontAwesomeIcon icon={faBroom } /></div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
