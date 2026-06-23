# AI-Driven Energy Supply Chain Resilience System

This repository contains the working prototype of an AI-Driven Energy Supply Chain Resilience System designed for import-dependent economies, specifically tailored for India's crude oil supply chain.

## Overview
India imports ~88% of its crude oil, heavily relying on key maritime corridors like the Strait of Hormuz. This system converts reactive crisis response into anticipatory, managed resilience. 

## Key Features
- **Live Risk Heatmap**: Real-time disruption probability scores across key corridors (Strait of Hormuz, Red Sea/Suez, Cape of Good Hope, Malacca Strait).
- **Disruption Scenario Modeler**: Simulates cascading impacts on refinery run rates, domestic fuel prices, and GDP.
- **Adaptive Procurement Orchestrator**: Identifies and ranks alternative crude sources based on spot pricing, tanker availability, port congestion, and refinery grade compatibility.
- **Strategic Reserve Optimization**: Models optimal SPR drawdown schedules based on supply gap forecasts.

## Architecture

The system uses a Multi-Agent framework orchestrating various intelligence, modeling, and procurement modules.

```mermaid
flowchart TD
    %% Data Sources
    subgraph Data Sources
        News[NewsAPI / RSS]
        AIS[MarineTraffic AIS]
        Prices[Alpha Vantage]
        Policy[Sanctions Registries]
    end

    %% Agents
    subgraph Multi-Agent Framework (LangGraph / CrewAI)
        GeoRisk[Geopolitical Risk Intelligence Agent]
        Scenario[Disruption Scenario Modeler]
        Procure[Adaptive Procurement Orchestrator]
        SPROpt[Strategic Reserve Optimization Agent]
    end

    %% Storage & AI
    subgraph Infrastructure
        LLM[Gemini API]
        VectorDB[(Pinecone / Weaviate)]
        KG[(Neo4j Knowledge Graph)]
        DB[(Supabase Backend)]
    end

    %% Frontend
    subgraph UI
        Dashboard[React + Tailwind Dashboard]
        Map[Deck.gl / Leaflet.js]
    end

    %% Connections
    News & AIS & Prices & Policy --> GeoRisk
    GeoRisk --> Scenario
    GeoRisk <--> LLM
    GeoRisk <--> VectorDB
    Scenario <--> KG
    Scenario --> Procure
    Scenario --> SPROpt
    
    GeoRisk --> DB
    Scenario --> DB
    Procure --> DB
    SPROpt --> DB
    
    DB <--> Dashboard
    Dashboard --- Map
```

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Simulated JSON Agent Output

Each agent follows a structured output pattern:
```json
{
  "agent": "Geopolitical Risk Intelligence Agent",
  "timestamp": "2026-06-23T14:00:00Z",
  "confidence": 0.85,
  "signal_source": ["MarineTraffic AIS", "NewsAPI"],
  "risk_score": 78,
  "recommendations": [
    {
      "action": "Increase monitoring of Hormuz transit",
      "priority": "HIGH",
      "estimated_impact": "Potential 30% supply drop",
      "timeline": "Immediate"
    }
  ],
  "assumptions": ["Current tensions escalate linearly without military intervention"],
  "data_freshness": 42
}
```
