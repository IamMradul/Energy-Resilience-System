const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/App.tsx',
  'src/components/AlertFeed.tsx',
  'src/components/Header.tsx',
  'src/components/MiniScenarioPanel.tsx',
  'src/components/ProcurementCards.tsx',
  'src/components/RiskGauges.tsx',
  'src/components/SPRTimeline.tsx',
  'src/components/SupplyFlowMetrics.tsx',
  'src/components/ThreatLevelBar.tsx'
];

filesToFix.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    // Unescape template strings
    content = content.replace(/\\\${/g, '${');
    content = content.replace(/\\\`/g, '\`');
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Fixed ' + file);
  }
});
