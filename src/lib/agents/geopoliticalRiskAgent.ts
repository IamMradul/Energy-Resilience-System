import { callGemini } from '../gemini';
import { saveRiskScore, saveAlert } from '../supabase';
import type { RiskScore } from '../../types/agents';

const FALLBACK_HEADLINES = [
  "US imposes new sanctions on Iranian oil exports",
  "Houthi forces attack tanker in Red Sea shipping lane",
  "OPEC+ considers emergency production cut amid demand fears",
  "India seeks alternate crude suppliers as Gulf tensions rise",
  "Brent crude surges 6% on Strait of Hormuz closure fears"
];

export async function runGeopoliticalRiskAgent(): Promise<RiskScore[] | null> {
  let headlines: string[] = [];
  const newsApiKey = import.meta.env.VITE_NEWS_API_KEY || '';

  try {
    const url = `https://newsapi.org/v2/everything?q=oil+tanker+hormuz+opec+sanctions+red+sea&sortBy=publishedAt&pageSize=5&apiKey=${newsApiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }
    const data = await response.json();
    headlines = data.articles.map((a: any) => a.title);
  } catch (error) {
    console.log('[Geopolitical Agent] Using fallback headlines due to NewsAPI CORS or limit.');
    headlines = FALLBACK_HEADLINES;
  }

  const prompt = `You are a senior energy supply chain risk analyst for India's Ministry of Petroleum.
Analyze these latest geopolitical headlines related to oil supply:

${JSON.stringify(headlines)}

India imports 88% of its crude oil. 40-45% transits the Strait of Hormuz.
Strategic Petroleum Reserves cover only 9.5 days of consumption.

Assess the current disruption risk for ALL FOUR of the following maritime corridors:
1. "Strait of Hormuz"
2. "Red Sea/Bab-el-Mandeb"
3. "Strait of Malacca"
4. "Cape of Good Hope"

Return ONLY a valid JSON ARRAY containing exactly 4 objects. No markdown, no explanation. Raw JSON array only:

[
  {
    "corridor": "Strait of Hormuz",
    "risk_score": 72,
    "confidence": 0.83,
    "signal_sources": ["Reuters", "NewsAPI"],
    "reasoning": "Two sentences explaining the risk assessment.",
    "recommendation": "One specific actionable sentence for Indian procurement teams."
  },
  // ... (3 more objects for the other corridors)
]`;

  const jsonStr = await callGemini(prompt);
  if (!jsonStr) return null;

  try {
    const riskDataArray: RiskScore[] = JSON.parse(jsonStr);
    
    // Save all to Supabase in one batch
    await saveRiskScore(riskDataArray);
    
    // Create Alerts for any high-risk corridors
    for (const riskData of riskDataArray) {
      if (riskData.risk_score > 50) {
        const severity = riskData.risk_score > 70 ? "CRITICAL" : "HIGH";
        await saveAlert({
          title: `Risk score updated: ${riskData.corridor} at ${riskData.risk_score}/100`,
          severity,
          corridor: riskData.corridor,
          source: 'Geopolitical Risk Agent'
        });
      }
    }

    return riskDataArray;
  } catch (error) {
    console.error('[Geopolitical Agent] Failed to parse JSON from Gemini:', jsonStr, error);
    return null;
  }
}
