export interface RiskScore {
  id?: string
  corridor: string
  risk_score: number
  confidence: number
  signal_sources: string[]
  reasoning: string
  recommendation: string
  created_at?: string
}

export interface ProcurementRec {
  id?: string
  rank: number
  source: string
  route: string
  spot_price_usd: number
  transit_days: number
  grade_compatible_refineries: string[]
  tanker_availability: 'HIGH' | 'MEDIUM' | 'LOW'
  port_congestion: 'LOW' | 'MEDIUM' | 'HIGH'
  priority: 'HIGH' | 'MED' | 'LOW'
  created_at?: string
}

export interface ScenarioResult {
  id?: string
  event_type: string
  assumptions: string[]
  impacts: {
    refinery_run_rate_drop_pct: number
    domestic_fuel_price_increase_pct: number
    power_sector_stress_index: number
    gdp_trajectory_30d_pct: number
    estimated_cost_billion_usd: number
    days_to_supply_crunch: number
  }
  confidence_interval: string
  mitigation_options: string[]
  created_at?: string
}

export interface SPRPlan {
  id?: string
  current_cover_days: number
  recommended_drawdown_mbpd: number
  projected_cover_days: number
  replenishment_window_days: number
  priority_refineries: string[]
  drawdown_schedule: Array<{
    day: number
    release_mbpd: number
    cumulative_released: number
  }>
  risk_if_no_action: string
  estimated_days_to_exhaustion: number
  created_at?: string
}

export interface AlertFeedItem {
  id?: string
  title: string
  source: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  corridor: string
  created_at?: string
}
