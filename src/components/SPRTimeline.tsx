import { useEffect, useState } from 'react';
import { useRealtimeRiskScores } from '../hooks/useRealtimeRiskScores';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export default function SPRTimeline() {
  const { riskScores } = useRealtimeRiskScores();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const INDIA_DAILY_IMPORT = 4.5;
  const hormuzRecord = riskScores.find(r => r.corridor === 'Strait of Hormuz');
  const redSeaRecord = riskScores.find(r => r.corridor === 'Red Sea/Bab-el-Mandeb');
  const flowAtRisk = ((hormuzRecord?.risk_score || 0) / 100 * 2.03) + ((redSeaRecord?.risk_score || 0) / 100 * 0.90);
  const supplyGap = Math.max(0, flowAtRisk - 1.80);
  
  const sprDailyCover = 9.5 * 5.1;
  const supplyGapDays = supplyGap > 0 ? Math.round(sprDailyCover / supplyGap) : 47;
  const exhaustionDay = Math.round(9.5 + supplyGapDays);

  return (
    <div className="bg-[#0d1526] border border-white/10 rounded-lg p-4 text-xs">
      <div className="text-[0.7rem] font-semibold tracking-widest uppercase text-slate-500 mb-4 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-slate-400" /> SPR Drawdown Optimization
      </div>

      <div className="mb-4">
        <div className="text-slate-400 mb-1 flex justify-between">
          <span>Current Cover</span>
          <span className="text-warning font-bold">9.5 days (CRITICAL)</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-warning transition-all duration-[600ms] ease-out"
            style={{ width: mounted ? '25%' : '0%' }}
          ></div>
        </div>
      </div>

      <div className="border-y border-white/5 py-3 mb-3">
        <div className="text-slate-500 mb-2">Optimal Drawdown Schedule</div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-16">Day 1-5</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#3b82f6] transition-all duration-[600ms] ease-out"
                style={{ width: mounted ? '40%' : '0%' }}
              ></div>
            </div>
            <span className="w-16 text-right">200k bpd</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-16">Day 6-10</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#3b82f6] transition-all duration-[600ms] ease-out"
                style={{ width: mounted ? '90%' : '0%' }}
              ></div>
            </div>
            <span className="w-16 text-right">450k bpd</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-slate-500 mb-2">Reserve Locations</div>
        <div className="flex flex-col gap-1.5">
          <LocationRow name="Vizag" mmt={1.33} maxMmt={2.5} mounted={mounted} />
          <LocationRow name="Mangalore" mmt={1.50} maxMmt={2.5} mounted={mounted} />
          <LocationRow name="Padur" mmt={2.50} maxMmt={2.5} mounted={mounted} />
        </div>
      </div>

      <div className="flex flex-col gap-1 text-[0.7rem] pt-2 border-t border-white/5">
        <div className="text-warning flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" /> Exhaustion risk at Day {exhaustionDay}
        </div>
        <div className="text-slate-400">
          Replenishment window opens: 21d
        </div>
      </div>
    </div>
  );
}

function LocationRow({ name, mmt, maxMmt, mounted }: { name: string, mmt: number, maxMmt: number, mounted: boolean }) {
  const pct = (mmt / maxMmt) * 100;
  return (
    <div className="flex items-center gap-2 text-slate-300 text-[10px]">
      <span className="w-16">{name}</span>
      <span className="w-12 text-slate-400">{mmt.toFixed(2)} MMT</span>
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-success transition-all duration-[600ms] ease-out"
          style={{ width: mounted ? `${pct}%` : '0%' }}
        ></div>
      </div>
    </div>
  );
}