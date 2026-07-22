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
    html: `<div style="width:10px;height:10px;background:#3b82f6;transform:rotate(45deg);border:1px solid #3b82f6;box-shadow:0 0 5px rgba(59,130,246,0.6);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

// Custom icons based on vessel status/type
const createVesselIcon = (vessel: any) => {
  let color = 'text-blue-500';
  let animation = '';
  if (vessel.status === 'DIVERTED') {
    color = 'text-red-500';
    animation = 'animate-pulse';
  } else if (vessel.status === 'AT ANCHOR') {
    color = 'text-gray-500';
    animation = 'animate-pulse';
  }

  const isMoving = vessel.speed > 0.5;

  // Ultra-realistic top-down crude oil tanker SVG
  const svg = `<svg viewBox="-10 -10 60 140" width="24" height="60" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hullGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="50%" stop-color="#334155"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="deckGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#7f1d1d"/>
        <stop offset="50%" stop-color="#991b1b"/>
        <stop offset="100%" stop-color="#7f1d1d"/>
      </linearGradient>
    </defs>

    <!-- Dynamic Wake (turbulent water behind) -->
    ${isMoving ? `<path d="M20 95 Q 5 120 -5 130 Q 10 125 20 105 Q 30 125 45 130 Q 35 120 20 95 Z" fill="#ffffff" opacity="0.4" style="filter: blur(2px);"/>` : ''}

    <!-- Hull with 3D gradient and glowing status stroke -->
    <path d="M20 0 C32 0 36 15 36 25 L36 90 C36 96 32 100 20 100 C8 100 4 96 4 90 L4 25 C4 15 8 0 20 0 Z" fill="url(#hullGrad)" stroke="currentColor" stroke-width="2" />
    
    <!-- Reddish-brown crude carrier main deck -->
    <path d="M20 3 C30 3 33 16 33 25 L33 85 C33 88 30 90 20 90 C10 90 7 88 7 85 L7 25 C7 16 10 3 20 3 Z" fill="url(#deckGrad)" />
    
    <!-- Status Overlay on Deck (semi-transparent) -->
    <path d="M20 3 C30 3 33 16 33 25 L33 85 C33 88 30 90 20 90 C10 90 7 88 7 85 L7 25 C7 16 10 3 20 3 Z" fill="currentColor" fill-opacity="0.3" />

    <!-- Piping Manifolds -->
    <line x1="20" y1="20" x2="20" y2="80" stroke="#94a3b8" stroke-width="1.5" />
    <line x1="16" y1="25" x2="16" y2="75" stroke="#64748b" stroke-width="0.75" />
    <line x1="24" y1="25" x2="24" y2="75" stroke="#64748b" stroke-width="0.75" />
    <rect x="12" y="30" width="16" height="4" fill="#cbd5e1" rx="1" />
    <rect x="12" y="45" width="16" height="4" fill="#cbd5e1" rx="1" />
    <rect x="12" y="60" width="16" height="4" fill="#cbd5e1" rx="1" />
    
    <!-- Bow Helipad -->
    <circle cx="20" cy="12" r="5" fill="none" stroke="#e2e8f0" stroke-width="0.5" />
    <text x="20" y="13.5" fill="#e2e8f0" font-size="4" font-family="sans-serif" font-weight="bold" text-anchor="middle">H</text>

    <!-- Superstructure (Aft Bridge) -->
    <rect x="6" y="82" width="28" height="12" fill="#e2e8f0" rx="1" />
    <rect x="8" y="84" width="24" height="8" fill="#f8fafc" rx="1" />
    <rect x="2" y="86" width="36" height="3" fill="#ffffff" rx="1" />
    <rect x="10" y="85" width="20" height="1.5" fill="#0f172a" />
    
    <!-- Engine Funnel -->
    <rect x="16" y="91" width="8" height="4" fill="#334155" rx="1" />
    <rect x="17" y="92.5" width="6" height="1.5" fill="#0f172a" />
    
    <!-- Orange Lifeboats -->
    <rect x="3" y="88.5" width="3" height="6" fill="#f97316" rx="1.5" />
    <rect x="34" y="88.5" width="3" height="6" fill="#f97316" rx="1.5" />
  </svg>`;

  return L.divIcon({
    className: 'custom-vessel-icon bg-transparent border-0',
    html: `<div class="${color} ${animation}" style="filter: drop-shadow(0 6px 8px rgba(0,0,0,0.6)) drop-shadow(0 0 10px currentColor); transform: rotate(${vessel.heading}deg); transform-origin: center; display: flex; align-items: center; justify-content: center;">
      ${svg}
    </div>`,
    iconSize: [24, 60],
    iconAnchor: [12, 30]
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
                <div className="text-blue-500 flex-shrink-0 flex items-center justify-center" style={{ filter: 'drop-shadow(0 0 4px currentColor)', width: '12px', height: '30px' }}>
                  <svg viewBox="-5 -5 50 110" width="12" height="30" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 0 C32 0 36 15 36 25 L36 90 C36 96 32 100 20 100 C8 100 4 96 4 90 L4 25 C4 15 8 0 20 0 Z" fill="#334155" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 3 C30 3 33 16 33 25 L33 85 C33 88 30 90 20 90 C10 90 7 88 7 85 L7 25 C7 16 10 3 20 3 Z" fill="#7f1d1d" />
                    <line x1="20" y1="20" x2="20" y2="80" stroke="#94a3b8" strokeWidth="1.5" />
                    <rect x="6" y="82" width="28" height="12" fill="#e2e8f0" rx="1" />
                    <rect x="2" y="86" width="36" height="3" fill="#ffffff" rx="1" />
                  </svg>
                </div>
                <span>Vessel (VLCC/Suezmax/Aframax)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-[#3b82f6] border border-[#3b82f6] rotate-45 ml-0.5 flex-shrink-0"></div>
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