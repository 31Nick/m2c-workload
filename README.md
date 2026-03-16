# m2c-workload

Lightweight tech-stocks dashboard with a React frontend, FastAPI backend, public Yahoo Finance data, Azure App Service hosting, and GitHub Actions CI/CD.

## Architecture

- `frontend/`: React 19 + Vite + TypeScript dashboard UI.
- `backend/`: FastAPI API that fetches top tech stock data and serves the production frontend.
- `infra/`: Azure Bicep for App Service, Log Analytics, and Application Insights.
- `.github/workflows/azure-webapp.yml`: CI/CD pipeline for Azure deployment.

## Local development

### Backend

1. Create and activate a Python 3.12 virtual environment.
2. Install dependencies from [backend/requirements.txt](backend/requirements.txt).
3. Run the API from the `backend` folder with `uvicorn app.main:app --reload`.
4. Open `http://127.0.0.1:8000/health` to verify the service.

### Frontend

1. Install dependencies in [frontend/package.json](frontend/package.json).
2. Start the dev server from the `frontend` folder with `npm run dev`.
3. The frontend proxies API traffic to the FastAPI server during development.

### Production-style local build

1. Build the frontend from the `frontend` folder with `npm run build`.
2. Copy the contents of `frontend/dist` into `backend/app/static`.
3. Start the backend and open `http://127.0.0.1:8000`.

## Azure infrastructure

The Bicep template in [infra/main.bicep](infra/main.bicep) uses Azure Verified Modules (AVM) and provisions:

- a Linux App Service plan
- a Linux Web App configured for Python 3.12
- a Log Analytics workspace
- an Application Insights instance connected to the workspace

Pinned AVM module versions:

- `br/public:avm/res/web/serverfarm:0.7.0`
- `br/public:avm/res/web/site:0.22.0`
- `br/public:avm/res/operational-insights/workspace:0.15.0`
- `br/public:avm/res/insights/component:0.7.1`

The web app is configured with:

- HTTPS-only access
- HTTP/2 enabled
- health checks on `/health`
- Oryx build settings for App Service deployments
- Gunicorn + Uvicorn startup command

## GitHub Actions deployment

The workflow in [.github/workflows/azure-webapp.yml](.github/workflows/azure-webapp.yml) does the following on pushes to `main` and manual runs:

1. installs frontend dependencies
2. builds the React app
3. copies the built static assets into `backend/app/static`
4. signs in to Azure with OpenID Connect
5. creates or updates the resource group
6. deploys [infra/main.bicep](infra/main.bicep)
7. deploys the `backend` folder to Azure App Service

### Required GitHub secrets

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

### Recommended GitHub repository variables

- `AZURE_RESOURCE_GROUP` default example: `m2c-workload-rg`
- `AZURE_LOCATION` default example: `eastus2`
- `AZURE_APP_NAME_PREFIX` default example: `m2cstocks`

The workflow reads the deployed app name from the Bicep outputs, so the App Service name does not need to be hard-coded in GitHub.

## Azure authentication setup for GitHub Actions

Create a Microsoft Entra application or service principal with a federated credential for this repository and grant it rights to deploy into the target subscription or resource group. Then add the three Azure secrets listed above to the repository.

## Useful files

- [backend/app/main.py](backend/app/main.py)
- [backend/app/services/market_data.py](backend/app/services/market_data.py)
- [frontend/src/App.tsx](frontend/src/App.tsx)
- [infra/main.bicep](infra/main.bicep)
- [.github/workflows/azure-webapp.yml](.github/workflows/azure-webapp.yml)
