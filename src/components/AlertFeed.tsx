import { useState } from 'react';
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

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'CRITICAL': return 'text-danger';
    case 'HIGH': return 'text-warning';
    case 'MEDIUM': return 'text-yellow-400';
    case 'LOW': return 'text-success';
    default: return 'text-gray-300';
  }
}

export default function AlertFeed() {
  const { alerts, loading } = useRealtimeAlerts();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="fixed bottom-14 right-4 bg-card border border-border shadow-lg rounded-lg w-80 z-50 transition-all duration-300">
      <div 
        className="flex items-center justify-between font-bold p-3 cursor-pointer hover:bg-white/5 rounded-t-lg transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-warning" /> Live Intel Feed
        </div>
        <div>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="flex flex-col gap-3 text-xs max-h-64 overflow-y-auto custom-scrollbar p-4 pt-2 border-t border-border">
          {loading && <div className="text-gray-500 italic">Connecting to live feed...</div>}
          {!loading && alerts.length === 0 && <div className="text-gray-500 italic">No recent alerts.</div>}
          {alerts.map((alert) => {
            let title = alert.title;
            if (title.includes('refineries at risk')) {
              const parts = title.split(': ');
              if (parts.length > 1) {
                const unique = [...new Set(parts[1].split(', '))];
                title = `${unique.length} refineries at risk via ${parts[0].split('via ')[1]}: ${unique.join(', ')}`;
              }
            }
            return (
              <div key={alert.id} className="text-gray-300">
                <span className={`${getSeverityColor(alert.severity)} font-bold mr-1`}>
                  [{timeAgo(alert.created_at)}]
                </span>
                {title}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}