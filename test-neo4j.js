import neo4j from 'neo4j-driver';

const uri = 'neo4j+s://a0683606.databases.neo4j.io';
const user = 'a0683606';
const password = 'IsbQZ7I7tc1O99ZNrysRyF8A-mcUjgdwSWUbaXkZ-Zw';

async function testQueries() {
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (c:Chokepoint)
      OPTIONAL MATCH (s:Supplier)-[r:SUPPLIES_THROUGH]->(c)
      RETURN c.name as chokepoint, c.risk_score as riskScore,
             c.daily_flow_mbpd as dailyFlowMbpd,
             count(s) as supplierCount,
             collect(s.name) as suppliers
      ORDER BY c.risk_score DESC
    `);
    const cps = result.records.map(r => r.toObject());
    console.log('Chokepoint ranking:', JSON.stringify(cps, null, 2));
    
    if (cps.length > 0) {
      const topCp = cps[0].chokepoint;
      console.log('Top CP:', topCp);
      const refsResult = await session.run(`
        MATCH (s:Supplier)-[:SUPPLIES_THROUGH]->(c:Chokepoint {name: $cp})
              -[:ROUTES_TO]->(p:Port)-[:FEEDS]->(r:Refinery)
        RETURN r.name as refinery, r.capacity_mbpd as capacity,
               r.operator as operator, p.name as feedPort,
               s.name as primarySupplier
        ORDER BY r.capacity_mbpd DESC
      `, { cp: topCp });
      const refs = refsResult.records.map(r => r.toObject());
      console.log('Refineries at risk:', JSON.stringify(refs, null, 2));
    }
  } catch (error) {
    console.error(error);
  } finally {
    await session.close();
    await driver.close();
  }
}

testQueries();
