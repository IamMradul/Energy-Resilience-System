import { useEffect, useState } from 'react';
import { useRealtimeRiskScores } from '../hooks/useRealtimeRiskScores';

export default function RiskGauges() {
  const { riskScores, loading } = useRealtimeRiskScores();

  // Define default corridors to always show them even if DB is empty initially
  const defaultCorridors = ['Strait of Hormuz', 'Red Sea/Bab-el-Mandeb', 'Strait of Malacca', 'Cape of Good Hope'];

  return (
    <div className="flex h-full gap-4 items-center justify-around">
      {loading ? (
        <div className="text-gray-500 italic animate-pulse">Loading live risk data...</div>
      ) : (
        defaultCorridors.map(title => {
          const scoreObj = riskScores.find(s => s.corridor === title);
          const score = scoreObj ? scoreObj.risk_score : 0;
          return <Gauge key={title} title={title.split('/')[0]} score={score} />;
        })
      )}
    </div>
  );
}

function Gauge({ title, score }: { title: string, score: number }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (score > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [score]);

  const color = score > 70 ? 'text-danger' : score > 40 ? 'text-warning' : score > 0 ? 'text-success' : 'text-gray-500';
  
  return (
    <div className={`flex flex-col items-center transition-transform duration-300 ${pulse ? 'scale-110' : 'scale-100'}`}>
      <div className={`text-4xl font-bold ${color}`}>
        {score === 0 ? '--' : score}
      </div>
      <div className="text-sm text-gray-400 mt-2 text-center max-w-[100px] leading-tight">
        {title}
      </div>
    </div>
  );
}