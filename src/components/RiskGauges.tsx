import { useEffect, useState, useRef } from 'react';
import { useRealtimeRiskScores } from '../hooks/useRealtimeRiskScores';
import { supabase } from '../lib/supabase';
import { LineChart, Line } from 'recharts';

export default function RiskGauges() {
  const { riskScores, loading } = useRealtimeRiskScores();

  const defaultCorridors = ['Strait of Hormuz', 'Red Sea/Bab-el-Mandeb', 'Strait of Malacca', 'Cape of Good Hope'];

  return (
    <div className="bg-[#0d1526] border border-border rounded-lg p-4 flex flex-col gap-3 h-full">
      <div className="text-[0.7rem] font-semibold tracking-widest uppercase text-slate-500 mb-1 flex items-center gap-2">
        <span className="text-slate-400">⚡</span> Corridor Risk Index
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center text-slate-500 italic py-4 animate-pulse">Loading live risk data...</div>
      ) : (
        <div className="grid grid-cols-2 gap-2 h-full">
          {defaultCorridors.map(corridorName => {
            const scoreObj = riskScores.find(s => s.corridor === corridorName);
            const score = scoreObj ? scoreObj.risk_score : (corridorName === 'Strait of Hormuz' ? 50 : corridorName === 'Red Sea/Bab-el-Mandeb' ? 40 : 0);
            return <RiskGaugeCard key={corridorName} title={corridorName.split('/')[0]} corridor={corridorName} score={score} />;
          })}
        </div>
      )}
    </div>
  );
}

function RiskGaugeCard({ title, corridor, score }: { title: string, corridor: string, score: number }) {
  const prevScoreRef = useRef(score);
  const [delta, setDelta] = useState(0);
  const [sparkData, setSparkData] = useState<any[]>([]);

  useEffect(() => {
    if (score !== prevScoreRef.current) {
      setDelta(score - prevScoreRef.current);
      prevScoreRef.current = score;
    }
  }, [score]);

  useEffect(() => {
    async function fetchSparkline() {
      const { data } = await supabase
        .from('risk_scores')
        .select('risk_score, created_at')
        .eq('corridor', corridor)
        .order('created_at', { ascending: false })
        .limit(10);
      setSparkData((data ?? []).reverse());
    }
    fetchSparkline();
  }, [corridor, score]);

  let level = 'NORMAL';
  let severityColor = '#10b981'; // green

  if (score >= 75) {
    level = 'CRITICAL';
    severityColor = '#ef4444'; // red
  } else if (score >= 55) {
    level = 'HIGH';
    severityColor = '#f59e0b'; // amber
  } else if (score >= 40) {
    level = 'ELEVATED';
    severityColor = '#eab308'; // yellow
  }

  // 40% opacity = 66, 4% opacity = 0A, 20% opacity = 33 (for pills)
  return (
    <div 
      className="flex flex-col items-center p-2 rounded-lg border relative overflow-hidden transition-colors"
      style={{ borderColor: severityColor + '66', backgroundColor: severityColor + '0A' }}
    >
      <div className="text-[9px] font-bold tracking-widest uppercase text-slate-500 mb-2 truncate w-full text-center">
        {title}
      </div>
      
      <div className="relative flex justify-center items-center">
        <svg width="100" height="58" viewBox="0 0 100 58">
          {/* Background track */}
          <path 
            d="M10 52 A40 40 0 0 1 90 52" 
            fill="none" 
            stroke="rgba(255,255,255,0.08)" 
            strokeWidth="6" 
            strokeLinecap="round"
          />
          {/* Colored fill - dasharray=125.66 is full arc length */}
          <path 
            d="M10 52 A40 40 0 0 1 90 52" 
            fill="none" 
            stroke={severityColor} 
            strokeWidth="6" 
            strokeLinecap="round"
            strokeDasharray={125.66}
            strokeDashoffset={125.66 - (score / 100 * 125.66)}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
          <text x="50" y="46" textAnchor="middle" fill={severityColor} className="font-bold text-xl">
            {score}
          </text>
        </svg>
      </div>

      <div className="mt-2 flex flex-col items-center w-full gap-1">
        <div 
          className="text-[9px] font-bold px-2 py-0.5 rounded-full" 
          style={{ color: severityColor, backgroundColor: severityColor + '33' }}
        >
          {level}
        </div>
        <div className="w-full h-[3px] rounded-full overflow-hidden bg-slate-800/50 mt-1">
          <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${score}%`, backgroundColor: severityColor }}></div>
        </div>
        <div className="text-[8px] font-medium mt-0.5">
          {delta === 0 ? (
            <span className="text-slate-400">— stable</span>
          ) : delta > 0 ? (
            <span className="text-rose-500">↑ +{delta} from last reading</span>
          ) : (
            <span className="text-emerald-500">↓ {delta} from last reading</span>
          )}
        </div>
        <div className="mt-1 flex justify-center w-full">
          <LineChart width={100} height={24} data={sparkData}>
            <Line 
              type="monotone" 
              dataKey="risk_score" 
              stroke={severityColor}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </div>
      </div>
    </div>
  );
}