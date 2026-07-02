import React, { useEffect, useState } from 'react';
import { getGlobalTopology } from '../lib/knowledge-graph/graphQueries';
import { supabase } from '../lib/supabase';
import { AlertCircle, Activity } from 'lucide-react';

export default function SupplyChainGraph() {
  const [data, setData] = useState<{ 
    chokepoints: any[], 
    refineries: any[], 
    suppliers: string[],
    supplierToCp: Set<string>,
    cpToRefinery: Map<string, { isPrimary: boolean }>
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState<string | boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const t = setTimeout(() => {
      if (isMounted) {
        setTimedOut(true);
      }
    }, 15000);

    async function loadGraphData() {
      try {
        const topology = await getGlobalTopology();
        
        const { data: liveRisks } = await supabase
          .from('risk_scores')
          .select('corridor, risk_score')
          .order('created_at', { ascending: false })
          .limit(20);

        const liveMap = (liveRisks ?? []).reduce((acc, r) => {
          if (!acc[r.corridor]) acc[r.corridor] = r.risk_score;
          return acc;
        }, {} as Record<string, number>);
        
        const uniqueSuppliers = new Set<string>();
        const chokepointsMap = new Map<string, any>();
        const refineriesMap = new Map<string, any>();
        const sToC = new Set<string>();
        const cToR = new Map<string, { isPrimary: boolean }>();

        topology.forEach((r: any) => {
          const s = r.supplier;
          const c = r.chokepoint;
          const rName = r.refinery;
          const port = r.feedPort;
          const risk = r.riskScore?.low !== undefined ? r.riskScore.low : Number(r.riskScore || 0);

          if (s) uniqueSuppliers.add(s);
          if (c) {
            const finalRisk = liveMap[c] ?? risk;
            chokepointsMap.set(c, { chokepoint: c, riskScore: { low: finalRisk } });
            if (s) sToC.add(`${s}|${c}`);
          }
          if (rName) {
            refineriesMap.set(rName, { refinery: rName, feedPort: port });
            if (c) cToR.set(`${c}|${rName}`, { isPrimary: r.isPrimary });
          }
        });

        // Sort chokepoints by predefined vertical layout
        const order = ['Strait of Hormuz', 'Red Sea/Bab-el-Mandeb', 'Strait of Malacca', 'Cape of Good Hope'];
        const chokepoints = Array.from(chokepointsMap.values()).sort((a,b) => {
          const idxA = order.indexOf(a.chokepoint);
          const idxB = order.indexOf(b.chokepoint);
          return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
        });
        
        // Sort suppliers so they group by chokepoint (prevents crossing lines)
        const suppliers = Array.from(uniqueSuppliers).sort((a, b) => {
          let cpA = 999, cpB = 999;
          chokepoints.forEach((c, idx) => {
            if (sToC.has(`${a}|${c.chokepoint}`)) cpA = Math.min(cpA, idx);
            if (sToC.has(`${b}|${c.chokepoint}`)) cpB = Math.min(cpB, idx);
          });
          return cpA - cpB;
        });
        
        const refineries = Array.from(refineriesMap.values());
        
        if (isMounted) {
          clearTimeout(t);
          setData({ 
            chokepoints: chokepoints, 
            refineries: refineries,
            suppliers: suppliers,
            supplierToCp: sToC,
            cpToRefinery: cToR
          });
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          clearTimeout(t);
          setError(err instanceof Error ? err.message : String(err));
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
      <div className="flex-1 h-full min-h-[700px] w-full flex items-center justify-center bg-card rounded-lg border border-border">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-gray-400 font-medium">Loading live graph topology...</p>
        </div>
      </div>
    );
  }

  if (timedOut || error || !data || data.chokepoints.length === 0) {
    const isNoData = data && data.chokepoints.length === 0 && !error;
    
    return (
      <div className="flex-1 h-full min-h-[700px] w-full flex flex-col items-center justify-center bg-card rounded-lg border border-border p-8 text-center">
        <AlertCircle className="w-16 h-16 text-warning mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-gray-200 mb-2">
          {isNoData ? "Knowledge Graph Empty" : "Knowledge Graph Unavailable"}
        </h3>
        <p className="text-gray-400 max-w-md">
          {typeof error === 'string' ? (
            <><strong>Error:</strong> {error}</>
          ) : isNoData ? (
            <>Successfully connected to Neo4j AuraDB, but the database is empty. Please wait for the auto-seeder to finish.</>
          ) : (
            <>Unable to connect to Neo4j AuraDB. Please verify your connection string and credentials in the <code className="bg-black/30 px-2 py-1 rounded text-primary">.env</code> file.</>
          )}
        </p>
      </div>
    );
  }

  // Draw SVG Bezier Curves perfectly matched to percentages
  const renderConnections = () => {
    const connections: React.ReactElement[] = [];
    
    // Suppliers to Chokepoints
    data.suppliers.forEach((supplier, i) => {
      const y1 = ((i + 0.5) / data.suppliers.length) * 100;
      data.chokepoints.forEach((cp, j) => {
        if (!data.supplierToCp.has(`${supplier}|${cp.chokepoint}`)) return; 
        
        const y2 = ((j + 0.5) / data.chokepoints.length) * 100;
        // From X=20 (Supplier right) to X=40 (Chokepoint left)
        connections.push(
          <path 
            key={`s-c-${i}-${j}`}
            d={`M 20 ${y1} C 30 ${y1}, 30 ${y2}, 40 ${y2}`}
            fill="none"
            stroke="rgba(16, 185, 129, 1)"
            strokeWidth="1.5"
            opacity={0.3}
            className="animate-pulse"
            style={{ animationDuration: `${3 + (i+j)}s` }}
          />
        );
      });
    });

    // Chokepoints to Refineries
    data.chokepoints.forEach((cp, j) => {
      const y1 = ((j + 0.5) / data.chokepoints.length) * 100;
      data.refineries.forEach((ref, k) => {
        const route = data.cpToRefinery.get(`${cp.chokepoint}|${ref.refinery}`);
        if (!route) return; 
        
        const y2 = ((k + 0.5) / data.refineries.length) * 100;
        // From X=60 (Chokepoint right) to X=80 (Refinery left)
        connections.push(
          <path 
            key={`c-r-${j}-${k}`}
            d={`M 60 ${y1} C 70 ${y1}, 70 ${y2}, 80 ${y2}`}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            opacity={0.6}
            className="animate-pulse"
            style={{ animationDuration: `${4 + (j+k)}s` }}
          />
        );
      });
    });

    return connections;
  };

  const getPathsForSupplier = (supplier: string) => {
    if (!data) return [];
    const paths: { chokepoint: string; refinery: string; port: string; isPrimary: boolean }[] = [];
    data.chokepoints.forEach(cp => {
      if (data.supplierToCp.has(`${supplier}|${cp.chokepoint}`)) {
        data.refineries.forEach(ref => {
          const route = data.cpToRefinery.get(`${cp.chokepoint}|${ref.refinery}`);
          if (route) {
            paths.push({
              chokepoint: cp.chokepoint,
              refinery: ref.refinery,
              port: ref.feedPort,
              isPrimary: route.isPrimary
            });
          }
        });
      }
    });
    return paths;
  };

  return (
    <div className="flex-1 h-full w-full bg-[#0B0F19] rounded-lg border border-border overflow-auto custom-scrollbar relative shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
      <div className="min-w-[1000px] min-h-[800px] p-6 relative w-full h-full flex flex-col">
        <h3 className="text-lg font-bold text-gray-200 mb-2 flex items-center gap-2 z-10 relative">
          <Activity className="w-5 h-5 text-primary" />
          Live Supply Chain Topology
        </h3>
        <p className="text-sm text-gray-400 mb-6 z-10 relative">Real-time risk propagation from source nations through critical maritime chokepoints to domestic refineries.</p>
        
        {/* Node Container */}
        <div className="absolute inset-0 pt-24 pb-12 px-8 z-10 pointer-events-none">
          
          {/* SVG connecting lines positioned exactly with HTML container */}
          <div className="absolute inset-0 pt-24 pb-12 px-8">
            <svg 
              className="w-full h-full pointer-events-none overflow-visible" 
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              {renderConnections()}
            </svg>
          </div>
          
          <div className="relative w-full h-full">
          {/* Suppliers */}
          {data.suppliers.map((s, idx) => {
            const y = ((idx + 0.5) / data.suppliers.length) * 100;
            return (
              <div 
                key={s} 
                className="absolute left-0 w-[20%] pointer-events-auto transform -translate-y-1/2 flex justify-center"
                style={{ top: `${y}%` }}
              >
                <div 
                  className="bg-[#111827] border border-success/40 px-3 py-2 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold shadow-[0_0_15px_rgba(16,185,129,0.1)] w-full text-center relative group backdrop-blur-sm transition-all hover:scale-110 hover:border-success hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
                  onClick={() => setSelectedSupplier(s)}
                >
                  {s}
                  <div className="absolute w-2 h-2 rounded-full bg-success right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
                </div>
              </div>
            );
          })}

          {/* Chokepoints */}
          {data.chokepoints.map((cp: any, idx) => {
            const y = ((idx + 0.5) / data.chokepoints.length) * 100;
            const rawRisk = cp.riskScore?.low !== undefined ? cp.riskScore.low : Number(cp.riskScore || 0);
            const risk = isNaN(rawRisk) ? 0 : rawRisk;
            const colorClass = risk > 70 ? 'border-danger/60 text-danger' : risk > 40 ? 'border-warning/60 text-warning' : 'border-success/60 text-success';
            const bgClass = risk > 70 ? 'bg-danger/10' : risk > 40 ? 'bg-warning/10' : 'bg-success/10';
            const shadowClass = risk > 70 ? 'shadow-[0_0_20px_rgba(239,68,68,0.2)]' : risk > 40 ? 'shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'shadow-[0_0_20px_rgba(16,185,129,0.2)]';
            
            return (
              <div 
                key={cp.chokepoint} 
                className="absolute left-1/2 w-[20%] pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 flex justify-center"
                style={{ top: `${y}%` }}
              >
                <div className={`bg-[#111827] border-2 ${colorClass} ${bgClass} px-3 py-2 sm:px-6 sm:py-4 rounded-xl font-bold ${shadowClass} w-full text-center relative group cursor-pointer transition-all hover:scale-110 backdrop-blur-md`}>
                  <div className="text-white mb-1 text-xs sm:text-base">{cp.chokepoint}</div>
                  <div className="text-[10px] sm:text-xs font-medium uppercase tracking-wider opacity-90">Risk Index: {risk}/100</div>
                  
                  <div className={`absolute w-3 h-3 rounded-full bg-current left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_currentColor]`}></div>
                  <div className={`absolute w-3 h-3 rounded-full bg-current right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_currentColor]`}></div>
                </div>
              </div>
            );
          })}

          {/* Refineries */}
          {data.refineries.map((r: any, idx) => {
            const y = ((idx + 0.5) / data.refineries.length) * 100;
            return (
              <div 
                key={r.refinery} 
                className="absolute right-0 w-[20%] pointer-events-auto transform -translate-y-1/2 flex justify-center"
                style={{ top: `${y}%` }}
              >
                <div className="bg-[#111827] border border-blue-500/40 px-3 py-2 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold shadow-[0_0_15px_rgba(59,130,246,0.1)] w-full text-center relative group backdrop-blur-sm transition-all hover:scale-105 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  {r.refinery}
                  <div className="text-[8px] sm:text-[10px] text-gray-400 mt-1 font-normal uppercase tracking-wider line-clamp-1">Feed: {r.feedPort}</div>
                  <div className="absolute w-2 h-2 rounded-full bg-blue-500 left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(59,130,246,1)]"></div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Path Detail Modal */}
      {selectedSupplier && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" 
          onClick={() => setSelectedSupplier(null)}
        >
          <div 
            className="bg-[#0B0F19] border border-success/40 rounded-xl shadow-2xl max-w-lg w-full mx-4 pointer-events-auto flex flex-col overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-border bg-[#111827]">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="text-success w-5 h-5"/> {selectedSupplier} Supply Routes
              </h4>
              <button 
                onClick={() => setSelectedSupplier(null)} 
                className="text-gray-400 hover:text-white w-8 h-8 rounded-full hover:bg-slate-800/50 flex items-center justify-center transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="flex flex-col gap-3 p-4 max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#0B0F19]">
              {getPathsForSupplier(selectedSupplier).length === 0 && (
                <div className="text-gray-400 text-sm italic">No active downstream routes found.</div>
              )}
              {getPathsForSupplier(selectedSupplier).map((path, idx) => (
                <div key={idx} className="bg-[#111827] rounded-lg p-3 border border-border flex flex-col gap-2 transition-all hover:bg-slate-800/50">
                  <div className="flex items-center gap-2 text-sm text-gray-200">
                    <span className="font-bold text-success">{selectedSupplier}</span>
                    <span className="text-gray-500 text-xs">→</span>
                    <span className={`font-bold ${path.chokepoint.includes('Hormuz') ? 'text-warning' : 'text-blue-400'}`}>{path.chokepoint}</span>
                    <span className="text-gray-500 text-xs">→</span>
                    <span className="font-bold text-blue-500">{path.refinery}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Via {path.port}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${path.isPrimary ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700/50 text-gray-400'}`}>
                      {path.isPrimary ? 'Primary' : 'Alternate'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
