import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  location: { lat: number; lng: number } | null;
  onLocationChange: (location: { lat: number; lng: number }) => void;
}

function LocationMarker({ onLocationChange }: { onLocationChange: (location: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function LocationPicker({ location, onLocationChange }: LocationPickerProps) {
  const defaultCenter = location 
    ? ([location.lat, location.lng] as [number, number])
    : ([ 0.3075, 32.5830] as [number, number]); // Nairobi, Kenya as default

  return (
    <div className="map-container" style={{ height: '300px', width: '100%' }}>
      <MapContainer
        {...{ center: defaultCenter, zoom: 13, scrollWheelZoom: true } as any}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationMarker onLocationChange={onLocationChange} />
        {location && <Marker position={[location.lat, location.lng]} />}
      </MapContainer>
    </div>
  );
}
