# ⚡ AI-Driven Energy Supply Chain Resilience System

> Turning reactive crisis response into anticipatory, managed resilience for India's crude oil supply chain.

![System Status](https://img.shields.io/badge/status-prototype-orange)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TypeScript-blue)
![AI](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-green)
![DB](https://img.shields.io/badge/backend-Supabase-3ECF8E)
![License](https://img.shields.io/badge/license-MIT-purple)

---

## 🌍 The Problem

India imports **88% of its crude oil**. Of that, **40–45% transits the Strait of Hormuz** — one of the most geopolitically volatile chokepoints on the planet.

| Metric | Reality |
|--------|---------|
| Strategic Petroleum Reserve cover | **~9.5 days** of national consumption |
| Brent crude spike during 2025 US-Iran standoff | **+8% in a single session** |
| Average extra stabilisation time without AI rerouting | **+47 days** (McKinsey) |
| Indian refineries dependent on Gulf crude | Reliance, HPCL, BPCL, MRPL, IOC |

Traditional supply chain tools were built for predictable environments. They cannot model geopolitical shocks in real time, evaluate alternative procurement corridors dynamically, or orchestrate coordinated response across refiners, logistics, and reserves.

**This system builds that intelligence layer.**

---

## 🎯 What This System Does

```
Geopolitical signal detected
        ↓  (< 2 hours)
Risk scored per corridor
        ↓
Scenarios modelled with cascading economic impact
        ↓
Alternative procurement routes ranked and surfaced
        ↓
SPR drawdown schedule optimised
        ↓
Policymakers and procurement teams act — not react
```

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph INGEST["📡 Data Ingestion Layer"]
        A1[NewsAPI\nGeopolitical signals]
        A2[MarineTraffic\nAIS vessel data]
        A3[Alpha Vantage\nCommodity prices]
        A4[OFAC / UN\nSanctions registries]
        A5[Internal ERP\nRefinery demand]
        A6[MoPNG\nSPR stock levels]
    end

    subgraph MEMORY["🧠 Knowledge & Memory Layer"]
        B1[Supabase pgvector\nRAG over intel docs]
        B2[Neo4j\nSupplier → Route → Risk → Refinery graph]
        B3[Scenario Store\nMonte Carlo + historical shocks]
    end

    subgraph ORCH["🔀 Orchestration Layer"]
        C1[Multi-Agent Orchestrator\nLangGraph + CrewAI]
    end

    subgraph AGENTS["🤖 AI Agent Layer — Gemini 1.5 Flash"]
        D1[🌐 Geopolitical\nRisk Agent]
        D2[📊 Scenario\nModeller]
        D3[🛢️ Procurement\nOrchestrator]
        D4[🏭 SPR\nOptimiser]
        D5[🗺️ Digital Twin\nGeospatial Sim]
    end

    subgraph BACKEND["🗄️ Backend — Supabase"]
        E1[PostgreSQL\nAll structured data]
        E2[Realtime\nWebSocket alerts]
        E3[Edge Functions\nAPI handlers]
        E4[Auth\nUser management]
    end

    subgraph FRONTEND["💻 Frontend — React + Vite + TypeScript"]
        F1[Live Risk Heatmap\nLeaflet + AIS overlays]
        F2[Scenario Dashboard\nWaterfall charts]
        F3[Procurement Cards\nRanked recommendations]
        F4[SPR Timeline\nDrawdown visualiser]
        F5[Alert Feed\nReal-time ticker]
        F6[Response Tracker\nSignal → rec. latency]
    end

    subgraph OUTPUT["📋 Decision Outputs"]
        G1[Policymakers\nSPR / emergency decisions]
        G2[Procurement Teams\nSpot market orders]
        G3[Refinery Operators\nGrade substitution plans]
    end

    INGEST --> MEMORY
    MEMORY --> ORCH
    ORCH --> AGENTS
    AGENTS --> BACKEND
    BACKEND --> FRONTEND
    FRONTEND --> OUTPUT
```

---

## 🤖 The Five AI Agents

### 1. 🌐 Geopolitical Risk Intelligence Agent
Monitors news feeds, sanctions registries, and AIS vessel data to produce a **live disruption probability score (0–100)** per shipping corridor — updated continuously, not weekly.

**Corridors monitored:**
- Strait of Hormuz (Iran–Oman)
- Red Sea / Bab-el-Mandeb (Houthi threat zone)
- Suez Canal (Egypt)
- Cape of Good Hope (alternate route)
- Strait of Malacca (Asia Pacific)

**Output schema:**
```json
{
  "agent": "geopolitical_risk",
  "timestamp": "2026-06-23T10:45:00Z",
  "corridor": "Strait of Hormuz",
  "risk_score": 78,
  "confidence": 0.85,
  "signal_sources": ["Reuters", "MarineTraffic AIS", "OFAC registry"],
  "reasoning": "Three tankers diverted in last 6 hours. New IRGC vessel movements detected.",
  "recommendation": "Activate alternate procurement from West Africa and US Gulf Coast",
  "data_freshness_seconds": 180
}
```

---

### 2. 📊 Disruption Scenario Modeller
Simulates specific disruption events and computes **cascading economic impacts** with explicit, testable assumptions.

**Scenarios supported:**
| Event | Modelled Impact |
|-------|----------------|
| Hormuz partial closure (40%) | Refinery run rate, domestic fuel prices, GDP |
| OPEC+ emergency cut (2M bpd) | Spot price surge, import bill increase |
| Red Sea shipping suspension | Route diversion cost, delivery delay |
| Combined multi-corridor stress | Worst-case national energy security |

**Output schema:**
```json
{
  "agent": "scenario_modeller",
  "event_type": "hormuz_closure_40pct",
  "assumptions": [
    "40% of Hormuz traffic disrupted for 14 days",
    "SPR drawdown begins day 3 at 0.2 mbpd",
    "Alternate route via Cape adds 12 days transit"
  ],
  "impacts": {
    "refinery_run_rate_drop_pct": 22,
    "domestic_fuel_price_increase_pct": 14,
    "power_sector_stress_index": 67,
    "gdp_trajectory_30d_pct": -0.8
  },
  "confidence_interval": "85%"
}
```

---

### 3. 🛢️ Adaptive Procurement Orchestrator
Identifies and ranks **alternative crude sources and logistics routes**, factoring in spot pricing, tanker availability, port congestion, and refinery grade compatibility.

**Output schema:**
```json
{
  "agent": "procurement_orchestrator",
  "recommendations": [
    {
      "rank": 1,
      "source": "Nigeria (Bonny Light)",
      "route": "West Africa → Cape of Good Hope → Paradip",
      "spot_price_usd_bbl": 84.5,
      "transit_days": 24,
      "grade_compatible_refineries": ["HPCL Vizag", "IOC Paradip"],
      "tanker_availability": "HIGH",
      "port_congestion": "LOW",
      "priority": "HIGH"
    }
  ],
  "signal_to_recommendation_minutes": 87
}
```

---

### 4. 🏭 Strategic Reserve Optimisation Agent
Models **optimal SPR drawdown schedules** against supply gap forecasts, refinery demand curves, and replenishment window estimates.

**Output schema:**
```json
{
  "agent": "spr_optimiser",
  "current_cover_days": 9.5,
  "recommended_drawdown_mbpd": 0.15,
  "projected_cover_days_after_drawdown": 6.2,
  "replenishment_window_opens_days": 18,
  "priority_refineries": ["Reliance Jamnagar", "BPCL Mumbai"],
  "risk_if_no_action": "Reserve exhaustion in 9 days under current gap rate"
}
```

---

### 5. 🗺️ Supply Chain Digital Twin
A **geospatial simulation** of India's full energy supply network — from wellhead to refinery to distribution — enabling continuous what-if analysis.

**Nodes tracked:**
- Supplier nations: Saudi Arabia, Iraq, UAE, Russia, Nigeria, USA
- Chokepoints: Hormuz, Red Sea, Suez, Malacca
- Indian ports: Kandla, Paradip, Mangalore (MRPL), Vizag, Mumbai (JNPT)
- Refineries: Jamnagar, Kochi, Panipat, Mathura, Bongaigaon

---

## 💻 Frontend Dashboard

A **dark-themed command center** built in React + TypeScript with real-time updates via Supabase Realtime.

### Components

| Component | Description | Library |
|-----------|-------------|---------|
| Live Risk Heatmap | World map with corridor risk overlays and vessel markers | react-leaflet |
| Risk Score Gauges | 0–100 disruption probability per corridor | recharts RadialBar |
| Scenario Modeller | Event selector + cascading impact waterfall chart | recharts |
| Procurement Cards | Ranked alternative source cards with priority badges | Custom |
| SPR Timeline | Drawdown schedule area chart with 9.5-day buffer line | recharts |
| Alert Feed | Auto-scrolling live geopolitical signal ticker | Custom |
| Response Tracker | Signal → recommendation latency meter | Custom |

---

## 🗄️ Backend — Supabase

Supabase replaces three separate services in one free-tier project:

| Need | Solution |
|------|----------|
| Structured data storage | PostgreSQL |
| Vector search for RAG | pgvector extension |
| Real-time dashboard updates | Supabase Realtime (WebSocket) |
| API endpoints | Edge Functions (Deno) |
| Authentication | Supabase Auth |

### Database Tables

```sql
risk_scores          -- per-corridor risk scores from Geopolitical Agent
procurement_recs     -- ranked alternative procurement options
scenarios            -- scenario simulation results + assumptions
spr_plans            -- SPR drawdown schedules
intel_documents      -- embeddings for RAG (pgvector)
alert_feed           -- live geopolitical signal log
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A free [Google AI Studio](https://aistudio.google.com) account (Gemini API key)
- A free [Supabase](https://supabase.com) project
- A free [NewsAPI](https://newsapi.org) key
- A free [Alpha Vantage](https://alphavantage.co) key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/energy-resilience-system.git
cd energy-resilience-system

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Environment Variables

```env
# .env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_NEWS_API_KEY=your_newsapi_key
VITE_ALPHA_VANTAGE_KEY=your_alpha_vantage_key
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the dashboard loads with simulated live data immediately, no API keys required for the prototype mode.

### Build for production

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
energy-resilience-system/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── CommandCenter.tsx       # Main dashboard shell
│   │   ├── map/
│   │   │   ├── RiskHeatmap.tsx         # Leaflet map + corridor overlays
│   │   │   └── VesselMarker.tsx        # AIS vessel markers
│   │   ├── charts/
│   │   │   ├── RiskGauge.tsx           # Radial risk score gauge
│   │   │   ├── ScenarioWaterfall.tsx   # Impact waterfall chart
│   │   │   └── SPRTimeline.tsx         # SPR drawdown area chart
│   │   └── agents/
│   │       ├── AlertFeed.tsx           # Live geopolitical alert ticker
│   │       ├── ProcurementCards.tsx    # Ranked procurement recommendations
│   │       ├── ResponseTracker.tsx     # Signal → rec. latency meter
│   │       └── ScenarioSelector.tsx    # Scenario event picker
│   ├── data/
│   │   └── simulatedAgentOutputs.ts   # Static + dynamic mock data
│   ├── hooks/
│   │   ├── useRiskFeed.ts             # Realtime risk score subscription
│   │   └── useAgentSimulator.ts       # Live feed simulation hook
│   ├── types/
│   │   └── agents.ts                  # TypeScript interfaces for all agents
│   ├── lib/
│   │   ├── supabase.ts                # Supabase client
│   │   └── gemini.ts                  # Gemini API client
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── README.md
├── package.json
├── tailwind.config.ts
└── vite.config.ts
```

---

## 🔑 Key Design Decisions

**Why Gemini 1.5 Flash?**
Free tier provides 1M tokens/day and 15 req/min — sufficient for all five agents in prototype and demo scenarios. Flash is fast enough for sub-2-hour signal-to-recommendation SLA.

**Why Supabase over FastAPI + Redis + Pinecone?**
Supabase collapses three separate infrastructure dependencies into one free-tier project. pgvector handles RAG without Pinecone. Realtime WebSockets replace Redis pub/sub. Edge Functions replace a FastAPI deployment. Dramatically reduces setup friction for a hackathon.

**Why Leaflet over Deck.gl?**
`react-leaflet` has a gentler learning curve and better TypeScript support for rapid prototyping. Deck.gl would be the production upgrade path for WebGL-accelerated AIS vessel density rendering.

**Why simulated data first?**
API rate limits and auth setup should not block UI development. The simulation layer (`useAgentSimulator`) generates realistic stochastic data — new risk events every 30 seconds, procurement recommendations refreshing every 2 minutes — making the prototype feel live without any API dependency.

---

## 📊 Evaluation Criteria Alignment

| Judging Criterion | Weight | How This System Addresses It |
|------------------|--------|------------------------------|
| Innovation | 25% | Multi-agent AI architecture with real-time geopolitical scoring — not a dashboard bolted onto existing tools |
| Business Impact | 25% | Directly addresses India's 9.5-day SPR vulnerability; quantifies GDP impact per scenario |
| Technical Excellence | 20% | TypeScript throughout, pgvector RAG, Supabase Realtime, explicit assumption logging |
| Scalability | 15% | Supabase scales to production; agent layer is horizontally extensible; Neo4j KG grows with new supplier relationships |
| User Experience | 15% | Dark command-center UI; sub-2-hour signal-to-rec SLA displayed live; mobile-responsive |

---

## 🗺️ Roadmap

### Phase 1 — Prototype (Current)
- [x] React dashboard with simulated agent outputs
- [x] Leaflet risk heatmap with corridor overlays
- [x] Recharts scenario waterfall + SPR timeline
- [x] Live alert feed simulation

### Phase 2 — Real API Integration
- [ ] NewsAPI → Gemini pipeline for live geopolitical risk scoring
- [ ] Alpha Vantage crude price feeds
- [ ] Supabase Realtime replacing simulation hooks
- [ ] MarineTraffic AIS vessel overlay

### Phase 3 — Production
- [ ] Neo4j knowledge graph (supplier → route → refinery relationships)
- [ ] LangGraph multi-agent orchestration with memory
- [ ] Gemini 1.5 Pro for scenario modelling (higher reasoning depth)
- [ ] SPR integration with MoPNG data feeds
- [ ] Export: PDF briefing generator for policymakers

---

## 👥 Team

Built for the **AI Supply Chain Resilience Hackathon** — Theme: Supply Chain Intelligence / Energy Security / Geopolitical Risk.

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Signal detected → Risk scored → Alternatives ranked → Decision made</strong><br/>
  <em>From 47 days of reactive chaos to under 2 hours of managed response.</em>
</p>