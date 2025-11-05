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
    <div 
      className="leaflet-top leaflet-left" 
      style={{ 
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        pointerEvents: 'auto'
      }}
    >
      <div style={{ 
        background: 'white', 
        borderRadius: 8, 
        padding: 12, 
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)', 
        minWidth: 280,
        maxWidth: 400
      }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Search for a location..."
          style={{ 
            width: '100%', 
            outline: 'none', 
            border: '2px solid #4A90E2', 
            borderRadius: 6, 
            padding: '8px 12px',
            fontSize: '14px',
            fontFamily: 'inherit'
          }}
        />
        {loading && (
          <div style={{ padding: '8px', fontSize: '14px', color: '#666' }}>
            Searching...
          </div>
        )}
        {results.length > 0 && (
          <ul style={{ 
            marginTop: 8, 
            maxHeight: 200, 
            overflowY: 'auto',
            listStyle: 'none',
            margin: 0,
            padding: 0
          }}>
            {results.map((r, idx) => (
              <li 
                key={idx} 
                style={{ 
                  padding: '8px 6px', 
                  cursor: 'pointer', 
                  borderTop: idx === 0 ? 'none' : '1px solid #eee',
                  fontSize: '13px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                onClick={() => handleSelect(r)}
              >
                📍 {r.display_name}
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
