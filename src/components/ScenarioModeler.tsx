import React, { useState, useEffect } from 'react';
import { supabase, getLatestScenario } from '../lib/supabase';
import type { ScenarioResult } from '../types/agents';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const SCENARIOS = [
  { id: 'hormuz_closure_40pct', label: 'Hormuz Partial Closure (40% drop)' },
  { id: 'opec_emergency_cut', label: 'OPEC+ Emergency Cut' },
  { id: 'red_sea_suspension', label: 'Red Sea Total Suspension' },
  { id: 'combined_stress', label: 'Combined Stress (Hormuz + Red Sea)' }
];

export default function ScenarioModeler() {
  const [selected, setSelected] = useState(SCENARIOS[0].id);
  const [data, setData] = useState<ScenarioResult | null>(null);
  const [allScenarios, setAllScenarios] = useState<ScenarioResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function load() {
      const result = await getLatestScenario(selected);
      
      const { data: recent, error } = await supabase.from('scenarios').select('*')
        .order('created_at', { ascending: false })
        .limit(8);

      if (isMounted) {
        setData(result);
        if (!error && recent) {
          const dedup = recent.reduce((acc, curr) => {
            if (!acc[curr.event_type]) acc[curr.event_type] = curr;
            return acc;
          }, {} as Record<string, ScenarioResult>);
          setAllScenarios(Object.values(dedup));
        }
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
              {data.impacts?.refinery_run_rate_drop_pct !== undefined && (
                <li className="text-danger">- {data.impacts.refinery_run_rate_drop_pct}% Refinery Run Rate</li>
              )}
              {data.impacts?.domestic_fuel_price_increase_pct !== undefined && (
                <li className="text-warning">- +{data.impacts.domestic_fuel_price_increase_pct}% Domestic Fuel Price</li>
              )}
              {data.impacts?.gdp_trajectory_30d_pct !== undefined && (
                <li className="text-danger">- GDP {data.impacts.gdp_trajectory_30d_pct}%</li>
              )}
              {data.impacts?.days_to_supply_crunch !== undefined && (
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

            {data.confidence_interval && (
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs text-slate-500 uppercase tracking-widest">Confidence</span>
                <div className="flex-1 h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                    style={{ width: data.confidence_interval }}
                  />
                </div>
                <span className="text-xs font-bold text-blue-400">
                  {data.confidence_interval}
                </span>
              </div>
            )}

            {allScenarios.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-3">
                  All Scenario Comparison
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-slate-500 text-xs pb-2">Scenario</th>
                      <th className="text-right text-slate-500 text-xs pb-2">Refinery</th>
                      <th className="text-right text-slate-500 text-xs pb-2">Fuel Price</th>
                      <th className="text-right text-slate-500 text-xs pb-2">GDP</th>
                      <th className="text-right text-slate-500 text-xs pb-2">Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allScenarios.map(s => {
                      const isSelected = s.event_type === selected;
                      const label = SCENARIOS.find(x => x.id === s.event_type)?.label || s.event_type;
                      return (
                        <tr key={s.id} className={`border-b border-border ${isSelected ? 'bg-slate-800/50' : ''}`}>
                          <td className="py-2 text-slate-300 text-xs pr-2">{label}</td>
                          <td className="py-2 text-right text-danger font-medium text-xs">-{s.impacts?.refinery_run_rate_drop_pct ?? 0}%</td>
                          <td className="py-2 text-right text-warning font-medium text-xs">+{s.impacts?.domestic_fuel_price_increase_pct ?? 0}%</td>
                          <td className="py-2 text-right text-danger font-medium text-xs">{s.impacts?.gdp_trajectory_30d_pct ?? 0}%</td>
                          <td className="py-2 text-right text-slate-300 font-medium text-xs">{s.impacts?.days_to_supply_crunch ?? 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-6 h-56 w-full">
                  <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-2">
                    Macro Impact Comparison
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={allScenarios.map(s => ({
                        label: SCENARIOS.find(x => x.id === s.event_type)?.label.split(' ')[0] || s.event_type,
                        refinery_drop: s.impacts?.refinery_run_rate_drop_pct ?? 0,
                        fuel_increase: s.impacts?.domestic_fuel_price_increase_pct ?? 0,
                        days_to_crunch: s.impacts?.days_to_supply_crunch ?? 0
                      }))}
                    >
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{
                          background: '#0d1526',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          color: '#f1f5f9',
                          fontSize: '11px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', color: '#64748b' }} />
                      <Bar dataKey="refinery_drop" name="Refinery ↓%" fill="#ef4444" radius={[3,3,0,0]} />
                      <Bar dataKey="fuel_increase" name="Fuel ↑%" fill="#f59e0b" radius={[3,3,0,0]} />
                      <Bar dataKey="days_to_crunch" name="Days to Crunch" fill="#3b82f6" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
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