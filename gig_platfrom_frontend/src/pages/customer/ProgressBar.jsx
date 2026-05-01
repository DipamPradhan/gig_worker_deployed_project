
import { memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChalkboard, faMotorcycle, faUserGear, faGears, faCheckDouble} from "@fortawesome/free-solid-svg-icons";


const STATUS_STEPS = [
  { key: "pending", label: "Requested", icon: faChalkboard },
  { key: "assigned", label: "Assigned", icon: faUserGear },
  { key: "arriving", label: "Arriving", icon: faMotorcycle },
  { key: "in_progress", label: "In Progress", icon: faGears },
  { key: "completed", label: "Completed", icon: faCheckDouble }
];





const normalizeStatus = (status) => {
  const value = status?.toString()?.trim().toLowerCase() || "";

  if (["open", "matching", "pending", "broadcasting"].includes(value)) {
    return "pending";
  }

  if (value === "in progress") {
    return "in_progress";
  }

  if (value === "cancelled") {
    return "cancelled";
  }

  return value;
};

const ProgressBar = ({ status }) => {
  if (!status) return null;

  const normalized = normalizeStatus(status);

  if (normalized === "cancelled" || normalized === "completed") {
    // setTimeout(()=>{return null},2000)
    return null;
  }

  


  const currentStep = STATUS_STEPS.findIndex((s) => s.key === normalized);
  if (currentStep === -1) return null;

  const totalSteps = STATUS_STEPS.length - 1;
  const progressRatio = currentStep > 0 ? currentStep / totalSteps : 0;

  return (
    <div className="w-full px-6 py-10">

      {/*  TRACK WRAPPER */}
      <div className="relative flex justify-between items-center">

        {/*  BASE LINE (from first to last circle center) */}
        <div className="absolute top-6 left-6 right-6 h-1 bg-gray-300 rounded" />

        {/*  PROGRESS LINE */}
        {currentStep > 0 && (
          <div
            className="absolute top-6 left-6 right-6 h-1 bg-green-500 rounded transition-all duration-500 origin-left"
            style={{ transform: `scaleX(${progressRatio})` }}
          />
        )}

        {/* STEPS */}
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div
              key={step.key}
              className="flex flex-col items-center relative z-20"
            >
              {/* CIRCLE */}
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-lg
                  transition-all duration-300

                  ${isCompleted ? "bg-green-500 text-white" : ""}
                  ${isActive ? "bg-blue-500 text-white " : ""}
                  ${!isCompleted && !isActive ? "bg-gray-300" : ""}
                `}
              >
                {isCompleted ? <FontAwesomeIcon icon={step.icon}/> : <FontAwesomeIcon icon={step.icon}/>}
              </div>

              {/* LABEL */}
              <span className="mt-2 text-xs">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(ProgressBar);