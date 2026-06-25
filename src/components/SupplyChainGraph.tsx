import React, { useEffect, useState } from 'react';
import { getChokepointRiskRanking, getRefineriasAtRisk } from '../lib/knowledge-graph/graphQueries';
import { AlertCircle } from 'lucide-react';

export default function SupplyChainGraph() {
  const [data, setData] = useState<{ chokepoints: any[], refineries: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // 5-second timeout for the graph
    const t = setTimeout(() => {
      if (isMounted && loading) {
        setTimedOut(true);
      }
    }, 5000);

    async function loadGraphData() {
      try {
        const cps = await getChokepointRiskRanking();
        // Just pick top one to show refineries for mockup purposes, or aggregate
        const topCp = cps[0]?.chokepoint;
        const refs = topCp ? await getRefineriasAtRisk(topCp) : [];
        
        if (isMounted) {
          setData({ chokepoints: cps, refineries: refs });
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadGraphData();

    return () => {
      isMounted = false;
      clearTimeout(t);
    };
  }, []);

  if (loading && !timedOut) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-card rounded-lg border border-border">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-gray-400 font-medium">Loading live graph topology...</p>
        </div>
      </div>
    );
  }

  if (timedOut || error || !data || data.chokepoints.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-card rounded-lg border border-border p-8 text-center">
        <AlertCircle className="w-16 h-16 text-warning mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-gray-200 mb-2">Knowledge Graph Unavailable</h3>
        <p className="text-gray-400 max-w-md">
          Unable to connect to Neo4j AuraDB. Please verify your connection string and credentials in the <code className="bg-black/30 px-2 py-1 rounded text-primary">.env</code> file.
        </p>
      </div>
    );
  }

  // Very simplified SVG visualization for the nodes and edges
  return (
    <div className="h-full w-full bg-[#0B0F19] rounded-lg border border-border p-6 overflow-hidden relative">
      <h3 className="text-lg font-bold text-gray-200 mb-6 flex items-center gap-2 z-10 relative">
        Live Supply Chain Topology
      </h3>
      
      <div className="absolute inset-0 pt-20 pb-10 px-10 flex justify-between items-center z-0">
        {/* Suppliers Col */}
        <div className="flex flex-col justify-around h-full">
          {['Saudi Arabia', 'Iraq', 'UAE', 'USA'].map(s => (
            <div key={s} className="bg-card border border-success/30 px-4 py-2 rounded-lg text-sm font-semibold shadow-lg relative group">
              {s}
              <div className="absolute left-full top-1/2 w-32 h-px bg-success/20 -z-10 group-hover:bg-success transition-colors"></div>
            </div>
          ))}
        </div>

        {/* Chokepoints Col */}
        <div className="flex flex-col justify-around h-full">
          {data.chokepoints.slice(0, 3).map((cp: any) => {
            const risk = cp.riskScore?.toNumber ? cp.riskScore.toNumber() : Number(cp.riskScore || 0);
            const colorClass = risk > 70 ? 'border-danger/50 text-danger' : risk > 40 ? 'border-warning/50 text-warning' : 'border-success/50 text-success';
            const bgClass = risk > 70 ? 'bg-danger/10' : risk > 40 ? 'bg-warning/10' : 'bg-success/10';
            return (
              <div key={cp.chokepoint} className={`bg-card border ${colorClass} ${bgClass} px-4 py-3 rounded-lg font-bold shadow-lg text-center relative group cursor-pointer hover:scale-105 transition-transform`}>
                {cp.chokepoint}
                <div className="text-xs font-normal opacity-80 mt-1">Risk: {risk}/100</div>
                <div className="absolute left-full top-1/2 w-32 h-px bg-gray-700 -z-10 group-hover:bg-white/50 transition-colors"></div>
                <div className="absolute right-full top-1/2 w-32 h-px bg-gray-700 -z-10 group-hover:bg-white/50 transition-colors"></div>
              </div>
            );
          })}
        </div>

        {/* Ports / Refineries Col */}
        <div className="flex flex-col justify-around h-full">
          {data.refineries.slice(0, 5).map((r: any) => (
            <div key={r.refinery} className="bg-card border border-blue-500/30 px-4 py-2 rounded-lg text-sm font-semibold shadow-lg relative group">
              {r.refinery}
              <div className="text-xs text-gray-400 mt-1 font-normal">via {r.feedPort}</div>
              <div className="absolute right-full top-1/2 w-32 h-px bg-blue-500/20 -z-10 group-hover:bg-blue-500 transition-colors"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
