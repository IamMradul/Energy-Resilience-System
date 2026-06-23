import { useRealtimeProcurement } from '../hooks/useRealtimeProcurement';

function timeAgo(dateString?: string) {
  if (!dateString) return '';
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} hr ago`;
}

export default function ProcurementCards() {
  const { recommendations, loading } = useRealtimeProcurement();

  if (loading) {
    return <div className="text-gray-500 italic">Calculating alternative routes...</div>;
  }

  if (recommendations.length === 0) {
    return <div className="text-gray-500 italic">No alternative procurement recommendations currently required.</div>;
  }

  const lastUpdated = recommendations[0]?.created_at;

  return (
    <div className="flex flex-col gap-3">
      {lastUpdated && (
        <div className="text-xs text-gray-500 mb-1 text-right">
          Last updated: {timeAgo(lastUpdated)}
        </div>
      )}
      {recommendations.map((rec) => (
        <Card 
          key={rec.id || rec.rank}
          source={rec.source} 
          eta={`${rec.transit_days} days`} 
          price={`$${rec.spot_price_usd.toFixed(2)}/bbl`} 
          match="High" 
          priority={rec.priority}
        />
      ))}
    </div>
  );
}

function Card({ source, eta, price, match, priority }: any) {
  return (
    <div className="border border-border rounded bg-background p-3 flex justify-between items-center relative overflow-hidden">
      {priority === 'HIGH' && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-success"></div>
      )}
      <div className="pl-2">
        <div className="font-semibold">{source}</div>
        <div className="text-xs text-gray-400">ETA: {eta} | Match: {match}</div>
      </div>
      <div className="font-bold text-primary">{price}</div>
    </div>
  );
}