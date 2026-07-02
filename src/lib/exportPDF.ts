import jsPDF from 'jspdf';
import { supabase, getLatestScenario } from './supabase';
import type { RiskScore, ProcurementRec, SPRPlan, ScenarioResult } from '../types/agents';

export async function exportBriefing() {
  // Fetch latest state for the briefing
  const { data: riskScores } = await supabase.from('risk_scores').select('*').order('created_at', { ascending: false }).limit(20);
  const { data: procurement } = await supabase.from('procurement_recommendations').select('*').order('created_at', { ascending: false }).limit(20);
  const { data: sprPlanArr } = await supabase.from('spr_plans').select('*').order('created_at', { ascending: false }).limit(1);
  const scenario = await getLatestScenario('combined_stress');

  // Deduplicate risk scores
  const dedupedRisk = Object.values((riskScores || []).reduce((acc, curr) => {
    if (!acc[curr.corridor]) acc[curr.corridor] = curr;
    return acc;
  }, {} as Record<string, RiskScore>));

  // Deduplicate procurement
  const dedupedProc = Object.values((procurement || []).reduce((acc, curr) => {
    if (!acc[curr.source]) acc[curr.source] = curr;
    return acc;
  }, {} as Record<string, ProcurementRec>))
  .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  .slice(0, 3);

  const sprPlan = sprPlanArr?.[0] || null;

  const doc = new jsPDF();
  
  // Dark theme background
  doc.setFillColor(10, 15, 30);
  doc.rect(0, 0, 210, 297, 'F');
  
  // Title
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(20);
  doc.text('OORJA — Energy Security Briefing', 20, 25);
  
  // Subtitle
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')} IST`, 20, 33);
  
  // Section 1: Corridor Risk
  doc.setTextColor(241, 245, 249);
  doc.setFontSize(12);
  doc.text('Corridor Risk Index', 20, 48);
  
  doc.setFontSize(10);
  let y = 56;
  dedupedRisk.forEach((r) => {
    // Red for critical, orange for high, green for normal
    if (r.risk_score > 70) doc.setTextColor(239, 68, 68);
    else if (r.risk_score > 50) doc.setTextColor(245, 158, 11);
    else doc.setTextColor(16, 185, 129);
    
    doc.text(`${r.corridor}: ${r.risk_score}/100`, 20, y);
    y += 7;
  });

  // Section 2: Top 3 Procurement Recommendations
  y += 10;
  doc.setTextColor(241, 245, 249);
  doc.setFontSize(12);
  doc.text('Top Procurement Recommendations', 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  if (dedupedProc.length > 0) {
    dedupedProc.forEach((p) => {
      doc.text(`• ${p.source} via ${p.route} (${p.volume_mbpd} MBPD) - $${p.estimated_cost_mm}/mo`, 20, y);
      y += 7;
    });
  } else {
    doc.text(`No active procurement diversions required.`, 20, y);
    y += 7;
  }

  // Section 3: SPR Status  
  y += 10;
  doc.setTextColor(241, 245, 249);
  doc.setFontSize(12);
  doc.text('Strategic Petroleum Reserve (SPR) Plan', 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  if (sprPlan && sprPlan.drawdown_mbpd > 0) {
    doc.text(`Drawdown: ${sprPlan.drawdown_mbpd} MBPD`, 20, y);
    y += 7;
    doc.text(`Days of Cover Remaining: ${sprPlan.days_of_cover_remaining} days`, 20, y);
    y += 7;
  } else {
    doc.text(`No active SPR drawdown required.`, 20, y);
    y += 7;
  }

  // Section 4: Active Scenario Impacts
  y += 10;
  doc.setTextColor(241, 245, 249);
  doc.setFontSize(12);
  doc.text('Macro Scenario Impacts', 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  if (scenario && scenario.impacts) {
    doc.text(`Refinery Run Rate Drop: ${scenario.impacts.refinery_run_rate_drop_pct}%`, 20, y);
    y += 7;
    doc.text(`Fuel Price Increase: ${scenario.impacts.domestic_fuel_price_increase_pct}%`, 20, y);
    y += 7;
    doc.text(`GDP Impact (30d): ${scenario.impacts.gdp_trajectory_30d_pct}%`, 20, y);
    y += 7;
    doc.text(`Days to Supply Crunch: ${scenario.impacts.days_to_supply_crunch} days`, 20, y);
    y += 7;
  } else {
    doc.text(`No active scenario data.`, 20, y);
    y += 7;
  }
  
  doc.save(`OORJA-Briefing-${Date.now()}.pdf`);
}
