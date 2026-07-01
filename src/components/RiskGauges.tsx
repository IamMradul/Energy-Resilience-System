import { useEffect, useState, useRef } from 'react';
import { useRealtimeRiskScores } from '../hooks/useRealtimeRiskScores';

export default function RiskGauges() {
  const { riskScores, loading } = useRealtimeRiskScores();

  const defaultCorridors = ['Strait of Hormuz', 'Red Sea/Bab-el-Mandeb', 'Strait of Malacca', 'Cape of Good Hope'];

  return (
    <div className="bg-[#0d1526] border border-white/10 rounded-lg p-4 flex flex-col gap-3">
      <div className="text-[0.7rem] font-semibold tracking-widest uppercase text-slate-500 mb-1 flex items-center gap-2">
        <span className="text-slate-400">⚡</span> Corridor Risk Index
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center text-slate-500 italic py-4 animate-pulse">Loading live risk data...</div>
      ) : (
        <div className="flex flex-col gap-2">
          {defaultCorridors.map(title => {
            const scoreObj = riskScores.find(s => s.corridor === title);
            const score = scoreObj ? scoreObj.risk_score : 0;
            return <RiskRow key={title} title={title.split('/')[0]} score={score} />;
          })}
        </div>
      )}
    </div>
  );
}

function RiskRow({ title, score }: { title: string, score: number }) {
  const prevScoreRef = useRef(score);
  const [delta, setDelta] = useState(0);

  useEffect(() => {
    if (score !== prevScoreRef.current) {
      setDelta(score - prevScoreRef.current);
      prevScoreRef.current = score;
    }
  }, [score]);

  let level = 'NORMAL';
  let color = 'text-emerald-500'; 
  let bgColor = 'bg-emerald-500/10';

  if (score > 70) {
    level = 'CRITICAL';
    color = 'text-rose-500';
    bgColor = 'bg-rose-500/10';
  } else if (score > 50) {
    level = 'HIGH';
    color = 'text-orange-500'; 
    bgColor = 'bg-orange-500/10';
  } else if (score > 30) {
    level = 'ELEVATED';
    color = 'text-amber-500'; 
    bgColor = 'bg-amber-500/10';
  }

  return (
    <div className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
      <div className="flex flex-col gap-1 w-1/3">
        <span className="text-[0.8rem] font-medium text-slate-200">{title}</span>
        <div className="text-[0.65rem] font-medium text-slate-500">
          {delta === 0 ? (
            <span>— stable</span>
          ) : delta > 0 ? (
            <span className="text-rose-500">↑ +{delta} from last reading</span>
          ) : (
            <span className="text-emerald-500">↓ {delta} from last reading</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded ${color} ${bgColor}`}>
          {level}
        </span>
        <span className={`text-xl font-bold w-8 text-right ${color}`}>
          {score}
        </span>
      </div>
    </div>
  );
}