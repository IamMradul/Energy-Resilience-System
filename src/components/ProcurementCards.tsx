import { useRealtimeProcurement } from '../hooks/useRealtimeProcurement';
import type { ProcurementRec } from '../types/agents';
import { MapPin, Clock, Ship, Factory, Anchor } from 'lucide-react';

function timeAgo(dateString?: string) {
  if (!dateString) return '';
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} hr ago`;
}

export default function ProcurementCards() {
  const { recommendations, loading } = useRealtimeProcurement();

  if (loading) {
    return <div className="text-gray-500 italic">Calculating alternative routes...</div>;
  }

  const deduped = recommendations.reduce((acc, rec) => {
    const key = rec.source;
    if (!key) return acc;
    if (!acc[key] || (acc[key].rank ?? 99) > (rec.rank ?? 99)) {
      acc[key] = rec;
    }
    return acc;
  }, {} as Record<string, ProcurementRec>);

  const displayRecs = Object.values(deduped)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .slice(0, 5)
    .map((rec, index) => ({ ...rec, rank: index + 1 }));

  if (displayRecs.length === 0) {
    return <div className="text-gray-500 italic">No alternative procurement recommendations currently required.</div>;
  }

  const lastUpdated = displayRecs[0]?.created_at;

  return (
    <div className="flex flex-col gap-3">
      {lastUpdated && (
        <div className="text-xs text-gray-500 mb-1 text-right">
          Last updated: {timeAgo(lastUpdated)}
        </div>
      )}
      {displayRecs.map((rec, idx) => (
        <Card key={rec.id || `${rec.source}-${rec.route}`} rec={rec} index={idx} />
      ))}
    </div>
  );
}

function Card({ rec, index }: { rec: ProcurementRec; index: number }) {
  const { rank, source, route, spot_price_usd, transit_days, tanker_availability, port_congestion, grade_compatible_refineries } = rec;

  const displayPriority = rank === 1 ? 'CRITICAL' : rank === 2 ? 'HIGH' : 'MEDIUM';

  const prioBadgeColor = rank === 1 ? 'bg-rose-500/20 text-rose-500' : rank === 2 ? 'bg-orange-500/20 text-orange-500' : 'bg-amber-500/20 text-amber-500';
  const prioPillColor = rank === 1 ? 'bg-rose-500/10 text-rose-500' : rank === 2 ? 'bg-orange-500/10 text-orange-500' : 'bg-amber-500/10 text-amber-500';
  const borderColor = rank === 1 ? 'border-l-rose-500' : rank === 2 ? 'border-l-orange-500' : 'border-l-amber-500';
  const tankerColor = tanker_availability === 'HIGH' ? 'text-success' : tanker_availability === 'MEDIUM' ? 'text-warning' : 'text-danger';
  const refineriesLength = grade_compatible_refineries ? grade_compatible_refineries.length : 0;
  const matchPct = refineriesLength >= 4 ? 95 : refineriesLength === 3 ? 85 : refineriesLength === 2 ? 65 : refineriesLength === 1 ? 40 : 0;

  return (
    <div 
      className={`border border-border rounded-lg bg-[#0d1526] hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)] transition-all duration-300 ${borderColor} border-l-[3px] min-w-[200px]`}
      style={{
        animation: `slideUpFade 400ms ease-out ${index * 80}ms backwards`
      }}
    >
      <style>{`
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      {/* Header */}
      <div className="px-2.5 py-2 border-b border-border flex flex-col gap-1.5">
        <div className="flex items-center gap-2 min-w-0 w-full">
          <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[0.6rem] font-bold ${prioBadgeColor}`}>
            #{rank}
          </div>
          <span className={`flex-shrink-0 text-[0.65rem] font-bold px-2 py-0.5 rounded-sm ${prioPillColor}`}>
            {displayPriority} PRIORITY
          </span>
          <span className="text-slate-200 font-medium text-[0.8rem] whitespace-nowrap overflow-hidden text-ellipsis min-w-0 flex-1">
            {source}
          </span>
        </div>
        <div className="text-right text-slate-300 font-bold text-base leading-none">
          ${spot_price_usd?.toFixed(2)}/bbl
        </div>
      </div>

      {/* Body */}
      <div className="px-2.5 py-2 text-slate-300 text-[0.85rem] flex flex-col gap-2">
        <div className="text-slate-400 text-[0.75rem] flex items-center gap-1.5">
          <MapPin className="w-3 h-3" /> {route}
        </div>
        <div className="flex items-center gap-4 text-[0.75rem]">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3 h-3" /> ETA: {transit_days}d
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Ship className="w-3 h-3" /> Tankers: <span className={`font-medium ${tankerColor}`}>{tanker_availability}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5 mt-1 border-t border-border pt-2">
          <div className="flex items-center gap-2 text-xs">
            <Factory className="w-3 h-3 text-slate-500" />
            {grade_compatible_refineries?.map(ref => (
              <span key={ref} className="bg-slate-800/50 text-slate-300 px-1.5 py-0.5 rounded border border-border">{ref}</span>
            ))}
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400 mt-1.5">
            <div className="flex items-center gap-1.5">
              <Anchor className="w-3 h-3" />
              <span>Congestion: <span className={`font-medium ${port_congestion === 'LOW' ? 'text-emerald-500' : port_congestion === 'MEDIUM' ? 'text-amber-500' : 'text-rose-500'}`}>{port_congestion}</span></span>
            </div>
          </div>
          <div style={{ marginTop: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '8px', color: '#64748b' }}>
                Grade match
              </span>
              <span style={{ fontSize: '8px', color: '#3b82f6' }}>
                {matchPct}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800/50 overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-700 ease-out" style={{ width: `${matchPct}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}