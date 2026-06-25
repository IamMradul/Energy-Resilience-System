import { callGemini } from '../gemini';
import { getCached, setCached } from '../cache';
import { saveScenario } from '../supabase';
import type { ScenarioResult } from '../../types/agents';

export async function runScenarioAgent(eventType: string): Promise<ScenarioResult | null> {
  const cacheKey = `scenario_${eventType}`;
  const cached = getCached<ScenarioResult>(cacheKey);
  if (cached) {
    console.log('[Scenario Agent] Returning cached data');
    return cached;
  }

  const eventDescriptions: Record<string, string> = {
    "hormuz_closure_40pct": "40% of Hormuz traffic disrupted for 14 days",
    "opec_emergency_cut": "OPEC+ emergency cut of 2M barrels per day",
    "red_sea_suspension": "Complete Red Sea shipping suspension for 21 days",
    "combined_stress": "Hormuz 30% closure AND Red Sea disruption simultaneously"
  };

  const eventDescription = eventDescriptions[eventType] || eventType;

  const prompt = `You are an energy economist specializing in oil supply shock modeling for India.

Scenario: ${eventDescription}

India baseline data:
- Crude imports: 4.5 million barrels per day
- Hormuz dependency: 45% of imports
- Red Sea dependency: 20% of imports  
- SPR cover: 9.5 days
- Refinery capacity: 5.2 million barrels per day
- Major refineries: Jamnagar (1.24 mbpd), Kochi (0.31 mbpd), 
  Paradip (0.3 mbpd), Mangalore (0.27 mbpd)

Model the cascading impacts on India's energy system and economy.
Return ONLY valid JSON, no markdown:

{
  "event_type": "${eventType}",
  "assumptions": [
    "Assumption 1 (explicit and testable)",
    "Assumption 2",
    "Assumption 3"
  ],
  "impacts": {
    "refinery_run_rate_drop_pct": 22,
    "domestic_fuel_price_increase_pct": 14,
    "power_sector_stress_index": 67,
    "gdp_trajectory_30d_pct": -0.8,
    "estimated_cost_billion_usd": 4.2,
    "days_to_supply_crunch": 12
  },
  "confidence_interval": "85%",
  "mitigation_options": [
    "Option 1 with estimated cost/benefit",
    "Option 2"
  ]
}`;

  const jsonStr = await callGemini(prompt);
  if (!jsonStr) return null;

  try {
    const scenarioData: ScenarioResult = JSON.parse(jsonStr);
    
    // Save to Supabase
    await saveScenario(scenarioData);
    
    setCached(cacheKey, scenarioData, 30 * 60 * 1000); // 30 min TTL
    return scenarioData;
  } catch (error) {
    console.error('[Scenario Agent] Failed to parse JSON from Gemini:', jsonStr, error);
    return null;
  }
}
