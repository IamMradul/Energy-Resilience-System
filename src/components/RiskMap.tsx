import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function RiskMap() {
  return (
    <MapContainer center={[20, 60]} zoom={4} style={{ height: '100%', width: '100%', background: '#0B0F19' }} zoomControl={false}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {/* Strait of Hormuz */}
      <CircleMarker center={[26.56, 56.25]} radius={15} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.4 }}>
        <Popup>Strait of Hormuz - High Risk (78/100)</Popup>
      </CircleMarker>
      {/* Red Sea */}
      <CircleMarker center={[20, 38]} radius={25} pathOptions={{ color: 'orange', fillColor: 'orange', fillOpacity: 0.3 }}>
        <Popup>Red Sea / Suez - Medium Risk (65/100)</Popup>
      </CircleMarker>
      {/* Refineries - Kandla, Jamnagar */}
      <CircleMarker center={[23.03, 70.21]} radius={8} pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.8 }} />
      <CircleMarker center={[19.07, 72.87]} radius={8} pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.8 }} />
    </MapContainer>
  );
}