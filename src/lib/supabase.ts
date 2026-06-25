import { createClient } from '@supabase/supabase-js';
import type { RiskScore, ProcurementRec, ScenarioResult, SPRPlan, AlertFeedItem } from '../types/agents';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function saveRiskScore(data: RiskScore | RiskScore[]) {
  try {
    const { error } = await supabase.from('risk_scores').insert(data as any);
    if (error) console.error('Error saving risk score:', error);
  } catch (err) {
    console.error('Exception saving risk score:', err);
  }
}

export async function saveProcurementRecs(data: ProcurementRec[]) {
  try {
    const { error } = await supabase.from('procurement_recs').insert(data);
    if (error) console.error('Error saving procurement recs:', error);
  } catch (err) {
    console.error('Exception saving procurement recs:', err);
  }
}

export async function saveScenario(data: ScenarioResult) {
  try {
    const { error } = await supabase.from('scenarios').insert(data);
    if (error) console.error('Error saving scenario:', error);
  } catch (err) {
    console.error('Exception saving scenario:', err);
  }
}

export async function saveSprPlan(data: SPRPlan) {
  try {
    const { error } = await supabase.from('spr_plans').insert(data);
    if (error) console.error('Error saving SPR plan:', error);
  } catch (err) {
    console.error('Exception saving SPR plan:', err);
  }
}

export async function saveAlert(data: AlertFeedItem) {
  try {
    const { error } = await supabase.from('alert_feed').insert(data);
    if (error) console.error('Error saving alert:', error);
  } catch (err) {
    console.error('Exception saving alert:', err);
  }
}

export async function getLatestRiskScores() {
  try {
    // To get the latest per corridor we can order by created_at desc and group by corridor in the frontend
    // Alternatively just fetch the latest 50 and let the frontend pick the newest per corridor
    const { data, error } = await supabase
      .from('risk_scores')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching risk scores:', error);
      return [];
    }
    return data as RiskScore[];
  } catch (err) {
    console.error('Exception fetching risk scores:', err);
    return [];
  }
}

export async function getLatestProcurementRecs() {
  try {
    const { data, error } = await supabase
      .from('procurement_recs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('Error fetching procurement recs:', error);
      return [];
    }
    return data as ProcurementRec[];
  } catch (err) {
    console.error('Exception fetching procurement recs:', err);
    return [];
  }
}

export async function getLatestScenario(eventType: string) {
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('event_type', eventType)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error('Error fetching scenario:', error);
      return null;
    }
    return data && data.length > 0 ? (data[0] as ScenarioResult) : null;
  } catch (err) {
    console.error('Exception fetching scenario:', err);
    return null;
  }
}
