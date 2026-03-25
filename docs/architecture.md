# Architecture

## Overview

Intune GPMC is a Next.js 15 web application using the App Router. It authenticates users via Microsoft Entra ID and accesses the Microsoft Graph API on their behalf to query Intune policy data.

---

## System Architecture

```
Browser
  │
  ├─ Next.js App (React Server + Client Components)
  │    ├─ /app/(app)/*    — Protected pages (auth-gated via middleware)
  │    ├─ /app/api/*      — REST API routes (server-side, auth-validated)
  │    └─ /app/(auth)/*   — Login page
  │
  ├─ Auth.js v5 (next-auth)
  │    └─ Microsoft Entra ID OIDC + token refresh
  │
  ├─ GraphClient (axios)
  │    ├─ v1.0 endpoint (stable APIs)
  │    ├─ beta endpoint (Intune-specific APIs)
  │    ├─ Automatic retry (3x, exponential backoff)
  │    └─ 429 throttle handling (Retry-After)
  │
  ├─ Repository Layer
  │    ├─ Mock repos (in-memory, for dev/testing)
  │    └─ Graph repos (live Microsoft Graph data)
  │
  ├─ Service Layer
  │    ├─ PolicyInventoryService — parallel multi-repo fetch
  │    ├─ ComparisonService      — settings matrix diff
  │    ├─ SearchService          — Fuse.js fuzzy search
  │    ├─ ReportService          — 8 report generators
  │    ├─ AssignmentImpactService
  │    ├─ SnapshotService        — Prisma-backed versioning
  │    └─ AuditService           — Prisma-backed audit log
  │
  └─ Prisma ORM
       ├─ SQLite (development)
       └─ PostgreSQL (production)
```

---

## Authentication & Authorization Flow

```
User → Login page
  → next-auth MicrosoftEntraID provider
  → OAuth2 authorization_code flow
  → JWT session (8h) with access_token + refresh_token
  → Middleware verifies session on every /app/* and /api/* request
  → GraphClient uses access_token for Graph API calls
  → Token refresh happens automatically on expiry
```

### Required Graph Permissions (Delegated)

| Permission | Purpose |
|---|---|
| `DeviceManagementConfiguration.Read.All` | Settings Catalog, Admin Templates, Endpoint Security |
| `DeviceManagementManagedDevices.Read.All` | Device compliance data |
| `DeviceManagementApps.Read.All` | App protection/configuration |
| `DeviceManagementRBAC.Read.All` | Scope tags, Role assignments |
| `Group.Read.All` | Resolve group names for assignments |
| `User.Read` | Current user identity |

---

## Repository Pattern

Each policy type has its own repository that handles:
1. Fetching raw Graph API data (with pagination)
2. Mapping Graph DTOs → normalized `PolicyObject` domain model
3. Parallel assignment fetching (one call per policy)

```
RepositoryRegistry
  ├─ settingsCatalog: PolicyRepository
  ├─ adminTemplates: PolicyRepository
  ├─ deviceConfig: PolicyRepository
  ├─ endpointSecurity: PolicyRepository (also SecurityBaseline)
  ├─ compliance: PolicyRepository
  ├─ scripts: PolicyRepository (also Remediation)
  ├─ assignmentFilters: AssignmentFilterRepository
  └─ scopeTags: ScopeTagRepository
```

The factory (`src/repositories/factory.ts`) switches between mock and real implementations via `NEXT_PUBLIC_ENABLE_MOCK`.

---

## Data Flow: Policy List

```
GET /api/policies
  │
  ├─ Validate query params (Zod)
  ├─ Auth check (next-auth session)
  │
  ├─ PolicyInventoryService.listAll()
  │    ├─ Promise.allSettled([
  │    │    settingsCatalog.listPolicies(),
  │    │    adminTemplates.listPolicies(),
  │    │    deviceConfig.listPolicies(),
  │    │    endpointSecurity.listPolicies(),
  │    │    compliance.listPolicies(),
  │    │    scripts.listPolicies()
  │    │  ])
  │    └─ Flatten + sort by lastModifiedDateTime
  │
  └─ Return paginated JSON response
```

---

## Search Architecture

Fuse.js is initialized per-request with all policies (no external search index needed). Field weights:

| Field | Weight |
|---|---|
| `displayName` | 3.0 (highest) |
| `description` | 2.0 |
| `settingNames` | 2.0 |
| `settingPaths` | 1.5 |
| `assignmentGroupNames` | 1.5 |
| `policyType` | 1.0 |
| `platform` | 1.0 |

Pre-filters (type, platform, scope tag, date range) are applied before Fuse.js scoring.

---

## Database Schema (Prisma)

Used only for persistence that doesn't live in Graph:

- **PolicySnapshot** — Point-in-time full policy JSON captures
- **AuditEntry** — Activity log (view, snapshot, note)
- **SavedSearch** — User-saved search queries
- **PolicyNote** — Free-text notes attached to policies
- **PolicyTag** — Custom labels (separate from Graph scope tags)
- **GpoImport** — Imported GPO analysis results
- **TenantConfig** — Per-tenant feature flag overrides

NextAuth tables (Account, Session, User, VerificationToken) are also managed by Prisma.

---

## Mock Mode

Set `NEXT_PUBLIC_ENABLE_MOCK=true` to use in-memory mock data. This is the default in `.env.example` for development. Mock data includes:

- 30+ realistic policy objects across all types
- BitLocker, Defender AV, Windows Update, macOS FileVault, iOS Passcode settings
- Multiple assignment patterns (All Devices, All Users, specific groups, filter rules)
- Conflict annotations to exercise the comparison feature

Mock repositories implement the same `PolicyRepository` interface as real Graph repos, so switching is seamless.
