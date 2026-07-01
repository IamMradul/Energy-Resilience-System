import { useRealtimeRiskScores } from '../hooks/useRealtimeRiskScores';
import { useRealtimeAlerts } from '../hooks/useRealtimeAlerts';
import { ShieldAlert } from 'lucide-react';

export default function ThreatLevelBar() {
  const { riskScores } = useRealtimeRiskScores();
  const { alerts } = useRealtimeAlerts();

  // Weighted average computation
  const weights: Record<string, number> = {
    'Strait of Hormuz': 0.45,
    'Red Sea/Bab-el-Mandeb': 0.25,
    'Strait of Malacca': 0.15,
    'Cape of Good Hope': 0.15,
  };

  let totalScore = 0;
  let totalWeight = 0;
  
  Object.keys(weights).forEach(corridor => {
    const match = riskScores.find(r => r.corridor === corridor);
    const score = match ? match.risk_score : 0;
    totalScore += score * weights[corridor];
    totalWeight += weights[corridor];
  });
  
  const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

  let levelText = 'NORMAL';
  let levelColor = 'text-success bg-success';
  let isCritical = false;

  if (overallScore >= 80) {
    levelText = 'CRITICAL';
    levelColor = 'text-danger bg-danger';
    isCritical = true;
  } else if (overallScore >= 60) {
    levelText = 'HIGH';
    levelColor = 'text-warning bg-warning'; // using warning for orange
  } else if (overallScore >= 40) {
    levelText = 'ELEVATED';
    levelColor = 'text-yellow-500 bg-yellow-500'; // amber
  }

  const activeThreats = alerts
    .filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH')
    .slice(0, 3);

  const highestRiskRecord = [...riskScores].sort((a, b) => b.risk_score - a.risk_score)[0];
  const recommendation = highestRiskRecord?.recommendation || 'Maintain normal operations.';

  return (
    <div className={`bg-[#0d1526] border border-white/10 rounded-lg p-4 flex flex-col ${isCritical ? 'animate-pulse-border' : ''}`}>
      <style>{`
        @keyframes pulseBorder {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          100% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
        .animate-pulse-border {
          animation: pulseBorder 2s infinite;
          border-color: rgba(239,68,68,0.5);
        }
      `}</style>
      
      <div className="text-[0.7rem] font-semibold tracking-widest uppercase text-slate-500 mb-3 flex items-center gap-2">
        <ShieldAlert className={`w-4 h-4 ${isCritical ? 'text-danger' : 'text-slate-400'}`} /> System Threat Level
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-end mb-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${levelColor.split(' ')[1]}`}></span>
            <span className={`font-bold text-sm ${levelColor.split(' ')[0]}`}>{levelText}</span>
          </div>
          <span className="font-bold text-white text-lg">{overallScore}/100</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full ${levelColor.split(' ')[1]} transition-all duration-1000 ease-out`}
            style={{ width: `${overallScore}%` }}
          ></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 text-xs text-slate-300">
        <div>
          <div className="text-slate-500 mb-1">Active threats:</div>
          {activeThreats.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {activeThreats.map(t => (
                <li key={t.id} className="flex items-start gap-1.5">
                  <span className={t.severity === 'CRITICAL' ? 'text-danger' : 'text-warning'}>●</span>
                  <span className="line-clamp-1">{t.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="italic text-slate-500">None at this time.</div>
          )}
        </div>

        <div>
          <div className="text-slate-500 mb-1">Recommended action:</div>
          <div className="italic text-white border-l-2 border-white/20 pl-2">
            "{recommendation}"
          </div>
        </div>
      </div>
    </div>
  );
}
