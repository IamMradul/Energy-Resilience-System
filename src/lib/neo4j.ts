import neo4j from 'neo4j-driver'

const uri = import.meta.env.VITE_NEO4J_URI || ''
const user = import.meta.env.VITE_NEO4J_USER || ''
const password = import.meta.env.VITE_NEO4J_PASSWORD || ''

let driver: any = null

if (uri && !uri.includes('placeholder')) {
  try {
    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(user, password)
    )
  } catch (error) {
    console.error('Failed to initialize Neo4j driver:', error)
  }
} else {
  console.log('Neo4j skipped: placeholders or empty URI detected.')
}

export const runQuery = async (cypher: string, params = {}) => {
  if (!driver) {
    throw new Error('Neo4j driver not initialized')
  }
  const session = driver.session()
  try {
    const result = await session.run(cypher, params)
    return result.records
  } finally {
    await session.close()
  }
}

export default driver
