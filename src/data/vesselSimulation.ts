import { useState, useEffect } from 'react'
import type { Vessel } from '../types/agents'

export const SIMULATED_VESSELS: Vessel[] = [
  // Gulf tankers (near Hormuz)
  {
    mmsi: '477123456', name: 'PERSIAN STAR',
    type: 'VLCC', flag: 'SA',
    lat: 26.5 + (Math.random() * 2 - 1),
    lng: 56.5 + (Math.random() * 2 - 1),
    speed: 12.4, heading: 120,
    destination: 'SIKKA IN', cargo: 'CRUDE OIL',
    status: 'UNDERWAY'
  },
  {
    mmsi: '477123457', name: 'GULF EAGLE',
    type: 'Suezmax', flag: 'AE',
    lat: 25.8, lng: 57.2,
    speed: 13.1, heading: 135,
    destination: 'MUMBAI IN', cargo: 'CRUDE OIL',
    status: 'UNDERWAY'
  },
  {
    mmsi: '636015234', name: 'ARABIAN KNIGHT',
    type: 'VLCC', flag: 'IQ',
    lat: 26.9, lng: 55.8,
    speed: 11.8, heading: 115,
    destination: 'PARADIP IN', cargo: 'CRUDE OIL',
    status: 'UNDERWAY'
  },
  // Red Sea vessels
  {
    mmsi: '538005678', name: 'RED SEA FORTUNE',
    type: 'Aframax', flag: 'SA',
    lat: 15.2, lng: 42.8,
    speed: 0, heading: 0,
    destination: 'JEDDAH SA', cargo: 'CRUDE OIL',
    status: 'AT ANCHOR',
    alert: 'DIVERTED - Houthi threat'
  },
  {
    mmsi: '477234567', name: 'SUEZ CARRIER',
    type: 'Suezmax', flag: 'EG',
    lat: 28.1, lng: 33.4,
    speed: 14.2, heading: 180,
    destination: 'KOCHI IN', cargo: 'CRUDE OIL',
    status: 'UNDERWAY'
  },
  {
    mmsi: '477345678', name: 'SUEZ TRANSIT',
    type: 'Suezmax', flag: 'SA',
    lat: 29.5, lng: 32.8,
    speed: 13.5, heading: 145,
    destination: 'KOCHI IN', cargo: 'ARAB LIGHT',
    status: 'UNDERWAY'
  },
  // Cape of Good Hope route
  {
    mmsi: '636017890', name: 'CAPE NAVIGATOR',
    type: 'VLCC', flag: 'NG',
    lat: -35.0, lng: 20.0, // Off the southern tip of South Africa
    speed: 15.1, heading: 75,
    destination: 'MANGALORE IN', cargo: 'BONNY LIGHT',
    status: 'UNDERWAY'
  },
  {
    mmsi: '311001234', name: 'ATLANTIC PIONEER',
    type: 'VLCC', flag: 'US',
    lat: -15.0, lng: 55.0, // East of Madagascar in the Indian Ocean
    speed: 14.8, heading: 60,
    destination: 'KANDLA IN', cargo: 'WTI CRUDE',
    status: 'UNDERWAY'
  },
  // Near Indian ports
  {
    mmsi: '419001234', name: 'INDIA STAR',
    type: 'Aframax', flag: 'IN',
    lat: 20.0, lng: 69.0, // Placed in the Arabian Sea
    speed: 5.2, heading: 225, // Heading South-West, away from land
    destination: 'SIKKA IN', cargo: 'CRUDE OIL',
    status: 'APPROACHING PORT'
  }
]

// Hook to animate vessels — connects to live AIS if API key provided, otherwise uses mock animation
export function useVesselTracking() {
  const [vessels, setVessels] = useState<Vessel[]>(() => {
    const saved = localStorage.getItem('vessel_state_v5');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return SIMULATED_VESSELS;
  });
  
  useEffect(() => {
    const apiKey = import.meta.env.VITE_AISSTREAM_API_KEY;
    
    // Fallback: If no API key is provided, use the simulated animation
    if (!apiKey || apiKey === 'your_aisstream_api_key_here') {
      const interval = setInterval(() => {
        setVessels(prev => {
          const next = prev.map((vessel, idx) => {
            if (vessel.status === 'AT ANCHOR') return vessel;
            try {
              const speedMultiplier = 600;
              const timeElapsedHours = 1 / 3600;
              const distanceDegrees = (vessel.speed * speedMultiplier / 60) * timeElapsedHours;
              const headingRad = (vessel.heading * Math.PI) / 180;
              let newLat = vessel.lat + Math.cos(headingRad) * distanceDegrees;
              let newLng = vessel.lng + (Math.sin(headingRad) * distanceDegrees) / Math.cos(vessel.lat * Math.PI / 180);

              // Only reset for mock SIMULATED vessels to prevent them wandering endlessly
              if (idx < SIMULATED_VESSELS.length) {
                const initial = SIMULATED_VESSELS[idx];
                if (Math.abs(newLat - initial.lat) > 5 || Math.abs(newLng - initial.lng) > 5) {
                  newLat = initial.lat;
                  newLng = initial.lng;
                }
              }
              return { ...vessel, lat: newLat, lng: newLng };
            } catch (e) {
              return vessel;
            }
          });
          localStorage.setItem('vessel_state_v5', JSON.stringify(next));
          return next;
        });
      }, 1000);
      return () => clearInterval(interval);
    }

    // Live Aisstream implementation
    let socket: WebSocket | null = null;
    let isComponentMounted = true;

    // Small delay to prevent React StrictMode from spamming connections
    const connectTimeout = setTimeout(() => {
      if (!isComponentMounted) return;
      
      socket = new WebSocket("wss://stream.aisstream.io/v0/stream");
      
      socket.onopen = function () {
        const subscriptionMessage = {
          APIKey: apiKey.trim(),
          BoundingBoxes: [
            [[24.0, 52.0], [27.0, 57.0]]
          ],
          FilterMessageTypes: ["PositionReport"]
        };
        console.log("Connected to Aisstream!");
        socket?.send(JSON.stringify(subscriptionMessage));
      };

      socket.onmessage = function (event) {
        try {
          const aisMessage = JSON.parse(event.data);
          if (aisMessage.MessageType === "PositionReport") {
            const report = aisMessage.Message.PositionReport;
            const meta = aisMessage.MetaData;
            
            setVessels(prev => {
              const mmsiStr = String(meta.MMSI);
              const existingIdx = prev.findIndex(v => v.mmsi === mmsiStr);
              const shipName = meta.ShipName ? meta.ShipName.trim() : `VESSEL ${mmsiStr}`;
              
              const newVessel: Vessel = existingIdx >= 0 ? { ...prev[existingIdx] } : {
                mmsi: mmsiStr,
                name: shipName,
                type: 'Aframax', // Generic fallback
                flag: 'UNKNOWN',
                lat: report.Latitude,
                lng: report.Longitude,
                speed: report.Sog || 0,
                heading: report.TrueHeading || report.Cog || 0,
                destination: 'UNKNOWN',
                cargo: 'MIXED',
                status: report.Sog > 0.5 ? 'UNDERWAY' : 'AT ANCHOR'
              };
              
              // Update with latest position
              newVessel.lat = report.Latitude;
              newVessel.lng = report.Longitude;
              newVessel.speed = report.Sog || newVessel.speed;
              newVessel.heading = report.TrueHeading || report.Cog || newVessel.heading;
              
              // Only update if ship has a valid coordinate (Aisstream sometimes sends 91, 181 for invalid)
              if (newVessel.lat > 90 || newVessel.lng > 180) return prev;

              const next = [...prev];
              if (existingIdx >= 0) {
                next[existingIdx] = newVessel;
              } else {
                // Add to top, cap at 100 vessels to avoid lag
                next.unshift(newVessel);
                if (next.length > 100) next.pop();
              }
              
              localStorage.setItem('vessel_state_v5', JSON.stringify(next));
              return next;
            });
          }
        } catch (err) {
          console.error("Error parsing AIS message", err);
        }
      };

      socket.onerror = (err) => console.error("Aisstream error:", err);
      socket.onclose = () => console.log("Aisstream connection closed.");
    }, 500); // 500ms debounce
    
    return () => {
      isComponentMounted = false;
      clearTimeout(connectTimeout);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);
  
  return vessels;
}
