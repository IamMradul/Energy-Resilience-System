import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { runScenarioAgent } from '../lib/agents/scenarioAgent';
import type { ScenarioResult } from '../types/agents';
import { Activity, Play, Zap, Scissors, Ship, AlertTriangle, ArrowDown, ArrowUp, AlertCircle } from 'lucide-react';

export default function MiniScenarioPanel() {
  const [scenario, setScenario] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetchLatest();
  }, []);

  async function fetchLatest() {
    setLoading(true);
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (!error && data) setScenario(data as ScenarioResult);
    setLoading(false);
  }

  async function handleRun(eventType: string) {
    setRunning(true);
    await runScenarioAgent(eventType);
    await fetchLatest();
    setRunning(false);
  }

  // Parse confidence string into number for the width bar
  let confidenceVal = 0;
  if (scenario?.confidence_interval) {
    const match = scenario.confidence_interval.match(/(\d+)/);
    if (match) confidenceVal = parseInt(match[1]);
  }

  return (
    <div className="bg-[#0d1526] border border-white/10 rounded-lg p-4 h-full flex flex-col relative overflow-hidden">
      <div className="text-[0.7rem] font-semibold tracking-widest uppercase text-slate-500 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" /> Active Scenario
        </div>
        {scenario && !running && (
          <button 
            onClick={() => handleRun(scenario.event_type)}
            className="flex items-center gap-1 text-[0.65rem] text-[#3b82f6] border border-[#3b82f6]/50 rounded px-2 py-0.5 hover:bg-[#3b82f6]/10 transition-colors"
          >
            <Play className="w-3 h-3" /> Run
          </button>
        )}
      </div>

      {loading || running ? (
        <div className="flex-1 flex flex-col gap-3 justify-center px-2">
          <div className="h-4 bg-white/5 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-white/5 rounded animate-pulse w-full"></div>
          <div className="h-4 bg-white/5 rounded animate-pulse w-5/6"></div>
          {running && <div className="text-xs text-slate-400 mt-2 text-center">Simulating impact...</div>}
        </div>
      ) : !scenario ? (
        <div className="flex-1 flex flex-col justify-center gap-2">
          <div className="text-xs text-slate-400 mb-2 text-center">Select scenario to simulate:</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'Hormuz Closure 40%', icon: <Zap className="w-3 h-3 text-amber-500" /> },
              { id: 'OPEC Cut', icon: <Scissors className="w-3 h-3 text-rose-500" /> },
              { id: 'Red Sea', icon: <Ship className="w-3 h-3 text-blue-500" /> },
              { id: 'Combined', icon: <AlertTriangle className="w-3 h-3 text-orange-500" /> }
            ].map(s => (
              <button 
                key={s.id}
                onClick={() => handleRun(s.id)}
                className="bg-white/5 hover:bg-white/10 border border-white/5 rounded p-2 text-xs text-left transition-colors flex items-center gap-2 text-slate-300 hover:text-white"
              >
                {s.icon} <span className="truncate">{s.id}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div className="text-sm font-medium text-slate-200 mb-3">{scenario.event_type}</div>
          
          <div className="flex flex-col gap-2 border-y border-white/5 py-3 mb-3">
            <MetricRow label="Refinery run rate" value={`${scenario.impacts.refinery_run_rate_drop_pct}%`} type="down" />
            <MetricRow label="Fuel price impact" value={`${scenario.impacts.domestic_fuel_price_increase_pct}%`} type="up" />
            <MetricRow label="Power stress index" value={`${scenario.impacts.power_sector_stress_index}/100`} type="warning" />
            <MetricRow label="GDP (30d)" value={`${scenario.impacts.gdp_trajectory_30d_pct}%`} type="down" />
          </div>
          
          <div>
            <div className="flex justify-between items-center text-xs mb-1 text-slate-400">
              <span>Confidence</span>
              <span>{scenario.confidence_interval}</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-[#3b82f6] transition-all duration-700" style={{ width: `${confidenceVal}%` }}></div>
            </div>
            {scenario.mitigation_options && scenario.mitigation_options.length > 0 && (
              <div className="text-[0.7rem] text-slate-400 line-clamp-1 flex items-center gap-1.5 border-l-2 border-amber-500/50 pl-2">
                {scenario.mitigation_options[0]}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, value, type }: { label: string, value: string | number, type: 'up' | 'down' | 'warning' }) {
  let color = 'text-slate-200';
  let Icon = null;
  
  if (type === 'down') {
    color = 'text-rose-500';
    Icon = ArrowDown;
  } else if (type === 'up') {
    color = 'text-rose-500';
    Icon = ArrowUp;
  } else if (type === 'warning') {
    color = 'text-amber-500';
    Icon = AlertCircle;
  }

  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-400">{label}</span>
      <div className="flex items-center gap-1">
        {Icon && <Icon className={`w-3 h-3 ${color}`} />}
        <span className={`font-medium ${color}`}>{value}</span>
      </div>
    </div>
  );
}
