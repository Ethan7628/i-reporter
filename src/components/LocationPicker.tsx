import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
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

function SearchControl({ onLocationChange }: { onLocationChange: (location: { lat: number; lng: number }) => void }) {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`, {
          headers: { 'Accept': 'application/json' }
        });
        const data = await resp.json();
        setResults(data);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => { clearTimeout(t); controller.abort(); };
  }, [query]);

  const handleSelect = (r: any) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    map.setView([lat, lng], 15);
    onLocationChange({ lat, lng });
    setQuery(r.display_name);
    setResults([]);
  };

  return (
    <div className="leaflet-top leaflet-left" style={{ padding: 8, zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 8, padding: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.15)', minWidth: 260 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search location..."
          style={{ width: '100%', outline: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '6px 8px' }}
        />
        {results.length > 0 && (
          <ul style={{ marginTop: 8, maxHeight: 180, overflowY: 'auto' }}>
            {results.map((r, idx) => (
              <li key={idx} style={{ padding: '6px 4px', cursor: 'pointer', borderTop: '1px solid #eee' }} onClick={() => handleSelect(r)}>
                {r.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
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
        <SearchControl onLocationChange={onLocationChange} />
        <LocationMarker onLocationChange={onLocationChange} />
        {location && <Marker position={[location.lat, location.lng]} />}
      </MapContainer>
    </div>
  );
}
