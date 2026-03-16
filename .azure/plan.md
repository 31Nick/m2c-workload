# Azure Preparation Plan

Status: Ready for validation

## 1. Project mode
- Mode: NEW
- Goal: Build a lightweight stock-broker-style dashboard for the top 10 tech stocks with a React frontend, Python backend, and Azure Web App hosting target.

## 2. Working assumptions
- Frontend: React 19 with Vite and TypeScript.
- Backend: Python FastAPI with Uvicorn.
- Market data source: Public Yahoo Finance market data accessed through the `yfinance` package.
- Hosting target: Azure App Service Web App on Linux.
- Deployment shape: Single deployable web app where the Python backend serves the built React assets and API endpoints.
- Scope: Public dashboard only; no user authentication or trading execution in the first version.
- Cost target: Low-cost developer-friendly deployment using a single App Service plan.

## 3. Proposed application architecture
- `frontend/`: React dashboard UI with:
  - hero header and market summary
  - top-10 tech stock tiles
  - sortable performance table
  - interactive historical price chart for selected ticker
  - gain/loss visual cues and responsive layout
- `backend/`: FastAPI service with:
  - `GET /api/stocks/overview` for current price, change, market cap, and volume
  - `GET /api/stocks/history/{symbol}` for recent trend data
  - server-side caching to reduce repeated public-data calls
  - static file serving for production React build
- Shared configuration via environment variables.

## 4. Azure design
- Azure App Service Web App (Linux) for application hosting.
- Basic App Service Plan sized for lightweight traffic.
- App settings for API configuration and cache controls.
- Optional health endpoint for App Service monitoring.
- Infrastructure as code in `infra/` using Bicep.
- `azure.yaml` for Azure Developer CLI-based deployment workflow.
- GitHub Actions CI/CD workflow for build and deployment into Azure Web App using OpenID Connect.

## 5. Implementation plan
1. Scaffold React frontend and FastAPI backend structure.
2. Build stock data service around public Yahoo Finance data for these symbols:
   - AAPL, MSFT, NVDA, GOOGL, AMZN, META, TSLA, AVGO, ORCL, AMD
3. Create visually polished dashboard components and charts.
4. Serve the production frontend from the Python app for a single-site Azure deployment.
5. Add Azure deployment assets:
   - `infra/main.bicep`
   - `azure.yaml`
  - `.github/workflows/azure-webapp.yml`
   - startup/configuration guidance
6. Add local run instructions to `README.md`.

## 6. Deliverables
- React + TypeScript frontend
- FastAPI backend
- Public stock data integration
- Azure-ready App Service configuration
- Infrastructure as code and deployment instructions

## 7. Risks and mitigations
- Public market-data endpoints can rate-limit or change behavior.
  - Mitigation: add short-lived server cache and defensive error handling.
- Azure App Service Python runtime availability can differ by region/version.
  - Mitigation: target the latest stable Azure-supported Python runtime during implementation.
- Client-side bundle deployment must align with backend static hosting.
  - Mitigation: use a single production artifact path and explicit build output.

## 8. Approval request
If approved, the next step is to scaffold the app, implement the dashboard, and add Azure deployment assets.