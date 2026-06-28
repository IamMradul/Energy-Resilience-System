import { seedKnowledgeGraph } from '../../src/lib/knowledge-graph/seedGraph';

console.log('Seeding database...');
seedKnowledgeGraph().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(console.error);
