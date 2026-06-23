import { ShieldAlert, Activity, GitCommit, FileWarning } from 'lucide-react';
import Header from './components/Header';
import RiskMap from './components/RiskMap';
import RiskGauges from './components/RiskGauges';
import ScenarioModeler from './components/ScenarioModeler';
import ProcurementCards from './components/ProcurementCards';
import SPRTimeline from './components/SPRTimeline';
import AlertFeed from './components/AlertFeed';

function App() {
  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 p-4 grid grid-cols-12 gap-4 h-[calc(100vh-4rem)]">
        {/* Left Column: Map & Gauges */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-4 h-full">
          <div className="bg-card rounded-lg border border-border flex-1 relative overflow-hidden flex flex-col">
            <div className="p-3 border-b border-border font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Live Risk Heatmap & Corridors
            </div>
            <div className="flex-1">
              <RiskMap />
            </div>
          </div>
          <div className="h-48 bg-card rounded-lg border border-border p-4">
            <RiskGauges />
          </div>
        </div>

        {/* Right Column: Scenarios, SPR, Procurement */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 h-full overflow-y-auto pr-2 custom-scrollbar">
          
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="font-semibold flex items-center gap-2 mb-4">
              <FileWarning className="w-5 h-5 text-warning" />
              Disruption Scenario Modeler
            </div>
            <ScenarioModeler />
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="font-semibold flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-danger" />
              SPR Drawdown Optimization
            </div>
            <SPRTimeline />
          </div>

          <div className="bg-card rounded-lg border border-border p-4 flex-1">
            <div className="font-semibold flex items-center gap-2 mb-4">
              <GitCommit className="w-5 h-5 text-success" />
              Adaptive Procurement Recommendations
            </div>
            <ProcurementCards />
          </div>

        </div>
      </main>

      {/* Floating Alert Feed */}
      <AlertFeed />
    </div>
  );
}

export default App;
