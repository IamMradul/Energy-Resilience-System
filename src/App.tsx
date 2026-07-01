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
    <div className="min-h-screen bg-[#0a0f1e] text-gray-100 flex flex-col font-sans pb-10">
      <Header isAgentsRunning={isAgentsRunning} />

      {/* Tabs */}
      <div className="px-6 py-2 border-b border-white/10 bg-[#0d1526]/50 flex gap-6 shadow-sm">
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

      <main className="flex-1 flex flex-col p-4 h-[calc(100vh-8rem)]">
        
        {activeTab === 'Dashboard' && (
          <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
            {/* Left Column: Map & Gauges */}
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-3 h-full">
              <div className="bg-[#0d1526] rounded-lg border border-white/10 h-[500px] shrink-0 relative overflow-hidden flex flex-col">
                <div className="p-3 border-b border-white/10 text-[0.7rem] font-semibold tracking-widest uppercase text-slate-500 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#3b82f6]" />
                  Live Risk Heatmap & Corridors
                </div>
                <div className="flex-1 relative">
                  <RiskMap />
                </div>
              </div>
              <div className="flex-none grid grid-cols-2 gap-3">
                <SPRTimeline />
                <ThreatLevelBar />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
                <MiniScenarioPanel />
                <SupplyFlowMetrics />
              </div>
            </div>

            {/* Right Column: Gauges, Procurement, Metrics */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-3 h-full overflow-hidden">
              <div className="flex-none">
                <RiskGauges />
              </div>

              <div className="flex-1 min-h-0 bg-[#0d1526] border border-white/10 rounded-lg p-4 flex flex-col">
                <div className="text-[0.7rem] font-semibold tracking-widest uppercase text-slate-500 mb-3 flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-slate-400" />
                  Adaptive Procurement
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <ProcurementCards />
                </div>
              </div>

              <div className="flex-none h-[180px]">
                <ResponseMetrics />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Supply Chain Graph' && (
          <div className="flex-1 min-h-0 h-full flex flex-col">
            <SupplyChainGraph />
          </div>
        )}

        {activeTab === 'Vessel Tracking' && (
          <div className="flex-1 bg-card rounded-lg border border-border relative overflow-hidden flex flex-col min-h-0">
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
          <div className="flex-1 min-h-0 w-full max-w-4xl mx-auto flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="font-semibold flex items-center gap-2 mb-4">
                <FileWarning className="w-5 h-5 text-warning" />
                Disruption Scenario Modeler
              </div>
              <ScenarioModeler />
            </div>
          </div>
        )}

      </main>

      {/* Floating Alert Feed */}
      <AlertFeed />
      
      {/* Fixed System Status */}
      <SystemStatus />
    </div>
  );
}

export default App;
