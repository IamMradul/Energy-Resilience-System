import { runGeopoliticalRiskAgent } from './geopoliticalRiskAgent';
import { runProcurementAgent } from './procurementAgent';
import { runScenarioAgent } from './scenarioAgent';
import { runSPRAgent } from './sprAgent';

export async function runAllAgents(): Promise<any> {
  const startTime = Date.now();
  let geminiCalls = 0;

  try {
    console.log('[Orchestrator] Starting agents...');
    
    // 1. Run geopoliticalRiskAgent
    const riskData = await runGeopoliticalRiskAgent();
    geminiCalls++;
    
    if (!riskData) {
      console.log('[Orchestrator] Failed to get risk data. Aborting pipeline.');
      return;
    }

    // 2. If riskData.risk_score > 50, run procurementAgent
    if (riskData.risk_score > 50) {
      console.log('[Orchestrator] Risk > 50. Running Procurement Agent...');
      await runProcurementAgent(riskData.corridor, riskData.risk_score);
      geminiCalls++;
    }

    // 3. If riskData.risk_score > 70, run scenarioAgent
    if (riskData.risk_score > 70) {
      console.log('[Orchestrator] Risk > 70. Running Scenario Agent...');
      // Map corridor to an event type roughly
      let eventType = "combined_stress";
      if (riskData.corridor.toLowerCase().includes('hormuz')) {
        eventType = "hormuz_closure_40pct";
      } else if (riskData.corridor.toLowerCase().includes('red sea') || riskData.corridor.toLowerCase().includes('suez')) {
        eventType = "red_sea_suspension";
      }

      const scenarioData = await runScenarioAgent(eventType);
      geminiCalls++;

      // 4. If scenario run, calculate supplyGap and run sprAgent
      if (scenarioData) {
        console.log('[Orchestrator] Scenario run. Running SPR Agent...');
        // Mock supply gap based on impact drop pct
        const dropPct = scenarioData.impacts?.refinery_run_rate_drop_pct || 20;
        const supplyGapMbpd = (4.5 * (dropPct / 100)).toFixed(2);
        
        await runSPRAgent(parseFloat(supplyGapMbpd));
        geminiCalls++;
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Orchestrator] All agents completed in ${elapsed}s, ${geminiCalls} Gemini calls made`);
    
    return {
      success: true,
      elapsed,
      geminiCalls
    };
  } catch (error) {
    console.error('[Orchestrator] Pipeline failed:', error);
    return {
      success: false,
      error
    };
  }
}
