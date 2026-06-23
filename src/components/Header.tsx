export default function Header({ isAgentsRunning }: { isAgentsRunning?: boolean }) { 
  return (
    <header className="h-16 border-b border-border bg-card flex items-center px-6 justify-between">
      <div className="font-bold text-xl flex items-center gap-2">
        <span className="text-primary">OORJA</span> 
        <span className="text-gray-400 text-sm font-normal hidden sm:inline">| Energy Supply Chain Resilience</span>
      </div>
      <div className="flex items-center gap-4">
        {isAgentsRunning && (
          <div className="text-sm text-warning animate-pulse flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-warning"></span>
            Agents running...
          </div>
        )}
        <div className="text-sm bg-success/20 text-success px-3 py-1 rounded-full border border-success/30">
          System Nominal
        </div>
        <div className="text-sm text-gray-400 hidden sm:block">
          Response Latency: 42ms
        </div>
      </div>
    </header>
  ); 
}