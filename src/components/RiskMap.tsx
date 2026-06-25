import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useVesselTracking } from '../data/vesselSimulation';
import KnowledgeGraphPanel from './KnowledgeGraphPanel';
import { useRealtimeRiskScores } from '../hooks/useRealtimeRiskScores';

// Custom icons based on vessel status/type
const createVesselIcon = (vessel: any) => {
  let color = 'bg-blue-500'; // default VLCC safe
  if (vessel.status === 'DIVERTED') color = 'bg-red-500 animate-pulse';
  else if (vessel.status === 'AT ANCHOR') color = 'bg-gray-500 animate-pulse';
  else if (vessel.type === 'VLCC' && vessel.lng < 60) color = 'bg-red-500'; // high risk zone
  else if (vessel.type === 'Suezmax') color = 'bg-orange-500';
  else if (vessel.type === 'Aframax') color = 'bg-yellow-400';

  const size = vessel.type === 'VLCC' ? 16 : vessel.type === 'Suezmax' ? 12 : 10;

  return L.divIcon({
    className: 'custom-vessel-icon',
    html: `<div class="${color} rounded-full border-2 border-white/20 shadow-lg" style="width: ${size}px; height: ${size}px;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

export default function RiskMap() {
  const vessels = useVesselTracking();
  const { riskScores } = useRealtimeRiskScores();
  const [selectedChokepoint, setSelectedChokepoint] = useState<string | null>(null);

  const getRisk = (corridor: string) => {
    return riskScores.find(s => s.corridor.includes(corridor))?.risk_score || 0;
  };

  const hormuzRisk = getRisk('Hormuz');
  const redSeaRisk = getRisk('Red Sea');

  const hormuzRadius = hormuzRisk > 70 ? (hormuzRisk * 4000) : 200000;
  const redSeaRadius = redSeaRisk > 70 ? (redSeaRisk * 4000) : 250000;

  return (
    <div className="absolute inset-0">
      <MapContainer center={[20, 60]} zoom={4} style={{ height: '100%', width: '100%', background: '#0B0F19' }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Shipping Lanes */}
        <Polyline positions={[[26.56, 56.25], [23.03, 70.21]]} pathOptions={{ color: '#3b82f6', dashArray: '5, 10', weight: 2 }} />
        <Polyline positions={[[12.58, 43.33], [30.42, 32.34], [35, 20]]} pathOptions={{ color: '#f97316', dashArray: '5, 10', weight: 2 }} />
        <Polyline positions={[[-34.35, 18.47], [12.91, 74.81]]} pathOptions={{ color: '#22c55e', dashArray: '5, 10', weight: 2 }} />

        {/* Chokepoints */}
        <Circle 
          center={[26.56, 56.25]} 
          radius={hormuzRadius} 
          pathOptions={{ color: hormuzRisk > 70 ? 'red' : 'orange', fillColor: hormuzRisk > 70 ? 'red' : 'orange', fillOpacity: hormuzRisk > 70 ? 0.3 : 0.1 }}
          eventHandlers={{ click: () => setSelectedChokepoint('Strait of Hormuz') }}
        >
          <Popup>Strait of Hormuz (Risk: {hormuzRisk})<br/><button onClick={() => setSelectedChokepoint('Strait of Hormuz')} className="text-primary mt-1 hover:underline">View Intelligence</button></Popup>
        </Circle>

        <Circle 
          center={[12.58, 43.33]} 
          radius={redSeaRadius} 
          pathOptions={{ color: redSeaRisk > 70 ? 'red' : 'orange', fillColor: redSeaRisk > 70 ? 'red' : 'orange', fillOpacity: redSeaRisk > 70 ? 0.3 : 0.1 }}
          eventHandlers={{ click: () => setSelectedChokepoint('Red Sea/Bab-el-Mandeb') }}
        >
          <Popup>Red Sea/Bab-el-Mandeb (Risk: {redSeaRisk})<br/><button onClick={() => setSelectedChokepoint('Red Sea/Bab-el-Mandeb')} className="text-primary mt-1 hover:underline">View Intelligence</button></Popup>
        </Circle>

        {/* Refineries */}
        <CircleMarker center={[23.03, 70.21]} radius={6} pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.8 }}>
          <Popup>Kandla Port / Sikka</Popup>
        </CircleMarker>
        <CircleMarker center={[19.07, 72.87]} radius={6} pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.8 }}>
          <Popup>Mumbai Ports</Popup>
        </CircleMarker>

        {/* Live Vessels */}
        {vessels.map(v => (
          <Marker key={v.mmsi} position={[v.lat, v.lng]} icon={createVesselIcon(v)}>
            <Popup className="bg-card text-gray-200">
              <div className="font-bold text-sm border-b border-border pb-1 mb-1">{v.name} ({v.flag})</div>
              <div className="text-xs space-y-1">
                <div><span className="text-gray-400">Type:</span> {v.type}</div>
                <div><span className="text-gray-400">Speed:</span> {v.speed.toFixed(1)} kts</div>
                <div><span className="text-gray-400">Heading:</span> {v.heading}&deg;</div>
                <div><span className="text-gray-400">Cargo:</span> {v.cargo}</div>
                <div><span className="text-gray-400">Dest:</span> {v.destination}</div>
                <div className={`font-semibold ${v.alert ? 'text-danger' : 'text-success'}`}>
                  {v.status} {v.alert ? ` - ${v.alert}` : ''}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {selectedChokepoint && (
        <KnowledgeGraphPanel 
          selectedChokepoint={selectedChokepoint} 
          onClose={() => setSelectedChokepoint(null)} 
        />
      )}
    </div>
  );
}