import { runGeopoliticalRiskAgent } from './geopoliticalRiskAgent';
import { runProcurementAgent } from './procurementAgent';
import { runScenarioAgent } from './scenarioAgent';
import { runSPRAgent } from './sprAgent';

let isRunning = false;

async function runWithRetry<T>(
  fn: () => Promise<T>, 
  retries = 2,
  delayMs = 2000
): Promise<T | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i < retries) {
        console.warn(`Agent retry ${i + 1}/${retries}`);
        await new Promise(r => setTimeout(r, delayMs * (i + 1)));
      }
    }
  }
  return null;
}

export async function runAllAgents(): Promise<any> {
  if (isRunning) {
    console.log('[Orchestrator] Agents already running, skipping this cycle.');
    return { success: false, reason: 'Already running' };
  }
  
  isRunning = true;
  const startTime = performance.now();
  let geminiCalls = 0;

  try {
    console.log('[Orchestrator] Starting agents...');
    
    // Notify health hook that run started
    window.dispatchEvent(new CustomEvent('agent-run-update', { 
      detail: { nextRun: new Date(Date.now() + 5 * 60 * 1000) } 
    }));
    
    // 1. Run geopoliticalRiskAgent
    const riskDataArray = await runWithRetry(() => runGeopoliticalRiskAgent());
    geminiCalls++;
    
    if (!riskDataArray || riskDataArray.length === 0) {
      console.log('[Orchestrator] Failed to get risk data. Aborting pipeline.');
      return;
    }

    // Pick the highest risk score to drive the rest of the pipeline
    const riskData = riskDataArray.reduce((max, obj) => obj.risk_score > max.risk_score ? obj : max, riskDataArray[0]);

    // 2. If riskData.risk_score > 50, run procurementAgent
    if (riskData.risk_score > 50) {
      await new Promise(r => setTimeout(r, 2000));
      console.log('[Orchestrator] Risk > 50. Running Procurement Agent...');
      await runWithRetry(() => runProcurementAgent(riskData.corridor, riskData.risk_score));
      geminiCalls++;
    }

    // 3. If riskData.risk_score > 70, run scenarioAgent
    if (riskData.risk_score > 70) {
      await new Promise(r => setTimeout(r, 2000));
      console.log('[Orchestrator] Risk > 70. Running Scenario Agent...');
      // Map corridor to an event type roughly
      let eventType = "combined_stress";
      if (riskData.corridor.toLowerCase().includes('hormuz')) {
        eventType = "hormuz_closure_40pct";
      } else if (riskData.corridor.toLowerCase().includes('red sea') || riskData.corridor.toLowerCase().includes('suez')) {
        eventType = "red_sea_suspension";
      }

      const scenarioData = await runWithRetry(() => runScenarioAgent(eventType));
      geminiCalls++;

      // 4. If scenario run, calculate supplyGap and run sprAgent
      if (scenarioData) {
        await new Promise(r => setTimeout(r, 2000));
        console.log('[Orchestrator] Scenario run. Running SPR Agent...');
        // Mock supply gap based on impact drop pct
        const dropPct = scenarioData.impacts?.refinery_run_rate_drop_pct || 20;
        const supplyGapMbpd = (4.5 * (dropPct / 100)).toFixed(2);
        
        await runWithRetry(() => runSPRAgent(parseFloat(supplyGapMbpd)));
        geminiCalls++;
      }
    }

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ All agents completed in ${elapsed}s, ${geminiCalls} Gemini calls made`);
    
    // Notify health hook that run completed
    window.dispatchEvent(new CustomEvent('agent-run-update', { 
      detail: { lastRun: new Date() } 
    }));
    
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
  } finally {
    isRunning = false;
  }
}
