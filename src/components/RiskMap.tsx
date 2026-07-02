import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useVesselTracking } from '../data/vesselSimulation';
import KnowledgeGraphPanel from './KnowledgeGraphPanel';
import { useRealtimeRiskScores } from '../hooks/useRealtimeRiskScores';

const INDIAN_PORTS = [
  { name: 'Kandla/Sikka', lat: 23.03, lng: 70.22, refinery: 'Reliance Jamnagar' },
  { name: 'JNPT Mumbai', lat: 18.95, lng: 72.93, refinery: 'HPCL Mumbai' },
  { name: 'Kochi Port', lat: 9.97, lng: 76.27, refinery: 'BPCL Kochi' },
  { name: 'Paradip Port', lat: 20.32, lng: 86.62, refinery: 'IOC Paradip' },
  { name: 'New Mangalore', lat: 12.92, lng: 74.82, refinery: 'MRPL Mangalore' },
  { name: 'Visakhapatnam', lat: 17.69, lng: 83.22, refinery: 'HPCL Vizag' },
];

const createPortIcon = () => {
  return L.divIcon({
    className: 'custom-port-icon',
    html: `<div style="width:10px;height:10px;background:#a855f7;transform:rotate(45deg);border:1px solid #c084fc;box-shadow:0 0 5px rgba(168,85,247,0.6);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

// Custom icons based on vessel status/type
const createVesselIcon = (vessel: any) => {
  let color = 'bg-blue-500';
  if (vessel.status === 'DIVERTED') color = 'bg-red-500 animate-pulse';
  else if (vessel.status === 'AT ANCHOR') color = 'bg-gray-500 animate-pulse';

  return L.divIcon({
    className: 'custom-vessel-icon',
    html: `<div class="${color} rounded-full border border-border shadow-[0_0_8px_rgba(59,130,246,0.8)]" style="width: 10px; height: 10px;"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });
};

export default function RiskMap() {
  const vessels = useVesselTracking();
  const { riskScores } = useRealtimeRiskScores();
  const [selectedChokepoint, setSelectedChokepoint] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  const getRisk = (corridor: string) => {
    return riskScores.find(s => s.corridor.includes(corridor))?.risk_score || 0;
  };

  const hormuzRisk = getRisk('Hormuz');
  const redSeaRisk = getRisk('Red Sea');

  const hormuzRadius = hormuzRisk > 70 ? (hormuzRisk * 4000) : 200000;
  const redSeaRadius = redSeaRisk > 70 ? (redSeaRisk * 4000) : 250000;

  return (
    <div className="absolute inset-0">
      <MapContainer center={[15.0, 55.0]} zoom={3} style={{ height: '100%', width: '100%', background: '#0B0F19' }} zoomControl={false}>
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
        {INDIAN_PORTS.map((port, idx) => (
          <Marker key={idx} position={[port.lat, port.lng]} icon={createPortIcon()}>
            <Popup className="custom-popup" maxWidth={200}>
              <div style={{
                background: '#0d1526', color: '#f1f5f9',
                padding: '8px 12px', borderRadius: '6px',
                fontFamily: 'sans-serif'
              }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#3b82f6' }}>{port.name}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Feeds: {port.refinery}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Live Vessels */}
        {vessels.map(v => (
          <Marker key={v.mmsi} position={[v.lat, v.lng]} icon={createVesselIcon(v)}>
            <Popup className="custom-popup" maxWidth={220}>
              <div style={{
                background: '#0d1526', color: '#f1f5f9',
                padding: '10px', borderRadius: '6px',
                minWidth: '180px', fontFamily: 'sans-serif'
              }}>
                <div style={{
                  fontWeight: 700, fontSize: '13px',
                  marginBottom: '6px', color: '#3b82f6'
                }}>
                  {v.name}
                </div>
                <div style={{
                  fontSize: '11px', color: '#94a3b8',
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: '4px'
                }}>
                  <span>Type:</span><span>{v.type}</span>
                  <span>Flag:</span><span>{v.flag}</span>
                  <span>Speed:</span><span>{v.speed.toFixed(1)} knots</span>
                  <span>Heading:</span><span>{v.heading}&deg;</span>
                  <span>Cargo:</span><span>{v.cargo}</span>
                  <span>Dest:</span><span>{v.destination}</span>
                  <span>Status:</span>
                  <span style={{
                    color: v.status === 'DIVERTED' ? '#ef4444' :
                           v.status === 'AT ANCHOR' ? '#94a3b8' : '#10b981'
                  }}>{v.status}</span>
                  {v.alert && (
                    <span style={{ color: '#ef4444', gridColumn: '1 / -1', marginTop: '4px' }}>
                      ⚠ {v.alert}
                    </span>
                  )}
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

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-[1000] pointer-events-auto">
        {showLegend ? (
          <div className="bg-[#0d1526]/90 backdrop-blur border border-border p-3 rounded-lg shadow-xl relative">
            <button 
              onClick={() => setShowLegend(false)}
              className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 transition-colors"
              title="Hide Legend"
            >
              ✕
            </button>
            <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-3 pr-6">Map Legend</div>
            <div className="flex flex-col gap-2.5 text-[11px] text-slate-300">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500 flex-shrink-0"></div>
                <span>High Risk Chokepoint</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-slate-700 flex-shrink-0"></div>
                <span>Vessel (VLCC/Suezmax/Aframax)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-[#a855f7] border border-[#c084fc] rotate-45 ml-0.5 flex-shrink-0"></div>
                <span className="ml-0.5">Indian Refinery Port</span>
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowLegend(true)}
            className="bg-[#0d1526]/90 backdrop-blur border border-border px-3 py-2 rounded-lg shadow-xl text-[10px] font-bold text-slate-500 tracking-wider uppercase hover:text-slate-300 transition-colors flex items-center gap-2"
          >
            <span className="text-blue-500 text-xs">ℹ</span> Show Legend
          </button>
        )}
      </div>
    </div>
  );
}