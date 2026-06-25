import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { AlertFeedItem } from '../types/agents';

export function useRealtimeAlerts() {
  const [alerts, setAlerts] = useState<AlertFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchInitial() {
      const { data, error } = await supabase
        .from('alert_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching initial alerts:', error);
      } else if (isMounted && data) {
        setAlerts(data as AlertFeedItem[]);
      }
      if (isMounted) setLoading(false);
    }

    fetchInitial();

    const channelName = `alert_feed_changes_${Math.random().toString(36).substring(7)}`;
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alert_feed' },
        (payload: any) => {
          const newAlert = payload.new as AlertFeedItem;
          setAlerts((prev) => [newAlert, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(subscription);
    };
  }, []);

  return { alerts, loading };
}
