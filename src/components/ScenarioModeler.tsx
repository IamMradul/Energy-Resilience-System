import React, { useState, useEffect } from 'react';
import { getLatestScenario } from '../lib/supabase';
import type { ScenarioResult } from '../types/agents';

const SCENARIOS = [
  { id: 'hormuz_closure_40pct', label: 'Hormuz Partial Closure (40% drop)' },
  { id: 'opec_emergency_cut', label: 'OPEC+ Emergency Cut' },
  { id: 'red_sea_suspension', label: 'Red Sea Total Suspension' },
  { id: 'combined_stress', label: 'Combined Stress (Hormuz + Red Sea)' }
];

export default function ScenarioModeler() {
  const [selected, setSelected] = useState(SCENARIOS[0].id);
  const [data, setData] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function load() {
      const result = await getLatestScenario(selected);
      if (isMounted) {
        setData(result);
        setLoading(false);
      }
    }

    load();

    return () => { isMounted = false; };
  }, [selected]);

  return (
    <div className="flex flex-col gap-2">
      <select 
        value={selected}
        onChange={e => setSelected(e.target.value)}
        className="bg-background border border-border rounded p-2 text-white"
      >
        {SCENARIOS.map(s => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
      
      <div className="mt-4 text-sm text-gray-300">
        {loading ? (
          <div className="animate-pulse italic text-gray-500">Simulating cascading impacts...</div>
        ) : data ? (
          <>
            <div className="font-semibold text-white mb-2">Cascading Impact:</div>
            <ul className="space-y-1">
              {data.impacts?.refinery_run_rate_drop_pct && (
                <li className="text-danger">- {data.impacts.refinery_run_rate_drop_pct}% Refinery Run Rate</li>
              )}
              {data.impacts?.domestic_fuel_price_increase_pct && (
                <li className="text-warning">- +{data.impacts.domestic_fuel_price_increase_pct}% Domestic Fuel Price</li>
              )}
              {data.impacts?.gdp_trajectory_30d_pct && (
                <li className="text-danger">- GDP {data.impacts.gdp_trajectory_30d_pct}%</li>
              )}
              {data.impacts?.days_to_supply_crunch && (
                <li className="text-warning">- {data.impacts.days_to_supply_crunch} days to supply crunch</li>
              )}
            </ul>

            {data.assumptions && data.assumptions.length > 0 && (
              <div className="mt-4">
                <div className="font-semibold text-white mb-1">Key Assumptions:</div>
                <ul className="list-disc pl-4 space-y-1 text-xs text-gray-400">
                  {data.assumptions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-500 italic">No simulation data available for this scenario yet. Wait for the agent to run.</div>
        )}
      </div>
    </div>
  );
}