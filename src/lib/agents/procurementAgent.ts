import { callGemini } from '../gemini';
import { saveProcurementRecs } from '../supabase';
import type { ProcurementRec } from '../../types/agents';

export async function runProcurementAgent(corridor: string, riskScore: number): Promise<ProcurementRec[]> {
  let wtiPrice = "$83.50";
  const alphaVantageKey = import.meta.env.VITE_ALPHA_VANTAGE_KEY || '';

  try {
    const url = `https://www.alphavantage.co/query?function=WTI&interval=daily&apikey=${alphaVantageKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Alpha Vantage error: ${response.status}`);
    }
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      wtiPrice = `$${data.data[0].value}`;
    }
  } catch (error) {
    console.log('[Procurement Agent] Using fallback WTI price due to Alpha Vantage limit/error.');
  }

  const prompt = `You are a crude oil procurement specialist for Indian state refiners (IOC, HPCL, BPCL, MRPL, Reliance).

Current market context:
- WTI Crude price: ${wtiPrice}/barrel
- Disruption corridor: ${corridor}
- Disruption risk score: ${riskScore}/100
- India's SPR cover: 9.5 days

India's main refineries and their port dependencies:
- Reliance Jamnagar -> Kandla / Sikka port (Gujarat)
- HPCL Mumbai -> JNPT / Mumbai port  
- BPCL Kochi -> Kochi port (Kerala)
- IOC Paradip -> Paradip port (Odisha)
- MRPL Mangalore -> New Mangalore port
- IOC Panipat -> Kandla port (Gujarat)
- HPCL Vizag -> Visakhapatnam port

Generate 3 alternative procurement recommendations ranked by feasibility.
Return ONLY a valid JSON array. No markdown, no explanation:

[
  {
    "rank": 1,
    "source": "Nigeria (Bonny Light)",
    "route": "Lagos -> Cape of Good Hope -> Paradip Port",
    "spot_price_usd": 85.20,
    "transit_days": 24,
    "grade_compatible_refineries": ["IOC Paradip", "MRPL Mangalore"],
    "tanker_availability": "HIGH",
    "port_congestion": "LOW",
    "priority": "HIGH"
  }
]`;

  const jsonStr = await callGemini(prompt);
  if (!jsonStr) return [];

  try {
    const recs: ProcurementRec[] = JSON.parse(jsonStr);
    
    // Save to Supabase
    if (recs && recs.length > 0) {
      await saveProcurementRecs(recs);
    }
    
    return recs;
  } catch (error) {
    console.error('[Procurement Agent] Failed to parse JSON from Gemini:', jsonStr, error);
    return [];
  }
}
