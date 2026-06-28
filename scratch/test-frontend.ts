async function test() {
  console.log('Fetching topology...');
  const res = await fetch('http://localhost:5173/api/neo4j', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cypher: 'MATCH (s:Supplier)-[:SUPPLIES_THROUGH]->(c:Chokepoint) OPTIONAL MATCH (c)-[:ROUTES_TO]->(p:Port)-[:FEEDS]->(r:Refinery) RETURN s.name as supplier, c.name as chokepoint, c.risk_score as riskScore, r.name as refinery, p.name as feedPort' })
  });
  const data = await res.json();
  const topology = data.records;
  
  const sToC = new Set<string>();
  topology.forEach((r: any) => {
    if (r.supplier && r.chokepoint) {
      sToC.add(`${r.supplier}|${r.chokepoint}`);
    }
  });

  console.log('sToC:', Array.from(sToC));
}

test().catch(console.error);
