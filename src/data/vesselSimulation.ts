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
  // Cape of Good Hope route
  {
    mmsi: '636017890', name: 'CAPE NAVIGATOR',
    type: 'VLCC', flag: 'NG',
    lat: -25.0, lng: 28.0,
    speed: 15.1, heading: 75,
    destination: 'MANGALORE IN', cargo: 'BONNY LIGHT',
    status: 'UNDERWAY'
  },
  {
    mmsi: '311001234', name: 'ATLANTIC PIONEER',
    type: 'VLCC', flag: 'US',
    lat: -15.0, lng: 35.0,
    speed: 14.8, heading: 60,
    destination: 'KANDLA IN', cargo: 'WTI CRUDE',
    status: 'UNDERWAY'
  },
  // Near Indian ports
  {
    mmsi: '419001234', name: 'INDIA STAR',
    type: 'Aframax', flag: 'IN',
    lat: 22.8, lng: 69.5,
    speed: 5.2, heading: 45,
    destination: 'SIKKA IN', cargo: 'CRUDE OIL',
    status: 'APPROACHING PORT'
  }
]

// Hook to animate vessels — updates positions every 10 seconds
export function useVesselTracking() {
  const [vessels, setVessels] = useState<Vessel[]>(SIMULATED_VESSELS)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setVessels(prev => prev.map(vessel => {
        if (vessel.status === 'AT ANCHOR') return vessel
        
        try {
          // Move vessel based on heading and speed
          const speedKnots = vessel.speed
          const headingRad = (vessel.heading * Math.PI) / 180
          const distanceDeg = (speedKnots * 10) / 3600 / 60 // 10s movement
          
          return {
            ...vessel,
            lat: vessel.lat + Math.cos(headingRad) * distanceDeg,
            lng: vessel.lng + Math.sin(headingRad) * distanceDeg
          }
        } catch (e) {
          // Fail gracefully if calculation errors out
          return vessel
        }
      }))
    }, 10000) // update every 10 seconds
    
    return () => clearInterval(interval)
  }, [])
  
  return vessels
}
