import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DEFAULT_CENTER = [27.7172, 85.324];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ClickHandler = ({ onPick }) => {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      onPick({
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
      });
    },
  });

  return null;
};

const LocationPickerModal = ({
  isOpen,
  title = "Pick Location",
  initialLatitude,
  initialLongitude,
  onClose,
  onSelect,
}) => {
  const initialPosition = useMemo(() => {
    if (
      Number.isFinite(Number(initialLatitude)) &&
      Number.isFinite(Number(initialLongitude))
    ) {
      return {
        latitude: Number(initialLatitude),
        longitude: Number(initialLongitude),
      };
    }
    return null;
  }, [initialLatitude, initialLongitude]);

  const [pickedPosition, setPickedPosition] = useState(initialPosition);

  useEffect(() => {
    if (isOpen) {
      setPickedPosition(initialPosition);
    }
  }, [isOpen, initialPosition]);

  if (!isOpen) return null;

  const mapCenter = pickedPosition
    ? [pickedPosition.latitude, pickedPosition.longitude]
    : DEFAULT_CENTER;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            Click on the map to choose your exact location.
          </p>

          <div className="h-[360px] w-full rounded-md overflow-hidden border border-gray-200 mb-4">
            <MapContainer
              center={mapCenter}
              zoom={13}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClickHandler onPick={setPickedPosition} />
              {pickedPosition && (
                <Marker
                  position={[pickedPosition.latitude, pickedPosition.longitude]}
                >
                  <Popup>Selected location</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          <div className="text-sm text-gray-700 mb-4">
            {pickedPosition ? (
              <p>
                Selected: {pickedPosition.latitude.toFixed(6)},{" "}
                {pickedPosition.longitude.toFixed(6)}
              </p>
            ) : (
              <p>No location selected yet.</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
              disabled={!pickedPosition}
              onClick={() => {
                if (!pickedPosition) return;
                onSelect(pickedPosition);
              }}
            >
              Use This Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;
