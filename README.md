# 🛡️ UrbanShield
### Secure Access & API Protection for Urban Systems

> **One command. Full security stack. Zero hardcoding.**

```bash
git clone <repo> && cd urban-shield && cp .env.example .env && docker-compose up
```

Open → `http://localhost:3000` · API Docs → `http://localhost:3001/api-docs`

---

## What Problem Does This Solve?

City infrastructure systems — traffic lights, water pumps, power stations, CCTV — are managed through APIs that typically have **no access control, no monitoring, and no audit trail**.

The problem statement requires exactly 3 things:

| Requirement | What UrbanShield Does |
|---|---|
| ✅ Define user roles for city operations | 5 city-specific roles, 7 permissions, all stored in DB |
| ✅ Enforce access restrictions | JWT + RBAC middleware on every single API route |
| ✅ Record access-related activity | Full audit log with before/after state on every request |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│              React + TypeScript + Tailwind                  │
│                    localhost:3000                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────────┐
│                     BACKEND API                             │
│              Node.js + Express + TypeScript                 │
│                    localhost:3001                           │
│                                                             │
│   Every Request Passes Through This Chain:                  │
│                                                             │
│   helmet() ──► cors() ──► rateLimit() ──► authenticate()   │
│       ──► rbac() ──► auditLog() ──► controller             │
│                                                             │
│   Background Workers (always running):                      │
│   threatDetectionWorker  [every 60s]                        │
│   reportGeneratorWorker  [every 24h]                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ Prisma ORM
┌──────────────────────────▼──────────────────────────────────┐
│                     PostgreSQL :5432                        │
│   Tables: User, Role, Permission, InfrastructureAsset,      │
│           AuditLog, ThreatAlert, SecurityReport             │
└─────────────────────────────────────────────────────────────┘
```

---

## Request Lifecycle (How Every API Call Works)

```
Incoming Request
      │
      ▼
┌─────────────┐
│  helmet()   │  Sets security headers (XSS, HSTS, etc.)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   cors()    │  Only allows CORS_ORIGIN from .env
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ rateLimit()  │  auth:5/min  emergency:10/min  api:100/min
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│ authenticate()  │  Verifies JWT → attaches user+role+permissions
└──────┬──────────┘
       │
       ├──── No token? ──► 401 Unauthorized (logged)
       │
       ▼
┌──────────────────────────────┐
│ rbac() + dynamicPermission() │  Checks required permission
│                              │  Also checks time-based rules
└──────┬───────────────────────┘
       │
       ├──── No permission? ──► 403 Forbidden (logged with reason)
       │
       ▼
┌──────────────┐
│ auditLog()   │  Captures: userId, role, endpoint, IP,
│              │  userAgent, beforeState (for mutations)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ controller   │  Executes the actual business logic
└──────┬───────┘
       │
       ▼
┌────────────────────────┐
│ threatDetection(async) │  Analyzes the log against threat rules
│                        │  Runs AFTER response is sent
└────────────────────────┘
```

---

## User Roles & Permissions

All roles and permissions are **stored in the database** and seeded from `prisma/seed.ts`. Nothing is hardcoded in application logic.

```
PERMISSIONS
───────────────────────────────────────────────────
users:manage          → Create, edit, deactivate users
infrastructure:view   → Read infrastructure assets
infrastructure:manage → Create, edit, delete assets
infrastructure:control→ Change asset operational status
audit:view            → Read audit logs and reports
emergency:override    → Execute emergency commands
reports:view          → View generated security reports


ROLES & THEIR PERMISSIONS
───────────────────────────────────────────────────
SUPER_ADMIN      all 7 permissions
                 └─ Full system control

TRAFFIC_ADMIN    infrastructure:view
                 infrastructure:manage
                 infrastructure:control
                 audit:view
                 └─ Manages road & traffic assets

MAINTENANCE      infrastructure:view only
                 + write access 09:00–17:00 (time-gated)
                 └─ Field operators, view-only after hours

PUBLIC_SAFETY    infrastructure:view
                 infrastructure:control
                 emergency:override
                 └─ Can trigger emergency commands

AUDITOR          infrastructure:view
                 audit:view
                 reports:view
                 └─ Compliance — read everything, change nothing
```

---

## The 3 Unique Enhancements

These go beyond basic RBAC and directly address the problem statement with full automation.

### 1. Automated Threat Detection Engine

Rules are defined in `config/threat-rules.json` — **not in code**.

```json
{
  "rules": [
    {
      "id": "BRUTE_FORCE",
      "condition": { "action": "LOGIN_FAILED", "threshold": 5, "windowMinutes": 2 },
      "response": "AUTO_LOCK_USER"
    },
    {
      "id": "REPEATED_FORBIDDEN",
      "condition": { "success": false, "threshold": 10, "windowMinutes": 5 },
      "response": "ALERT_SUPER_ADMIN"
    },
    {
      "id": "AFTER_HOURS_EMERGENCY",
      "condition": { "action": "EMERGENCY_OVERRIDE", "outsideHours": { "start": 9, "end": 17 } },
      "response": "FLAG_AND_ALERT"
    }
  ]
}
```

`threatDetectionWorker.ts` runs every **60 seconds**, scans audit logs, and:
- Auto-locks user accounts on brute force → no human intervention needed
- Creates `ThreatAlert` DB records for admin review
- Flags suspicious audit entries with `isFlagged: true`
- Shows live red alert banner on the frontend dashboard

**Add a new threat rule = edit the JSON file. No code changes.**

---

### 2. Dynamic Permission Engine (Time-Based + District-Based)

Rules are defined in `config/access-policy.json` — **not in code**.

```json
{
  "timeBasedRules": [
    {
      "role": "MAINTENANCE",
      "writeAccess": { "startHour": 9, "endHour": 17 },
      "outsideHoursPermissions": ["infrastructure:view"]
    }
  ],
  "districtRules": [
    {
      "role": "MAINTENANCE",
      "restrictToDistrict": true
    }
  ]
}
```

`dynamicPermissionService.ts` is called inside every `rbac()` middleware check:
- MAINTENANCE role has write access **only 9am–5pm**
- Outside those hours → automatically downgraded to read-only
- Users with a `district` field only see assets in their district
- Every denial logs the **reason** ("denied: outside working hours")

**Change working hours = edit the JSON file. No code changes.**

---

### 3. Automated Daily Security Reports

`reportGeneratorWorker.ts` runs every **24 hours automatically**:
- Pulls last 24h of audit data from DB
- Groups by: total requests, failed attempts, emergency overrides, flagged events, top assets, most active users
- Saves a `SecurityReport` record in the database
- AUDITOR and SUPER_ADMIN see these on the `/security-reports` page
- Can also be triggered manually via `POST /api/reports/generate`

This directly fulfills the **"review purposes"** requirement of the problem statement — automatically, with no manual steps.

---

## Demo Credentials

All passwords: `password123`

| Role | Email | What to Demo |
|---|---|---|
| `SUPER_ADMIN` | super_admin@test.com | User management, resolve threat alerts, generate report |
| `TRAFFIC_ADMIN` | traffic_admin@test.com | Full CRUD on infrastructure assets |
| `MAINTENANCE` | maintenance@test.com | View-only — edit buttons are hidden |
| `PUBLIC_SAFETY` | public_safety@test.com | Emergency override with password re-confirm |
| `AUDITOR` | auditor@test.com | Audit logs, before/after diffs, security reports |

---

## 5-Minute Judge Demo Script

```
STEP 1 — SETUP (30s)
docker-compose up
Open http://localhost:3000

STEP 2 — ROLE-BASED ACCESS (60s)
Login as TRAFFIC_ADMIN
→ Create a new infrastructure asset
→ Edit it, change status
→ Delete it
→ Watch audit log update in real time

STEP 3 — ACCESS RESTRICTION IN ACTION (60s)
Login as MAINTENANCE
→ Notice: Edit and Delete buttons are completely hidden
→ Go to Attack Simulator page
→ Select Role: MAINTENANCE, Action: Delete Infrastructure
→ Click "Simulate Attack"
→ See: 403 Forbidden JSON response (real API call)
→ Click link to Audit Logs
→ See the blocked attempt logged with denied reason

STEP 4 — EMERGENCY OVERRIDE (60s)
Login as PUBLIC_SAFETY
→ Click red Emergency Override button
→ Re-confirm password in modal
→ Select an asset, select action: RESET
→ Submit
→ See: audit log entry with isEmergency=true flagged

STEP 5 — FULL AUDIT TRAIL (30s)
Login as AUDITOR
→ Go to Audit Logs
→ Filter by isEmergency=true — see the override from Step 4
→ Click row to expand — see full before/after state JSON
→ Go to Security Reports — see auto-generated daily report
```

---

## API Endpoints

### Authentication
```
POST   /api/auth/login              Public
```

### Infrastructure (CRUD)
```
GET    /api/infrastructure          infrastructure:view
POST   /api/infrastructure          infrastructure:manage
PUT    /api/infrastructure/:id      infrastructure:manage
DELETE /api/infrastructure/:id      infrastructure:manage
```

### Emergency
```
POST   /api/emergency/override      emergency:override
                                    (password re-verification required)
```

### Users
```
GET    /api/users                   users:manage
POST   /api/users                   users:manage
PUT    /api/users/:id/role          users:manage
DELETE /api/users/:id               users:manage (soft delete)
```

### Audit & Monitoring
```
GET    /api/audit-logs              audit:view
       ?userId=&action=&startDate=&endDate=&isEmergency=&isFlagged=&page=&limit=

GET    /api/threat-alerts           audit:view
PUT    /api/threat-alerts/:id/resolve   users:manage

GET    /api/reports                 reports:view
POST   /api/reports/generate        users:manage
```

---

## Security Features

| # | Feature | Implementation |
|---|---|---|
| 1 | JWT Authentication | 24h expiry, userId + role + permissions in payload |
| 2 | Password Hashing | bcrypt, 10 rounds |
| 3 | Role-Based Access Control | Every route declares required permission |
| 4 | Dynamic Permissions | Time-based + district rules from JSON config |
| 5 | Tiered Rate Limiting | auth:5/min · emergency:10/min · api:100/min |
| 6 | Security Headers | helmet.js on all responses |
| 7 | Input Validation | Zod schemas on all request bodies |
| 8 | Full Audit Logging | Every request: user, role, IP, action, before/after state |
| 9 | Automated Threat Detection | Background worker, rules-driven, auto-locks users |
| 10 | Emergency Re-verification | Password re-checked with bcrypt before override executes |
| 11 | Soft Delete | Users deactivated with isActive=false, never hard deleted |
| 12 | Auto Security Reports | Daily worker, zero manual steps |

---

## File Structure

```
urban-shield/
├── docker-compose.yml
├── .env.example
├── demo.sh                          ← curl-based demo script
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh                ← migrate deploy → seed → start
│   ├── prisma/
│   │   ├── schema.prisma            ← all DB models
│   │   └── seed.ts                  ← 5 users + 20 assets
│   ├── config/
│   │   ├── threat-rules.json        ← threat detection rules (no hardcoding)
│   │   └── access-policy.json       ← time + district rules (no hardcoding)
│   └── src/
│       ├── middleware/
│       │   ├── auth.ts              ← JWT verification
│       │   ├── rbac.ts              ← permission checking
│       │   ├── rateLimit.ts         ← tiered limits
│       │   └── audit.ts             ← auto-logging every request
│       ├── services/
│       │   ├── threatDetectionService.ts
│       │   ├── dynamicPermissionService.ts
│       │   └── reportService.ts
│       ├── workers/
│       │   ├── threatDetectionWorker.ts   ← runs every 60s
│       │   └── reportGeneratorWorker.ts   ← runs every 24h
│       └── routes/
│           ├── auth.ts
│           ├── infrastructure.ts
│           ├── emergency.ts
│           ├── users.ts
│           └── audit.ts
│
└── frontend/
    └── src/
        ├── components/
        │   ├── ThreatAlertBanner.tsx    ← live polling every 30s
        │   └── PermissionGate.tsx       ← hides UI based on permissions
        └── pages/
            ├── Dashboard.tsx
            ├── Infrastructure.tsx
            ├── UserManagement.tsx
            ├── AuditLogs.tsx
            ├── AttackSimulator.tsx      ← real 403 demo for judges
            └── SecurityReports.tsx
```

---

## One Command Setup

```bash
# 1. Clone and configure
git clone <repo-url>
cd urban-shield
cp .env.example .env

# 2. Start everything
docker-compose up

# 3. What happens automatically:
#    postgres starts with health check
#    backend waits for postgres to be healthy
#    prisma migrate deploy runs automatically
#    prisma db seed runs automatically (creates all users + assets)
#    frontend starts on :3000
#    backend starts on :3001
#    both background workers start
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://urbanshield:password@postgres:5432/urbanshield
JWT_SECRET=change-this-to-a-random-256bit-secret
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
VITE_API_URL=http://localhost:3001/api
POSTGRES_USER=urbanshield
POSTGRES_PASSWORD=password
POSTGRES_DB=urbanshield
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js · Express · TypeScript |
| Database | PostgreSQL 15 · Prisma ORM |
| Auth | JWT (jsonwebtoken) · bcrypt |
| Security | helmet.js · cors · express-rate-limit · Zod |
| Frontend | React · TypeScript · Vite · TailwindCSS |
| DevOps | Docker · docker-compose |

---

*Built for the Secure Access & API Protection for Urban Systems hackathon challenge.*
