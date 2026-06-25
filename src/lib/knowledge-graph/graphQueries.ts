import { runQuery } from '../neo4j'

// Find all safe alternative routes when a chokepoint is blocked
export async function findAlternativeRoutes(blockedChokepoint: string) {
  try {
    const records = await runQuery(`
      MATCH (s:Supplier)-[:SUPPLIES_THROUGH]->(c:Chokepoint)-[:ROUTES_TO]->(p:Port)-[:FEEDS]->(r:Refinery)
      WHERE c.name <> $blocked
      RETURN s.name as supplier, c.name as chokepoint, 
             p.name as port, r.name as refinery,
             c.risk_score as corridorRisk
      ORDER BY corridorRisk ASC
      LIMIT 10
    `, { blocked: blockedChokepoint })
    
    return records.map((r: any) => r.toObject())
  } catch (e) {
    return []
  }
}

// Get full exposure of a supplier to risk
export async function getSupplierRiskExposure(supplierName: string) {
  try {
    const records = await runQuery(`
      MATCH (s:Supplier {name: $name})-[:SUPPLIES_THROUGH]->(c:Chokepoint)
      OPTIONAL MATCH (s)-[:HAS_RISK]->(rf:RiskFactor)
      RETURN s.name as supplier, s.reliability_score as reliability,
             collect(c.name) as chokepoints,
             collect(c.risk_score) as riskScores,
             collect(rf.name) as riskFactors
    `, { name: supplierName })
    
    return records[0]?.toObject() ?? null
  } catch (e) {
    return null
  }
}

// Get all refineries at risk if a chokepoint is blocked
export async function getRefineriasAtRisk(chokepoint: string) {
  try {
    const records = await runQuery(`
      MATCH (s:Supplier)-[:SUPPLIES_THROUGH]->(c:Chokepoint {name: $cp})
            -[:ROUTES_TO]->(p:Port)-[:FEEDS]->(r:Refinery)
      RETURN r.name as refinery, r.capacity_mbpd as capacity,
             r.operator as operator, p.name as feedPort,
             s.name as primarySupplier
      ORDER BY r.capacity_mbpd DESC
    `, { cp: chokepoint })
    
    return records.map((r: any) => r.toObject())
  } catch (e) {
    return []
  }
}

// Get complete supply chain path from supplier to refinery
export async function getSupplyChainPath(
  supplier: string, 
  refinery: string
) {
  try {
    const records = await runQuery(`
      MATCH path = (s:Supplier {name: $supplier})
        -[:SUPPLIES_THROUGH]->(c:Chokepoint)
        -[:ROUTES_TO]->(p:Port)
        -[:FEEDS]->(r:Refinery {name: $refinery})
      RETURN 
        s.name as supplier,
        c.name as chokepoint,
        c.risk_score as chokepointRisk,
        p.name as port,
        r.name as refinery,
        length(path) as pathLength
    `, { supplier, refinery })
    
    return records.map((r: any) => r.toObject())
  } catch (e) {
    return []
  }
}

// Identify highest risk chokepoints right now
export async function getChokepointRiskRanking() {
  try {
    const records = await runQuery(`
      MATCH (c:Chokepoint)
      OPTIONAL MATCH (s:Supplier)-[r:SUPPLIES_THROUGH]->(c)
      RETURN c.name as chokepoint, c.risk_score as riskScore,
             c.daily_flow_mbpd as dailyFlowMbpd,
             count(s) as supplierCount,
             collect(s.name) as suppliers
      ORDER BY c.risk_score DESC
    `)
    
    return records.map((r: any) => r.toObject())
  } catch (e) {
    return []
  }
}
