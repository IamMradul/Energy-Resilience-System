import { useState, useEffect } from 'react';
import { getLatestProcurementRecs, supabase } from '../lib/supabase';
import type { ProcurementRec } from '../types/agents';

export function useRealtimeProcurement() {
  const [recommendations, setRecommendations] = useState<ProcurementRec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchInitial() {
      const recs = await getLatestProcurementRecs();
      if (isMounted) {
        setRecommendations(recs.sort((a, b) => a.rank - b.rank));
        setLoading(false);
      }
    }

    fetchInitial();

    const channelName = `procurement_recs_changes_${Math.random().toString(36).substring(7)}`;
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'procurement_recs' },
        () => {
          // Instead of appending single inserts, we fetch the latest batch
          // because procurement recs usually come in groups of 3
          fetchInitial();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(subscription);
    };
  }, []);

  return { recommendations, loading };
}
