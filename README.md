
# 🚀 LogCopilot – Frontend

**LogCopilot** is a React + TypeScript–based dashboard that visualizes vulnerabilities and runtime exceptions in distributed environments.  
It connects to a backend service (built by another team) that ingests Docker/EKS/ECS logs, analyzes vulnerabilities, and aggregates exceptions for each release and environment.

----------------------------------------------------------------------------------------------------------------

## 🧭 Purpose

The **LogCopilot Frontend** provides a single-pane view for:
- 🧩 **Vulnerability Insights** – from Docker image scans (e.g., Trivy reports)
- ⚙️ **Runtime Exceptions** – from EKS/ECS/CloudWatch data streams
- 📊 **Trend Analysis** – visualize day-wise/hourly patterns
- 🤖 **AI Remediation Suggestions** – show automated fix guidance for vulnerabilities or exceptions
- 🧭 **Context-aware Filters** – by release, environment, and timeframe

This UI is built for use by DevOps, QE, and SRE teams to **quickly triage, analyze, and act** on build and runtime issues.

----------------------------------------------------------------------------------------------------------------

## 🧰 Tech Stack

| Layer                          | Technology                                                                  |
|--------------------------------|-----------------------------------------------------------------------------|
| Framework                      | React 18 + TypeScript                                                       |
| Build Tool                     | Vite                                                                        |
| UI Library                     | Tailwind CSS + ShadCN/UI components                                         |
| Routing                        | React Router                                                                |
| State Management               | React Hooks (Context + useState)                                            |
| Charts                         | Recharts / React-Vis (depending on build)                                   |
| Animations                     | Framer Motion / Tailwind Transitions                                        |
| Code Quality                   | ESLint + Prettier                                                           |
----------------------------------------------------------------------------------------------------------------

## ⚙️ Project Setup

### 🪄 1. Clone the repository

```bash
git clone https://github.com/<your-org>/logcopilot-frontend.git
cd logcopilot-frontend
```

### 📦 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 🧩 3. Environment variables

Create a `.env.local` file in the project root.  
Update it with the backend API details and any tokens needed for communication.

```bash
# Frontend Environment Configuration

# Backend API base URL (the service you’ll receive from the backend team)
VITE_API_BASE=http://localhost:8000

# Optional: Bearer token if your backend uses auth
VITE_INGEST_TOKEN=sample-dev-token

# Optional flag – when true, use backend APIs; when false, load mock data (future)
VITE_USE_API=true

# Optional analytics or feature toggles (future)
VITE_ENABLE_ANIMATIONS=true
VITE_DEFAULT_ENV=stage

```

> **Note:** When integrating with another system where the backend runs remotely, **only `VITE_API_BASE` and `VITE_INGEST_TOKEN`** need to be updated to match that environment.

----------------------------------------------------------------------------------------------------------------

### 🧱 4. Run the app (development mode)

```bash
npm run dev
```

Then open your browser at [http://localhost:5173](http://localhost:5173)

----------------------------------------------------------------------------------------------------------------

### 🏗️ 5. Build for production

```bash
npm run build
```

The optimized static files will be generated inside the `/dist` folder.

You can preview the build locally using:

```bash
npm run preview
```

----------------------------------------------------------------------------------------------------------------

## 🧪 Folder Structure

```
logcopilot-frontend/
├── src/
│   ├── components/                # UI components
│   │   ├── VulnerabilityDashboard.tsx
│   │   ├── ExceptionsDashboard.tsx
│   │   ├── RemediationDrawer.tsx
│   │   ├── GlobalContextBar.tsx
│   │   └── ui/                    # shared UI primitives
│   ├── services/                  # API and mock data services
│   │   ├── api.ts
│   │   └── vulnerabilityService.ts
│   ├── types/                     # TypeScript interfaces
│   ├── App.tsx                    # Root component with routes
│   ├── main.tsx                   # Entry point (ReactDOM)
│   └── index.css                  # Tailwind & global styles
├── public/
│   └── favicon.ico
├── vite.config.ts
├── package.json
└── README.md
```

----------------------------------------------------------------------------------------------------------------

## 🧾 Prerequisites

Before setting up the frontend on another system, ensure:

| Requirement     | Minimum Version        | Description                                                      |
|-----------------|------------------------|------------------------------------------------------------------|
| **Node.js**     | 18.x or above          | Required for Vite + React                                        |
| **npm / yarn**  | npm ≥ 9 or yarn ≥ 1.22 | Package manager                                                  |
| **Git**         | Any recent version     | To clone the repo                                                |
| **Backend API** | (Provided separately)  | Running service exposing `/vulns`, `/runtime`, `/releases`, etc. |
---------------------------------------------------------------------------------------------------------------

- ** NOTE: Node version used while building the project was v22.14.0 and npm version as 10.9.2

## 🔗 Backend Integration (Expected APIs)

The frontend expects the backend to expose REST APIs like:

| Endpoint                                       | Purpose                                                     |
|------------------------------------------------|-------------------------------------------------------------|
| `GET /releases?env=`                           | List all releases per environment                           |
| `GET /vulns?release_id=&env=&timeframe=`       | Get vulnerability data                                      |
| `GET /runtime?release_id=&env=&since=&bucket=` | Get runtime exceptions                                      |
| `GET /stats/runtime/hourly`                    | Hourly exception stats                                      |
| `GET /stats/runtime/daily`                     | Daily exception stats                                       |
----------------------------------------------------------------------------------------------------------------

## 🧑‍💻 Developer Notes

- **Dev vs Prod Mode:**  (future)
  Use mock data by setting `VITE_USE_API=false` to work without backend.
- **Animations:**  (future)
  Enable or disable animations via `VITE_ENABLE_ANIMATIONS`.
- **Type safety:**  
  Modify interfaces in `src/types/` when backend response schemas evolve.
- **API service:**  
  All fetch calls are centralized in `src/services/api.ts`.

----------------------------------------------------------------------------------------------------------------

## 🧱 Troubleshooting

| Issue | Cause | Fix |
|------------------------------|----------------------------------------------|---------------------------------------------|
| App fails to fetch data      | Backend not running or wrong `VITE_API_BASE` | Update `.env.local`                         |
| CORS error                   | Backend missing CORS headers    | Ask backend team to add `Access-Control-Allow-Origin: *` |
| Blank screen after build     | Wrong public base path                       | Update `base` in `vite.config.ts`           |
-----------------------------------------------------------------------------------------------------------------------------

## 🏁 Next Steps

Once the backend is available:
1. Update `.env.local` → set correct `VITE_API_BASE` (mandatory) & `VITE_INGEST_TOKEN` (if required)
2. Test data fetching in both tabs (Vulnerabilities, Exceptions)
3. Validate AI Remediation drawer and trend toggles
4. Create a single deployable bundle (e.g., Nginx static hosting)

----------------------------------------------------------------------------------------------------------------
