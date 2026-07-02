import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { exportBriefing } from '../lib/exportPDF';

export default function Header({ isAgentsRunning }: { isAgentsRunning?: boolean }) { 
  const [time, setTime] = useState(new Date());
  const [injecting, setInjecting] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const formatDate = (date: Date) => {
    const optsDate: Intl.DateTimeFormatOptions = { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' };
    const datePart = date.toLocaleDateString('en-US', optsDate);
    const timePart = date.toLocaleTimeString('en-US', { hour12: false });
    return `${datePart}  ${timePart} IST`; // Mocking IST as requested
  };

  const simulateCrisis = async () => {
    if (injecting) return;
    setInjecting(true);
    
    try {
      // Inject critical alert
      await supabase.from('alert_feed').insert([{
        title: 'MANUAL OVERRIDE: Simulated escalation in Strait of Hormuz',
        severity: 'CRITICAL',
        source: 'DEMO',
        corridor: 'Strait of Hormuz'
      }]);

      // Inject high risk score
      await supabase.from('risk_scores').insert([{
        corridor: 'Strait of Hormuz',
        risk_score: 95,
        confidence: 0.99,
        signal_sources: ['DEMO'],
        reasoning: 'Manual crisis override injected by user.',
        recommendation: 'Immediate procurement diversion required. Activate SPR drawdown protocol.',
        source: 'DEMO'
      } as any]);
    } catch (err) {
      console.error('Injection failed', err);
    }

    setTimeout(() => {
      setInjecting(false);
    }, 10000); // 10s cooldown
  };

  return (
    <header className="h-16 border-b border-border bg-[#0a0f1e] flex items-center px-6 justify-between shadow-md">
      <div className="flex items-baseline gap-3">
        <span className="text-[#3b82f6] font-bold text-[1.4rem] tracking-wider">OORJA</span> 
        <span className="text-slate-400 text-[0.75rem] uppercase tracking-widest hidden sm:inline border-l border-border pl-3">
          Energy Supply Chain Intelligence
        </span>
      </div>
      
      <div className="text-slate-300 font-mono text-sm hidden md:block">
        {formatDate(time)}
      </div>

      <div className="flex items-center gap-4">
        {isAgentsRunning && (
          <div className="text-[0.75rem] text-warning animate-pulse flex items-center gap-2 uppercase tracking-wider font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
            Agents running
          </div>
        )}
        
        <div className="flex items-center gap-1.5 text-[0.75rem] font-bold text-success uppercase tracking-widest bg-success/10 px-3 py-1.5 rounded border border-success/20">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
          System Live
        </div>

        <button 
          onClick={() => exportBriefing().catch(console.error)}
          className="text-white text-[13px] font-bold px-3 py-1.5 rounded-md transition-colors bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600 hover:border-blue-500 flex items-center gap-1.5"
        >
          📄 Export Briefing
        </button>

        <button 
          onClick={simulateCrisis}
          disabled={injecting}
          className={`text-white text-sm font-bold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            injecting ? 'bg-red-800 cursor-not-allowed opacity-70' : 'bg-red-600 hover:bg-red-500'
          }`}
        >
          {injecting ? 'Injecting...' : '🚨 Simulate Crisis'}
        </button>
      </div>
    </header>
  ); 
}