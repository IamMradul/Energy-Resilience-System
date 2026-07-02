import { useEffect, useState } from 'react';
import { ShieldAlert, Activity, GitCommit, FileWarning } from 'lucide-react';
import Header from './components/Header';
import RiskMap from './components/RiskMap';
import RiskGauges from './components/RiskGauges';
import ScenarioModeler from './components/ScenarioModeler';
import ProcurementCards from './components/ProcurementCards';
import SPRTimeline from './components/SPRTimeline';
import AlertFeed from './components/AlertFeed';
import SupplyChainGraph from './components/SupplyChainGraph';
import SystemStatus from './components/SystemStatus';
import MiniScenarioPanel from './components/MiniScenarioPanel';
import ThreatLevelBar from './components/ThreatLevelBar';
import SupplyFlowMetrics from './components/SupplyFlowMetrics';
import ResponseMetrics from './components/ResponseMetrics';
import { runAllAgents } from './lib/agents';
import { runQuery } from './lib/neo4j';
import { seedKnowledgeGraph } from './lib/knowledge-graph/seedGraph';

function App() {
  const [isAgentsRunning, setIsAgentsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Supply Chain Graph' | 'Vessel Tracking' | 'Scenarios'>('Dashboard');

  useEffect(() => {
    let isMounted = true;

    async function initializeSystem() {
      if (!isMounted) return;
      
      // Seed Neo4j if empty
      try {
        const count = await runQuery('MATCH (n) RETURN count(n) as count');
        if (count && count.length > 0 && count[0].get('count').toNumber() === 0) {
          console.log('Seeding Knowledge Graph...');
          await seedKnowledgeGraph();
        }
      } catch (e) {
        console.warn('Neo4j connection failed during init, skipping seed.');
      }
      
      executeAgents();
    }

    async function executeAgents() {
      if (!isMounted) return;
      setIsAgentsRunning(true);
      try {
        await runAllAgents();
      } catch (error) {
        console.error('Agent execution error:', error);
      } finally {
        if (isMounted) setIsAgentsRunning(false);
      }
    }

    initializeSystem();

    // Run every 5 minutes
    const interval = setInterval(executeAgents, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="h-screen bg-[#0a0f1e] text-gray-100 flex flex-col font-sans overflow-hidden">
      <div className="sticky top-0 z-50">
        <Header isAgentsRunning={isAgentsRunning} />
      </div>

      {/* Tabs */}
      <div className="sticky top-[64px] z-40 px-6 py-2 border-b border-border bg-[#0d1526]/50 flex gap-6 shadow-sm">
        {['Dashboard', 'Supply Chain Graph', 'Vessel Tracking', 'Scenarios'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-2 text-sm font-semibold transition-colors ${activeTab === tab ? 'text-[#3b82f6] border-b-2 border-[#3b82f6]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <main className="flex-1 flex flex-col min-h-0 pb-10">
        
        {activeTab === 'Dashboard' && (
          <div className="flex-1 min-h-0 grid grid-cols-[minmax(0,1fr)_350px_320px] gap-4 p-4">
            {/* Left Column: Map & Gauges */}
            <div className="flex flex-col gap-4 h-full overflow-y-auto overflow-x-hidden pb-4 pr-2">
              <div className="bg-[#0d1526]/80 backdrop-blur-md rounded-xl border border-border shadow-lg min-h-[400px] flex-1 shrink-0 relative overflow-hidden flex flex-col">
                <div className="p-3 border-b border-border text-[0.7rem] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2 bg-black/20">
                  <Activity className="w-4 h-4 text-[#3b82f6]" />
                  Live Risk Heatmap & Corridors
                </div>
                <div className="flex-1 relative">
                  <RiskMap />
                </div>
              </div>
              <div className="flex-none grid grid-cols-2 gap-4">
                <div className="bg-[#0d1526]/80 backdrop-blur-md rounded-xl border border-border shadow-lg overflow-hidden">
                  <MiniScenarioPanel />
                </div>
                <div className="bg-[#0d1526]/80 backdrop-blur-md rounded-xl border border-border shadow-lg overflow-hidden">
                  <SupplyFlowMetrics />
                </div>
              </div>
              <div className="flex-none bg-[#0d1526]/80 backdrop-blur-md rounded-xl border border-border shadow-lg overflow-hidden">
                <RiskGauges />
              </div>
            </div>

            {/* Center Column: Procurement Cards */}
            <div className="flex flex-col gap-4 h-full overflow-y-auto overflow-x-hidden pb-4 pr-2">
              <div className="flex-1 bg-[#0d1526]/80 backdrop-blur-md rounded-xl border border-border shadow-lg flex flex-col min-h-[500px] overflow-hidden">
                <div className="p-3 border-b border-border text-[0.7rem] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2 bg-black/20">
                  <GitCommit className="w-4 h-4 text-slate-400" />
                  Adaptive Procurement
                </div>
                <div className="flex-1 overflow-y-auto p-4 pt-2">
                  <ProcurementCards />
                </div>
              </div>
            </div>

            {/* Right Column: SPR + alerts + response */}
            <div className="flex flex-col gap-4 h-full overflow-y-auto overflow-x-hidden pb-4 pr-2">
              <div className="flex-none bg-[#0d1526]/80 backdrop-blur-md rounded-xl border border-border shadow-lg overflow-hidden">
                <SPRTimeline />
              </div>
              <div className="flex-none bg-[#0d1526]/80 backdrop-blur-md rounded-xl border border-border shadow-lg overflow-hidden">
                <ThreatLevelBar />
              </div>
              <div className="flex-none h-[180px] bg-[#0d1526]/80 backdrop-blur-md rounded-xl border border-border shadow-lg overflow-hidden">
                <ResponseMetrics />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Supply Chain Graph' && (
          <div className="flex-1 min-h-0 flex flex-col p-4">
            <SupplyChainGraph />
          </div>
        )}

        {activeTab === 'Vessel Tracking' && (
          <div className="flex-1 bg-card rounded-lg border border-border relative overflow-hidden flex flex-col min-h-0 m-4">
            <div className="p-3 border-b border-border font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              AIS Vessel Tracking Map
            </div>
            <div className="flex-1 relative min-h-0">
              <RiskMap />
            </div>
          </div>
        )}

        {activeTab === 'Scenarios' && (
          <div className="flex-1 min-h-0 w-full h-full p-4 grid grid-cols-[1fr_340px] gap-4 overflow-hidden">
            <div className="bg-[#0d1526]/80 backdrop-blur-md rounded-xl border border-border shadow-lg p-6 overflow-y-auto custom-scrollbar h-full flex flex-col">
              <div className="font-semibold flex items-center gap-2 mb-4 text-slate-200 shrink-0">
                <FileWarning className="w-5 h-5 text-warning" />
                Disruption Scenario Modeler
              </div>
              <div className="flex-1">
                <ScenarioModeler />
              </div>
            </div>
            
            <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar h-full pr-2">
              <div className="flex-none bg-[#0d1526]/80 backdrop-blur-md rounded-xl border border-border shadow-lg overflow-hidden">
                <RiskGauges />
              </div>
              <div className="flex-none bg-[#0d1526]/80 backdrop-blur-md rounded-xl border border-border shadow-lg overflow-hidden">
                <SPRTimeline />
              </div>
              <div className="flex-none bg-[#0d1526]/80 backdrop-blur-md rounded-xl border border-border shadow-lg overflow-hidden flex flex-col min-h-[300px]">
                <div className="p-3 border-b border-border text-[0.7rem] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2 bg-black/20 shrink-0">
                  <GitCommit className="w-4 h-4 text-slate-400" />
                  Top Procurement Recs
                </div>
                <div className="flex-1 overflow-y-auto p-3 pt-2">
                  <ProcurementCards />
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Floating Alert Feed */}
      <AlertFeed />
      
      {/* Fixed System Status */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <SystemStatus />
      </div>
    </div>
  );
}

export default App;
