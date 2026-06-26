
const uri = 'https://a0683606.databases.neo4j.io/db/neo4j/tx/commit';
const user = 'a0683606';
const password = 'IsbQZ7I7tc1O99ZNrysRyF8A-mcUjgdwSWUbaXkZ-Zw';

async function testHttp() {
  const token = Buffer.from(user + ':' + password).toString('base64');
  try {
    const res = await fetch(uri, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        statements: [
          { statement: 'MATCH (c:Chokepoint) RETURN c.name limit 1' }
        ]
      })
    });
    
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}

testHttp();
