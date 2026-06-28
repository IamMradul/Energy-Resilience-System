import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import neo4j from 'neo4j-driver'

// https://vite.dev/config/
export default defineConfig({

  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks(id) {
          if (id.includes('neo4j-driver')) {
            return 'neo4j';
          }
        }
      }
    }
  },
  server: {
    proxy: {}, // just to be explicit
  },
  plugins: [
    react(),
    {
      name: 'neo4j-proxy',
      configureServer(server) {
        // We initialize the node neo4j driver here in the backend
        const env = loadEnv('', process.cwd(), '');
        
        let driver = null;
        try {
          const uri = env.VITE_NEO4J_URI || 'neo4j+s://a0683606.databases.neo4j.io';
          const user = env.VITE_NEO4J_USER || 'a0683606';
          const password = env.VITE_NEO4J_PASSWORD || 'IsbQZ7I7tc1O99ZNrysRyF8A-mcUjgdwSWUbaXkZ-Zw';
          
          // Force neo4j+s for node.js environment since it works perfectly there
          driver = neo4j.driver(
            uri.replace('bolt+s', 'neo4j+s'),
            neo4j.auth.basic(user, password)
          );
        } catch (e) {
          console.error("Vite proxy failed to init neo4j:", e);
        }

        server.middlewares.use('/api/neo4j', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end();
            return;
          }
          
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { cypher, params } = JSON.parse(body);
              if (!driver) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Database driver not initialized' }));
                return;
              }
              const session = driver.session();
              try {
                const result = await session.run(cypher, params || {});
                // Convert records to standard objects to send via JSON
                const records = result.records.map(r => r.toObject());
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ records }));
              } finally {
                await session.close();
              }
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
            }
          });
        });
      }
    }
  ],
})
