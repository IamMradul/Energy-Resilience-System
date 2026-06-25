import { callGemini } from '../gemini';
import { getCached, setCached } from '../cache';
import { saveSprPlan } from '../supabase';
import type { SPRPlan } from '../../types/agents';

export async function runSPRAgent(supplyGapMbpd: number): Promise<SPRPlan | null> {
  const cacheKey = `spr_${supplyGapMbpd}`;
  const cached = getCached<SPRPlan>(cacheKey);
  if (cached) {
    console.log('[SPR Agent] Returning cached data');
    return cached;
  }

  const prompt = `You are an energy security advisor to India's Ministry of Petroleum and Natural Gas (MoPNG).

Current situation:
- Supply gap from disruption: ${supplyGapMbpd} million barrels per day
- Current SPR cover: 9.5 days of national consumption
- National consumption: ~5.1 million barrels per day
- SPR locations: Visakhapatnam (1.33 MMT), Mangalore (1.5 MMT), Padur (2.5 MMT)
- Total SPR volume: ~5.33 million metric tonnes

Calculate the optimal SPR drawdown strategy.
Return ONLY valid JSON, no markdown:

{
  "current_cover_days": 9.5,
  "recommended_drawdown_mbpd": 0.15,
  "projected_cover_days": 7.2,
  "replenishment_window_days": 21,
  "priority_refineries": ["Reliance Jamnagar", "HPCL Mumbai"],
  "drawdown_schedule": [
    {"day": 1, "release_mbpd": 0.1, "cumulative_released": 0.1},
    {"day": 7, "release_mbpd": 0.15, "cumulative_released": 1.15},
    {"day": 14, "release_mbpd": 0.2, "cumulative_released": 2.45}
  ],
  "risk_if_no_action": "One sentence describing consequence.",
  "estimated_days_to_exhaustion": 9
}`;

  const jsonStr = await callGemini(prompt);
  if (!jsonStr) return null;

  try {
    const sprData: SPRPlan = JSON.parse(jsonStr);
    
    // Save to Supabase
    await saveSprPlan(sprData);
    
    setCached(cacheKey, sprData, 15 * 60 * 1000); // 15 min TTL
    return sprData;
  } catch (error) {
    console.error('[SPR Agent] Failed to parse JSON from Gemini:', jsonStr, error);
    return null;
  }
}
