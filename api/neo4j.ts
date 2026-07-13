import neo4j from 'neo4j-driver';

let driver: any = null;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!driver) {
      const uri = process.env.VITE_NEO4J_URI || 'neo4j+s://a0683606.databases.neo4j.io';
      const user = process.env.VITE_NEO4J_USER || 'a0683606';
      const password = process.env.VITE_NEO4J_PASSWORD || 'IsbQZ7I7tc1O99ZNrysRyF8A-mcUjgdwSWUbaXkZ-Zw';
      
      driver = neo4j.driver(
        uri.replace('bolt+s', 'neo4j+s'),
        neo4j.auth.basic(user, password)
      );
    }

    const { cypher, params } = req.body;
    if (!cypher) {
      return res.status(400).json({ error: 'Missing cypher query' });
    }

    const session = driver.session();
    
    try {
      const result = await session.run(cypher, params || {});
      const records = result.records.map((r: any) => r.toObject());
      return res.status(200).json({ records });
    } finally {
      await session.close();
    }
  } catch (err: any) {
    console.error('Neo4j API error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
