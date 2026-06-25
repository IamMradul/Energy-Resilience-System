import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { getRefineriasAtRisk, findAlternativeRoutes, getSupplierRiskExposure } from '../lib/knowledge-graph/graphQueries';

interface PanelProps {
  selectedChokepoint: string | null;
  onClose: () => void;
}

export default function KnowledgeGraphPanel({ selectedChokepoint, onClose }: PanelProps) {
  const [refineries, setRefineries] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!selectedChokepoint) return;
    
    let isMounted = true;
    setLoading(true);
    setError(false);

    async function loadData() {
      try {
        const [refs, alts] = await Promise.all([
          getRefineriasAtRisk(selectedChokepoint!),
          findAlternativeRoutes(selectedChokepoint!)
        ]);
        
        if (isMounted) {
          setRefineries(refs);
          setRoutes(alts);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadData();

    return () => { isMounted = false; };
  }, [selectedChokepoint]);

  if (!selectedChokepoint) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-card border-l border-border shadow-2xl z-[1000] flex flex-col transition-transform duration-300 transform translate-x-0">
      <div className="p-4 border-b border-border flex items-center justify-between bg-black/20">
        <h3 className="font-bold text-lg text-primary flex items-center gap-2">
          <Activity className="w-5 h-5" /> Intelligence
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-6">
        <div className="bg-white/5 p-3 rounded border border-white/10">
          <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Selected Node</div>
          <div className="font-semibold text-lg">{selectedChokepoint}</div>
        </div>

        {loading ? (
          <div className="text-gray-500 italic animate-pulse">Querying Knowledge Graph...</div>
        ) : error ? (
          <div className="text-warning italic">Graph unavailable</div>
        ) : (
          <>
            <div>
              <h4 className="flex items-center gap-2 font-semibold text-danger mb-3 border-b border-border pb-2">
                <AlertTriangle className="w-4 h-4" /> Refineries at Risk
              </h4>
              {refineries.length === 0 ? (
                <div className="text-sm text-gray-500">No immediate risk paths detected.</div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {refineries.map((r, i) => (
                    <li key={i} className="bg-danger/10 border border-danger/20 p-2 rounded text-sm">
                      <div className="font-bold text-gray-200">{r.refinery}</div>
                      <div className="text-gray-400 flex justify-between mt-1">
                        <span>{r.capacity?.toNumber ? r.capacity.toNumber() : r.capacity} mbpd</span>
                        <span>via {r.feedPort}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="flex items-center gap-2 font-semibold text-success mb-3 border-b border-border pb-2">
                <ShieldCheck className="w-4 h-4" /> Safe Alternative Routes
              </h4>
              {routes.length === 0 ? (
                <div className="text-sm text-gray-500">No alternatives found in graph.</div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {routes.slice(0, 3).map((route, i) => (
                    <li key={i} className="bg-success/10 border border-success/20 p-2 rounded text-sm">
                      <div className="font-bold text-gray-200">{route.supplier} &rarr; {route.port}</div>
                      <div className="text-gray-400 mt-1">via {route.chokepoint}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
