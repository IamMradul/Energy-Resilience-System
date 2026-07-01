import { useState, useEffect } from 'react';
import { Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { useRealtimeAlerts } from '../hooks/useRealtimeAlerts';

function timeAgo(dateString?: string) {
  if (!dateString) return 'Just now';
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr ago`;
}

function getSourceStyle(source: string) {
  switch (source) {
    case 'NewsAPI': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    case 'Knowledge Graph': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'Gemini': return 'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30';
    case 'DEMO': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'Supabase': return 'bg-success/20 text-success border-success/30';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
}

export default function AlertFeed() {
  const { alerts, loading } = useRealtimeAlerts();
  const [isExpanded, setIsExpanded] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [initialCount, setInitialCount] = useState<number | null>(null);

  useEffect(() => {
    if (initialCount === null && alerts.length > 0) {
      setInitialCount(alerts.length);
    } else if (initialCount !== null && alerts.length > initialCount) {
      setUnreadCount(alerts.length - initialCount);
    }
  }, [alerts, initialCount]);

  const handleToggle = () => {
    if (!isExpanded) {
      setUnreadCount(0);
      setInitialCount(alerts.length);
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed bottom-14 right-4 bg-[#0d1526] border border-white/10 shadow-lg shadow-black/50 rounded-lg w-80 z-50 flex flex-col transition-all duration-300">
      <style>{`
        @keyframes pulseDot {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-pulse-dot {
          animation: pulseDot 1s infinite;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideInRight 300ms ease-out backwards;
        }
        @keyframes flashBg {
          0% { background-color: rgba(59,130,246,0.2); }
          100% { background-color: transparent; }
        }
        .animate-flash-bg {
          animation: flashBg 1s ease-out forwards;
        }
      `}</style>

      <div 
        className="flex items-center justify-between font-bold p-3 cursor-pointer hover:bg-white/5 rounded-t-lg transition-colors border-b border-white/5"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2 text-sm">
          <Bell className="w-4 h-4 text-warning" /> 
          <span>AlertFeed</span>
          {unreadCount > 0 && !isExpanded && (
            <span className="bg-[#3b82f6] text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
              {unreadCount}
            </span>
          )}
        </div>
        <div>
          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="relative">
          <div className="flex flex-col gap-0 text-xs max-h-80 overflow-y-auto custom-scrollbar">
            {loading && <div className="text-gray-500 italic p-4 text-center">Connecting to live feed...</div>}
            {!loading && alerts.length === 0 && <div className="text-gray-500 italic p-4 text-center">No recent alerts.</div>}
            
            {alerts.map((alert, idx) => {
              let title = alert.title;
              if (title.includes('refineries at risk')) {
                const parts = title.split(': ');
                if (parts.length > 1) {
                  const unique = [...new Set(parts[1].split(', '))];
                  title = `${unique.length} refineries at risk via ${parts[0].split('via ')[1]}: ${unique.join(', ')}`;
                }
              }

              // Assume newest items are at the top, animate only the first 3 on mount
              const delay = idx < 3 ? `${idx * 100}ms` : '0ms';
              
              return (
                <div 
                  key={alert.id} 
                  className="p-3 border-b border-white/5 flex gap-2 animate-slide-in animate-flash-bg group"
                  style={{ animationDelay: `${delay}, 0ms` }}
                >
                  <div className="mt-1 flex-shrink-0">
                    {alert.severity === 'CRITICAL' ? <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse-dot"></div> :
                     alert.severity === 'HIGH' ? <div className="w-2 h-2 rounded-full bg-orange-500"></div> :
                     alert.severity === 'MEDIUM' ? <div className="w-2 h-2 rounded-full bg-amber-500"></div> :
                     <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getSourceStyle(alert.source || 'NewsAPI')}`}>
                        {alert.source || 'NewsAPI'}
                      </span>
                      <span className="text-[9px] text-slate-500 whitespace-nowrap cursor-default" title={new Date(alert.created_at || '').toLocaleString()}>
                        {timeAgo(alert.created_at)}
                      </span>
                    </div>
                    <div className="text-slate-200 leading-tight">
                      {title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0d1526] to-transparent pointer-events-none rounded-b-lg"></div>
        </div>
      )}
    </div>
  );
}