import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ResponseMetrics() {
  const [counts, setCounts] = useState({ agents: 0, alerts: 0, recs: 0 });

  useEffect(() => {
    async function fetchCounts() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isoToday = today.toISOString();

      const [riskRes, alertRes, recRes] = await Promise.all([
        supabase.from('risk_scores').select('*', { count: 'exact', head: true }).gte('created_at', isoToday),
        supabase.from('alert_feed').select('*', { count: 'exact', head: true }).gte('created_at', isoToday),
        supabase.from('procurement_recs').select('*', { count: 'exact', head: true }).gte('created_at', isoToday)
      ]);

      setCounts({
        agents: riskRes.count || 0,
        alerts: alertRes.count || 0,
        recs: recRes.count || 0
      });
    }

    fetchCounts();
    // Update every 5 minutes
    const interval = setInterval(fetchCounts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0d1526] border border-border rounded-lg p-4 flex flex-col justify-between h-full">
      <div className="text-[0.7rem] font-semibold tracking-widest uppercase text-slate-500 mb-3 flex items-center gap-2">
        <span className="text-[#3b82f6]">⚡</span> Response Performance
      </div>

      <div className="flex flex-col text-[0.8rem] text-slate-300 gap-1 mb-3">
        <div className="flex justify-between">
          <span>Signal → Detection</span>
          <span className="font-bold text-white">&lt; 2 min</span>
        </div>
        <div className="flex justify-between">
          <span>Detection → Score</span>
          <span className="font-bold text-white">&lt; 5 min</span>
        </div>
        <div className="flex justify-between">
          <span>Score → Rec</span>
          <span className="font-bold text-white">&lt; 8 min</span>
        </div>
      </div>

      <div className="flex flex-col text-[0.8rem] gap-2 border-t border-border pt-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Agents fired today</span>
          <span className="font-bold text-white">{counts.agents}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Alerts generated</span>
          <span className="font-bold text-white">{counts.alerts}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Recs delivered</span>
          <span className="font-bold text-white">{counts.recs}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="whitespace-nowrap">SLA compliance:</span>
        <div className="flex-1 h-1.5 bg-slate-800/50 rounded-full overflow-hidden flex items-center">
          <div className="h-full bg-success w-[98%]"></div>
        </div>
        <span className="font-bold text-white">98%</span>
      </div>
    </div>
  );
}
