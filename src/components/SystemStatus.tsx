import { Database, Server, Cpu, Navigation, RefreshCw } from 'lucide-react';
import { useSystemHealth } from '../hooks/useSystemHealth';

export default function SystemStatus() {
  const health = useSystemHealth();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#06080F] border-t border-border flex items-center justify-between px-4 text-xs font-mono z-[2000]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400">Supabase:</span>
          {health.supabase === 'checking' && <span className="text-warning">CHK</span>}
          {health.supabase === 'ok' && <span className="text-success">OK</span>}
          {health.supabase === 'error' && <span className="text-danger">ERR</span>}
        </div>
        
        <div className="flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400">Neo4j:</span>
          {health.neo4j === 'checking' && <span className="text-warning">CHK</span>}
          {health.neo4j === 'ok' && <span className="text-success">OK</span>}
          {health.neo4j === 'error' && <span className="text-danger">ERR</span>}
        </div>

        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400">Gemini:</span>
          <span className={health.geminiUsage.withinLimits ? 'text-success' : 'text-danger'}>
            {health.geminiUsage.callsThisMinute}/15 req/m | {Math.round(health.geminiUsage.tokensToday / 1000)}k/1M tk/d
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400">Vessels Tracked:</span>
          <span className="text-primary">{health.activeVessels}</span>
        </div>

        <div className="flex items-center gap-2">
          <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${health.lastAgentRun ? '' : 'animate-spin'}`} />
          <span className="text-gray-400">Last run:</span>
          <span className="text-gray-300">
            {health.lastAgentRun ? new Date(health.lastAgentRun).toLocaleTimeString() : 'Pending'}
          </span>
        </div>
      </div>
    </div>
  );
}
