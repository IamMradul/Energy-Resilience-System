import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { runQuery } from '../lib/neo4j'
import { getUsageStats } from '../lib/rateLimiter'
import { SIMULATED_VESSELS } from '../data/vesselSimulation'
import type { SystemHealth } from '../types/agents'

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth>({
    supabase: 'checking',
    neo4j: 'checking',
    geminiUsage: getUsageStats(),
    lastAgentRun: null,
    nextAgentRun: null,
    activeVessels: SIMULATED_VESSELS.length
  })

  useEffect(() => {
    // Check Supabase
    const checkSupabase = async () => {
      try {
        const { error } = await supabase.from('risk_scores').select('*', { count: 'exact', head: true }).limit(1)
        if (error) throw error
        setHealth(h => ({...h, supabase: 'ok'}))
      } catch (e) {
        setHealth(h => ({...h, supabase: 'error'}))
      }
    }
    checkSupabase()

    // Check Neo4j
    const checkNeo4j = async () => {
      try {
        await runQuery('RETURN 1')
        setHealth(h => ({...h, neo4j: 'ok'}))
      } catch (e) {
        setHealth(h => ({...h, neo4j: 'error'}))
      }
    }
    checkNeo4j()

    // Update Gemini stats every 30s
    const statsInterval = setInterval(() => {
      setHealth(h => ({...h, geminiUsage: getUsageStats()}))
    }, 30_000)

    // Optional: add a global window event listener to track last/next agent run
    const updateRunTimes = (e: any) => {
      setHealth(h => ({
        ...h, 
        lastAgentRun: e.detail?.lastRun || h.lastAgentRun,
        nextAgentRun: e.detail?.nextRun || h.nextAgentRun
      }))
    }
    window.addEventListener('agent-run-update', updateRunTimes)

    return () => {
      clearInterval(statsInterval)
      window.removeEventListener('agent-run-update', updateRunTimes)
    }
  }, [])

  return health
}
