# Intune GPMC

A production-quality web application that functions as a **Group Policy Management Console (GPMC) equivalent for Microsoft Intune** — enabling policy inventory, browsing, comparison, search, assignment impact analysis, GPO migration assessment, change governance, and reporting across your Intune tenant.

---

## Features

| Feature | Description |
|---|---|
| **Policy Explorer** | Browse all Intune policies (Settings Catalog, Admin Templates, Device Config, Endpoint Security, Compliance, Scripts, and more) with filtering and list/grid views |
| **Policy Details** | Drill into any policy: overview metadata, settings tree, assignment breakdown, version history (snapshots), and raw JSON |
| **Policy Comparison** | Side-by-side settings matrix across 2 policies with conflict and unique setting highlighting |
| **Global Search** | Fuzzy full-text search across policy names, descriptions, settings keys, and assignments |
| **Reports** | 8 built-in reports: Unassigned, Missing Scope Tags, Stale (90d+), Overlapping Assignments, Conflicting Settings, Duplicates, Settings Usage, Migration Readiness |
| **GPO Migration** | Group Policy Analytics integration — assess GPO settings for migration readiness (Ready / Partial / Blocked) |
| **Snapshots** | Capture and download point-in-time policy snapshots for change governance |
| **Audit Log** | Structured activity trail for all governance actions |
| **Dashboard** | KPI cards (total, unassigned, missing tags, stale, conflicts) + recently modified policies |

---

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript 5.6+
- **Styling**: Tailwind CSS 3, Radix UI primitives, class-variance-authority, Lucide icons
- **Auth**: Auth.js v5 (next-auth) with Microsoft Entra ID (Azure AD) — delegated user auth, server-side token handling
- **Graph API**: Custom axios-based `GraphClient` with retry/backoff, 429 throttle handling, pagination
- **State**: TanStack Query v5 (server state), Zustand v5 (client UI state)
- **Database**: Prisma 5 — SQLite for local development and Cloudflare D1 in deployed environments
- **Search**: Fuse.js fuzzy search — no external search service required
- **Validation**: Zod throughout (API routes + forms)
- **Logging**: Pino (structured JSON)
- **Testing**: Vitest + Testing Library (unit), Playwright (e2e)
- **Infrastructure**: Cloudflare Pages, OpenNext for Cloudflare, Wrangler, Docker

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Microsoft Entra ID (Azure AD) app registration with the following **delegated** Graph API permissions:
  - `DeviceManagementConfiguration.Read.All`
  - `DeviceManagementManagedDevices.Read.All`
  - `DeviceManagementApps.Read.All`
  - `DeviceManagementRBAC.Read.All`
  - `Group.Read.All`
  - `User.Read`
  - `offline_access`

### Setup

```bash
# 1. Clone
git clone <repo-url>
cd ISMC

# 2. Install dependencies
npm install

# 3. Configure environment
# macOS/Linux
cp .env.example .env.local
# PowerShell
Copy-Item .env.example .env.local
# Fill in AUTH_ENTRA_TENANT_ID, AUTH_ENTRA_CLIENT_ID, AUTH_ENTRA_CLIENT_SECRET, AUTH_SECRET

# 4. Set up the database
npx prisma generate
npx prisma db push         # dev (SQLite)
# Cloudflare Pages uses the D1 binding configured in wrangler.toml

# 5. Run in development mode
npm run dev
```

> **Mock mode**: Copying `.env.example` sets `NEXT_PUBLIC_ENABLE_MOCK=true`, which enables the in-memory demo data locally. Set it to `false` to use live Microsoft Graph data.

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to the login page.

---

## Environment Variables

See [.env.example](.env.example) for the full list. Key variables:

| Variable | Description |
|---|---|
| `AUTH_ENTRA_TENANT_ID` | Your Entra ID tenant ID |
| `AUTH_ENTRA_CLIENT_ID` | App registration client ID |
| `AUTH_ENTRA_CLIENT_SECRET` | App registration client secret |
| `AUTH_SECRET` | Random secret for session signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Canonical URL of the app (e.g. `http://localhost:3000`) |
| `DATABASE_URL` | Database connection string |
| `NEXT_PUBLIC_ENABLE_MOCK` | `true` / `false` — enable mock Graph responses |
| `GRAPH_MAX_CONCURRENT_REQUESTS` | Maximum concurrent in-flight Graph API requests per application request |
| `GRAPH_LIST_CONCURRENCY` | Maximum parallel per-policy Graph enrichment calls during list operations |
| `ENABLE_WRITE_OPERATIONS` | `true` / `false` — allow policy mutations (default: false) |

---

## Docker

```bash
# Build and start with PostgreSQL
docker compose up --build

# Or build image only
docker build -t intune-gpmc .
```

The `docker-compose.yml` starts the app on port 3000 with a PostgreSQL 16 database. Set environment variables in `docker-compose.yml` or via a `.env` file before building.

---

## Running Tests

```bash
# Unit tests (Vitest)
npm run test

# Unit tests with watch
npm run test:watch

# E2E tests (Playwright) — requires a running app
npm run test:e2e

# Type checking
npx tsc --noEmit
```

---

## Project Structure

```
src/
├── app/                    Next.js App Router pages + API routes
│   ├── (app)/              Protected app shell (requires auth)
│   │   ├── dashboard/      Dashboard page
│   │   ├── explorer/       Policy Explorer
│   │   ├── policies/[id]/  Policy Details
│   │   ├── compare/        Policy Comparison
│   │   ├── search/         Global Search
│   │   ├── reports/[type]/ Reports
│   │   ├── migration/      GPO Migration
│   │   └── audit/          Audit Log
│   ├── (auth)/login/       Login page
│   └── api/                REST API routes
├── domain/                 TypeScript domain models + enums
├── lib/
│   ├── auth/               NextAuth config + permissions
│   ├── graph/              Graph API client + endpoints
│   └── db/                 Prisma client singleton
├── repositories/           Data access layer
│   ├── mock/               In-memory mock repositories
│   ├── settingsCatalog/    Settings Catalog repo + mapper
│   ├── adminTemplates/     Admin Templates repo + mapper
│   ├── deviceConfig/       Device Configuration repo + mapper
│   ├── compliance/         Compliance repo
│   ├── endpointSecurity/   Endpoint Security repo
│   ├── scripts/            Scripts + Remediations repo
│   ├── assignmentFilters/  Assignment Filters repo
│   ├── scopeTags/          Scope Tags repo
│   └── factory.ts          Repository registry factory
├── services/               Business logic layer
│   ├── policyInventoryService.ts
│   ├── comparisonService.ts
│   ├── assignmentImpactService.ts
│   ├── reportService.ts
│   ├── searchService.ts
│   ├── snapshotService.ts
│   └── auditService.ts
├── features/               UI feature modules
│   ├── dashboard/          Dashboard KPI + recent policies
│   ├── explorer/           Policy Explorer + list/grid
│   ├── policies/           Policy Details tabs
│   ├── comparison/         Comparison workspace + settings matrix
│   ├── reports/            Reports viewer
│   ├── search/             Global search
│   ├── migration/          GPO migration workspace
│   └── audit/              Audit log viewer
└── components/
    ├── ui/                 Base UI components (Button, DataTable, etc.)
    ├── shared/             Domain-aware shared components
    ├── layout/             Sidebar, Header, AppShell
    └── providers/          TanStack Query provider
```

---

## Architecture

See [docs/architecture.md](docs/architecture.md) for detailed system design, data flow diagrams, and Graph API integration notes.

---

## Security Notes

- Auth tokens are stored server-side only (JWT in HTTP-only cookies); never in localStorage
- All API routes require authentication via middleware
- Write operations are gated by `ENABLE_WRITE_OPERATIONS=true` (default: off)
- CSP, X-Frame-Options, and HSTS headers are set in `next.config.ts`
- All user inputs are validated with Zod before processing

---

## License

MIT
