import { useEffect, useState } from 'react';
import { useRealtimeRiskScores } from '../hooks/useRealtimeRiskScores';
import { BarChart3, AlertTriangle } from 'lucide-react';
import type { RiskScore } from '../types/agents';

function AnimatedNumber({ value, formatFn }: { value: number, formatFn: (n: number) => string }) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1200;
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // ease-out
      const current = start + (end - start) * (1 - Math.pow(1 - progress, 3));
      
      if (frame >= totalFrames) {
        setDisplayVal(end);
        clearInterval(timer);
      } else {
        setDisplayVal(current);
      }
    }, frameRate);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{formatFn(displayVal)}</span>;
}

export default function SupplyFlowMetrics() {
  const { riskScores } = useRealtimeRiskScores();

  const INDIA_DAILY_IMPORT = 4.5;

  if (riskScores.length === 0) {
    return (
      <div className="bg-[#0d1526] border border-border rounded-lg p-4 h-full flex flex-col justify-between">
        <div className="text-[0.7rem] font-semibold tracking-widest uppercase text-slate-500 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-400" /> Supply Flow Metrics
        </div>
        <div className="flex flex-col gap-3 animate-pulse mt-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-slate-800/50 rounded" />
          ))}
        </div>
      </div>
    );
  }
  
  const corridorMap = riskScores.reduce((acc, s) => {
    if (!acc[s.corridor] || 
        new Date(s.created_at!) > new Date(acc[s.corridor].created_at!)) {
      acc[s.corridor] = s;
    }
    return acc;
  }, {} as Record<string, RiskScore>);

  // Use fallback of 50/40 if no data yet (though the length === 0 check avoids empty, it handles missing corridors)
  const hormuzScore = corridorMap['Strait of Hormuz']?.risk_score ?? 50;
  const redSeaScore = corridorMap['Red Sea/Bab-el-Mandeb']?.risk_score ?? 40;

  const flowAtRisk = (hormuzScore / 100 * 2.03) + (redSeaScore / 100 * 0.90);
  const altCapacity = 1.80;
  const supplyGap = Math.max(0, flowAtRisk - altCapacity);
  
  const SPR_TOTAL_MMT = 5.33;
  const MMT_TO_MILLION_BARRELS = 7.5;
  const SPR_TOTAL_MB = SPR_TOTAL_MMT * MMT_TO_MILLION_BARRELS;
  const sprCoversGapDays = supplyGap > 0 ? Math.round(SPR_TOTAL_MB / supplyGap) : 999;
  
  const refineryUtil = Math.max(60, 100 - (flowAtRisk / INDIA_DAILY_IMPORT * 35));

  const flowColor = flowAtRisk > 1.5 ? 'text-danger' : flowAtRisk > 0.8 ? 'text-warning' : 'text-success';
  const gapColor = supplyGap > 0 ? 'text-danger' : 'text-success';
  const sprColor = sprCoversGapDays < 15 ? 'text-danger' : sprCoversGapDays < 30 ? 'text-warning' : 'text-success';
  const utilColor = refineryUtil > 85 ? 'text-success' : refineryUtil > 70 ? 'text-warning' : 'text-danger';

  // Progress bar percentages
  const flowPct = Math.min(100, (flowAtRisk / INDIA_DAILY_IMPORT) * 100);
  const altPct = Math.min(100, (altCapacity / INDIA_DAILY_IMPORT) * 100);
  const sprPct = Math.min(100, (Math.min(sprCoversGapDays, 90) / 90) * 100);

  return (
    <div className="bg-[#0d1526] border border-border rounded-lg p-4 h-full flex flex-col justify-between">
      <div className="text-[0.7rem] font-semibold tracking-widest uppercase text-slate-500 mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-slate-400" /> Supply Flow Metrics
      </div>

      <div className="flex flex-col text-xs border-b border-border pb-2 mb-2 gap-1.5">
        <div className="flex justify-between text-slate-300">
          <span>Daily import target</span>
          <span className="font-bold text-white">4.5M bpd</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Flow at risk</span>
          <div className="flex items-center gap-1">
            <span className={flowColor}>▶</span>
            <span className={`font-bold ${flowColor}`}>
              <AnimatedNumber value={flowAtRisk} formatFn={n => n.toFixed(1)} />M bpd
            </span>
          </div>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Alt. route capacity</span>
          <div className="flex items-center gap-1">
            <span className="font-bold text-success">
              1.8M bpd
            </span>
          </div>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Supply gap</span>
          <div className="flex items-center gap-1">
            {supplyGap > 0 && <span className={gapColor}>▶</span>}
            <span className={`font-bold ${gapColor}`}>
              <AnimatedNumber value={supplyGap} formatFn={n => n.toFixed(1)} />M bpd
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col text-xs border-b border-border pb-2 mb-2 gap-1.5">
        <div className="flex justify-between text-slate-300">
          <span>SPR covers gap</span>
          <span className={`font-bold ${sprColor}`}>
            {sprCoversGapDays === 999 ? 'Sufficient — no gap' : <><AnimatedNumber value={sprCoversGapDays} formatFn={n => Math.round(n).toString()} /> days</>}
          </span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Refinery utilization</span>
          <span className={`font-bold ${utilColor}`}>
            <AnimatedNumber value={refineryUtil} formatFn={n => Math.round(n).toString()} />%
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <BarRow label="Flow at risk" percent={flowPct} colorClass="bg-danger" />
        <BarRow label="Alt capacity" percent={altPct} colorClass="bg-success" />
        <BarRow label="SPR buffer" percent={sprPct} colorClass="bg-warning" />
      </div>
    </div>
  );
}

function BarRow({ label, percent, colorClass }: { label: string, percent: number, colorClass: string }) {
  return (
    <div className="flex items-center text-[10px] text-slate-400 gap-2">
      <div className="w-20 truncate">{label}</div>
      <div className="flex-1 h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-1000 ease-out`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
