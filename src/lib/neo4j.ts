export const runQuery = async (cypher: string, params = {}) => {
  try {
    console.log('Sending cypher query via API...', cypher.substring(0, 50));
    
    // We proxy through our Vite backend to bypass browser ALPN/WebSocket issues
    const res = await fetch('/api/neo4j', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cypher, params })
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('Query completed via API, records:', data.records.length);
    
    // Convert plain objects back to something resembling Neo4j Record objects 
    // (with .get() and .toObject() methods) so the rest of the app doesn't break
    return data.records.map((r: any) => {
      return {
        toObject: () => r,
        get: (key: string) => {
          if (r[key] && typeof r[key] === 'object' && 'low' in r[key] && 'high' in r[key]) {
            return { toNumber: () => r[key].low };
          }
          return r[key];
        }
      };
    });
  } catch (error) {
    console.error('Query failed in API runQuery:', error);
    throw error;
  }
}

export default null; // Driver is no longer exported/used in the browser
