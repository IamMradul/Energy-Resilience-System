import { runQuery } from '../neo4j'

export const seedKnowledgeGraph = async (): Promise<void> => {
  try {
    // 1. Create supplier nation nodes
    await runQuery(`
      CREATE (:Supplier {name: 'Saudi Arabia', region: 'Gulf', daily_export_mbpd: 6.2, reliability_score: 88})
      CREATE (:Supplier {name: 'Iraq', region: 'Gulf', daily_export_mbpd: 4.1, reliability_score: 72})
      CREATE (:Supplier {name: 'UAE', region: 'Gulf', daily_export_mbpd: 2.9, reliability_score: 85})
      CREATE (:Supplier {name: 'Russia', region: 'Eastern', daily_export_mbpd: 1.8, reliability_score: 65})
      CREATE (:Supplier {name: 'Nigeria', region: 'West Africa', daily_export_mbpd: 1.1, reliability_score: 70})
      CREATE (:Supplier {name: 'Kuwait', region: 'Gulf', daily_export_mbpd: 2.1, reliability_score: 82})
      CREATE (:Supplier {name: 'Angola', region: 'West Africa', daily_export_mbpd: 0.6, reliability_score: 68})
    `)

    // 2. Create chokepoint nodes
    await runQuery(`
      CREATE (:Chokepoint {name: 'Strait of Hormuz', daily_flow_mbpd: 21, risk_score: 78, lat: 26.5667, lng: 56.2667})
      CREATE (:Chokepoint {name: 'Red Sea/Bab-el-Mandeb', daily_flow_mbpd: 8.8, risk_score: 82, lat: 12.5833, lng: 43.3333})
      CREATE (:Chokepoint {name: 'Suez Canal', daily_flow_mbpd: 5.5, risk_score: 45, lat: 30.4270, lng: 32.3497})
      CREATE (:Chokepoint {name: 'Strait of Malacca', daily_flow_mbpd: 16, risk_score: 35, lat: 2.5, lng: 101.0})
      CREATE (:Chokepoint {name: 'Cape of Good Hope', daily_flow_mbpd: 3.2, risk_score: 12, lat: -34.3568, lng: 18.4734})
    `)

    // 3. Create Indian port nodes
    await runQuery(`
      CREATE (:Port {name: 'Kandla/Sikka', state: 'Gujarat', capacity_mbpd: 1.4, lat: 23.0333, lng: 70.2167})
      CREATE (:Port {name: 'JNPT Mumbai', state: 'Maharashtra', capacity_mbpd: 0.9, lat: 18.9500, lng: 72.9333})
      CREATE (:Port {name: 'Kochi Port', state: 'Kerala', capacity_mbpd: 0.5, lat: 9.9667, lng: 76.2667})
      CREATE (:Port {name: 'Paradip Port', state: 'Odisha', capacity_mbpd: 0.6, lat: 20.3167, lng: 86.6167})
      CREATE (:Port {name: 'New Mangalore Port', state: 'Karnataka', capacity_mbpd: 0.4, lat: 12.9167, lng: 74.8167})

    `)

    // 4. Create refinery nodes
    await runQuery(`
      CREATE (:Refinery {name: 'Reliance Jamnagar', operator: 'Reliance', capacity_mbpd: 1.24, lat: 22.4707, lng: 70.0577})
      CREATE (:Refinery {name: 'HPCL Mumbai', operator: 'HPCL', capacity_mbpd: 0.30, lat: 19.0330, lng: 72.8697})
      CREATE (:Refinery {name: 'BPCL Kochi', operator: 'BPCL', capacity_mbpd: 0.31, lat: 9.9312, lng: 76.2673})
      CREATE (:Refinery {name: 'IOC Paradip', operator: 'IOC', capacity_mbpd: 0.30, lat: 20.2604, lng: 86.6679})
      CREATE (:Refinery {name: 'MRPL Mangalore', operator: 'MRPL', capacity_mbpd: 0.27, lat: 12.8990, lng: 74.8456})

    `)

    // 5. Create route relationships (Supplier SUPPLIES_THROUGH Chokepoint)
    await runQuery(`
      MATCH (s:Supplier {name: 'Saudi Arabia'}), (c:Chokepoint {name: 'Strait of Hormuz'})
      CREATE (s)-[:SUPPLIES_THROUGH {volume_pct: 85, transit_days: 18}]->(c)
    `)
    await runQuery(`
      MATCH (s:Supplier {name: 'Iraq'}), (c:Chokepoint {name: 'Strait of Hormuz'})
      CREATE (s)-[:SUPPLIES_THROUGH {volume_pct: 90, transit_days: 20}]->(c)
    `)
    await runQuery(`
      MATCH (s:Supplier {name: 'UAE'}), (c:Chokepoint {name: 'Strait of Hormuz'})
      CREATE (s)-[:SUPPLIES_THROUGH {volume_pct: 80, transit_days: 17}]->(c)
    `)
    await runQuery(`
      MATCH (s:Supplier {name: 'Russia'}), (c:Chokepoint {name: 'Cape of Good Hope'})
      CREATE (s)-[:SUPPLIES_THROUGH {volume_pct: 60, transit_days: 22}]->(c)
    `)
    await runQuery(`
      MATCH (s:Supplier {name: 'Nigeria'}), (c:Chokepoint {name: 'Cape of Good Hope'})
      CREATE (s)-[:SUPPLIES_THROUGH {volume_pct: 100, transit_days: 24}]->(c)
    `)
    await runQuery(`
      MATCH (s:Supplier {name: 'Kuwait'}), (c:Chokepoint {name: 'Strait of Hormuz'})
      CREATE (s)-[:SUPPLIES_THROUGH {volume_pct: 100, transit_days: 16}]->(c)
    `)

    await runQuery(`
      MATCH (s:Supplier {name: 'Angola'}), (c:Chokepoint {name: 'Cape of Good Hope'})
      CREATE (s)-[:SUPPLIES_THROUGH {volume_pct: 100, transit_days: 26}]->(c)
    `)

    // 6. Chokepoint ROUTES_TO Port
    await runQuery(`
      MATCH (c:Chokepoint {name: 'Strait of Hormuz'}), (p:Port {name: 'Kandla/Sikka'})
      CREATE (c)-[:ROUTES_TO {primary: true, distance_nm: 1420}]->(p)
    `)
    await runQuery(`
      MATCH (c:Chokepoint {name: 'Strait of Hormuz'}), (p:Port {name: 'JNPT Mumbai'})
      CREATE (c)-[:ROUTES_TO {primary: true, distance_nm: 1680}]->(p)
    `)
    await runQuery(`
      MATCH (c:Chokepoint {name: 'Strait of Hormuz'}), (p:Port {name: 'Paradip Port'})
      CREATE (c)-[:ROUTES_TO {primary: true, distance_nm: 1950}]->(p)
    `)
    await runQuery(`
      MATCH (c:Chokepoint {name: 'Strait of Hormuz'}), (p:Port {name: 'New Mangalore Port'})
      CREATE (c)-[:ROUTES_TO {primary: true, distance_nm: 1550}]->(p)
    `)
    await runQuery(`
      MATCH (c:Chokepoint {name: 'Cape of Good Hope'}), (p:Port {name: 'Paradip Port'})
      CREATE (c)-[:ROUTES_TO {primary: false, distance_nm: 7200}]->(p)
    `)
    await runQuery(`
      MATCH (c:Chokepoint {name: 'Cape of Good Hope'}), (p:Port {name: 'New Mangalore Port'})
      CREATE (c)-[:ROUTES_TO {primary: false, distance_nm: 6800}]->(p)
    `)

    await runQuery(`
      MATCH (c:Chokepoint {name: 'Strait of Hormuz'}), (p:Port {name: 'Kochi Port'})
      CREATE (c)-[:ROUTES_TO {primary: true, distance_nm: 1720}]->(p)
    `)

    // 7. Port FEEDS Refinery
    await runQuery(`
      MATCH (p:Port {name: 'Kandla/Sikka'}), (r:Refinery {name: 'Reliance Jamnagar'})
      CREATE (p)-[:FEEDS {pipeline_km: 90, mode: 'pipeline'}]->(r)
    `)
    await runQuery(`
      MATCH (p:Port {name: 'JNPT Mumbai'}), (r:Refinery {name: 'HPCL Mumbai'})
      CREATE (p)-[:FEEDS {pipeline_km: 15, mode: 'pipeline'}]->(r)
    `)
    await runQuery(`
      MATCH (p:Port {name: 'Kochi Port'}), (r:Refinery {name: 'BPCL Kochi'})
      CREATE (p)-[:FEEDS {pipeline_km: 8, mode: 'pipeline'}]->(r)
    `)
    await runQuery(`
      MATCH (p:Port {name: 'Paradip Port'}), (r:Refinery {name: 'IOC Paradip'})
      CREATE (p)-[:FEEDS {pipeline_km: 5, mode: 'pipeline'}]->(r)
    `)
    await runQuery(`
      MATCH (p:Port {name: 'New Mangalore Port'}), (r:Refinery {name: 'MRPL Mangalore'})
      CREATE (p)-[:FEEDS {pipeline_km: 12, mode: 'pipeline'}]->(r)
    `)


    // 8. Add SANCTIONS_RISK relationships
    await runQuery(`
      MATCH (s:Supplier {name: 'Russia'})
      CREATE (s)-[:HAS_RISK {type: 'sanctions', severity: 'HIGH', description: 'Western sanctions on Russian oil exports'}]->
        (:RiskFactor {name: 'Western Sanctions'})
    `)
    await runQuery(`
      MATCH (s:Supplier {name: 'Iraq'})
      CREATE (s)-[:HAS_RISK {type: 'political', severity: 'MEDIUM', description: 'Political instability risk'}]->
        (:RiskFactor {name: 'Political Instability'})
    `)

    console.log('Knowledge graph seeded successfully.')
  } catch (error) {
    console.error('Failed to seed knowledge graph:', error)
  }
}
