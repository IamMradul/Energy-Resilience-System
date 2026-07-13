export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const newsApiKey = process.env.VITE_NEWS_API_KEY || '';
    const url = `https://newsapi.org/v2/everything?q=oil+tanker+hormuz+opec+sanctions+red+sea&sortBy=publishedAt&pageSize=5&apiKey=${newsApiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: `NewsAPI error: ${response.status}` });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('News API proxy error:', error);
    return res.status(500).json({ error: error.message || String(error) });
  }
}
