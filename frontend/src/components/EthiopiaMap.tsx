import { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '@/store/appStore';
import { OutbreakReport } from '@/types';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons based on risk level
const getIcon = (risk: string) => {
  const color = risk === 'HIGH' ? 'red' : risk === 'MEDIUM' ? 'orange' : 'green';
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const CITY_COORDS: Record<string, [number, number]> = {
  'addis ababa': [8.9806, 38.7578],
  'dire dawa': [9.5931, 41.8661],
  'mekelle': [13.4967, 39.4753],
  'gondar': [12.5998, 37.4697],
  'awasa': [7.0504, 38.4768],
  'hawassa': [7.0504, 38.4768],
  'bahir dar': [11.5936, 37.3908],
  'dessie': [11.1333, 39.6333],
  'jimma': [7.6751, 36.8351],
  'jijiga': [9.35, 42.8],
};

function getCoordinates(location: string, index: number): [number, number] {
  const normalized = location.toLowerCase().trim();
  if (CITY_COORDS[normalized]) {
    // Add tiny jitter to prevent exact overlap
    return [
      CITY_COORDS[normalized][0] + (Math.random() - 0.5) * 0.05,
      CITY_COORDS[normalized][1] + (Math.random() - 0.5) * 0.05
    ];
  }
  // Default to somewhere around central Ethiopia with some random spread
  return [
    9.145 + (Math.random() - 0.5) * 4,
    40.4896 + (Math.random() - 0.5) * 4
  ];
}

export function EthiopiaMap() {
  const reports = useAppStore((state) => state.reports);

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden shadow-sm border border-border">
      <MapContainer
        center={[9.145, 40.4896]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((report, i) => (
          <Marker 
            key={report.session_id} 
            position={getCoordinates(report.extracted_data.location, i)}
            icon={getIcon(report.risk_analysis.risk_level)}
          >
            <Tooltip className="custom-tooltip">
              <div className="flex flex-col gap-1 p-1">
                <span className="font-bold text-sm block">{report.alert.title}</span>
                <span className="text-xs">
                  <strong className="text-health">Location:</strong> {report.extracted_data.location}
                </span>
                <span className="text-xs">
                  <strong className="text-health">Cases:</strong> {report.extracted_data.cases}
                </span>
                <span className="text-xs">
                  <strong className="text-health">Risk:</strong> {report.risk_analysis.risk_level}
                </span>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
