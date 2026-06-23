import { useState, useEffect } from 'react';
import { supabase, getLatestRiskScores } from '../lib/supabase';
import type { RiskScore } from '../types/agents';

export function useRealtimeRiskScores() {
  const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchInitial() {
      try {
        const scores = await getLatestRiskScores();
        if (isMounted) {
          // Group by corridor to only show latest per corridor
          const latestPerCorridor = new Map<string, RiskScore>();
          scores.forEach(s => {
            if (!latestPerCorridor.has(s.corridor)) {
              latestPerCorridor.set(s.corridor, s);
            }
          });
          setRiskScores(Array.from(latestPerCorridor.values()));
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }

    fetchInitial();

    const subscription = supabase
      .channel('risk_scores_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'risk_scores' },
        (payload: any) => {
          const newScore = payload.new as RiskScore;
          setRiskScores((prev) => {
            const updated = prev.filter(s => s.corridor !== newScore.corridor);
            return [newScore, ...updated];
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { riskScores, loading, error };
}
