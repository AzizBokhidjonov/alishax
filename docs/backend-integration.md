# Backend integration and repository boundaries

Keep the applications as separate repositories:

```text
D:\Projects\
  garten-management\   NestJS API, Prisma, migrations, backend deployment
  alishax\             TanStack frontend, UI, API adapters, frontend deployment
```

The frontend communicates with the backend over HTTP. Do not nest either
repository inside the other, import backend source code, or share environment
files or application dependencies. Each repository owns its Git history,
lockfile, CI and deployment artifacts.

## Frontend structure

- `src/api/endpoints/`: request URLs, parameters, methods and idempotency options.
- `src/api/adapters/`: backend response types and conversion to UI models.
- `src/api/types/`: UI-facing models and request DTOs, divided by domain.
- `src/api/openapi.json`: a public API contract snapshot, not backend application code.
- `src/features/`: screens and query hooks consuming those models.
- `tests/`: synthetic response fixtures, endpoint integration checks and focused UI rendering tests.
- `Dockerfile` and `.github/workflows/ci.yml`: independent frontend build and validation.

The contract changes were checked against backend commit
`a15ce11b47aff657c7f45aa86e3e60ac179d7c37` and frontend baseline
`900495f1a43f2fde4dfd6f88cc920c406c9abd38`.

## Development

Install dependencies in the frontend checkout with `npm ci`. Copy
`.env.example` to `.env` and set:

```dotenv
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=http://127.0.0.1:3000
```

Run the backend separately, then `npm run dev` here (port 8080).
For public landing content, configure `VITE_LANDING_TENANT_CODE` for the intended
tenant. Never place backend secrets in `VITE_*` variables: they are public.

`VITE_API_PROXY_TARGET` must be loaded when Vite reads its configuration; both
shell environment variables and the mode-specific frontend env file are supported.
The relative API URL preserves the frontend's same-origin refresh-cookie flow.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
# Or all four:
npm run check
```

The tests run with Node's test runner and the installed TypeScript compiler.
They do not require a running backend, database, or copies of backend source.
Fixtures preserve the backend's response names, including monetary tiyin strings,
nested attendance groups, paymentAllocation and committed calculationTrace.

Regression coverage includes debt/reminder amounts, missing required monetary
fields, large integer sums, negative balances, pagination metadata, allocations
and advances, multiple billing lines, saved-run periods, attendance dates,
guardian pickup field names, and Telegram invitation display.

## Independent production build

Build this repository directly:

```sh
docker build -t alishax-frontend \
  --build-arg VITE_API_BASE_URL=/api/v1 \
  --build-arg VITE_API_PROXY_TARGET=https://api.alishaxkids.uz .
docker run --rm -p 8080:3000 alishax-frontend
```

The API/proxy and landing settings are build-time values. Rebuild the image when
they change. Configure HTTPS and the public hostname in the hosting environment.

This build does not require patches from the backend repository. The existing
backend script that applies `0001-api-contracts.patch` to upstream main still
needs a separate migration before it can deploy this revision; do not silently
delete that patch or route this build through it. No backend deployment files
are changed by these frontend fixes.

## Local verification — 2026-10-23

The permanent checkout is `D:\Projects\alishax`, on
`codex/backend-compatibility`, with the original upstream Git history and remote.
The recovered fixes were applied to upstream commit `900495f`.

- Fresh `npm ci` and `npm run check` passed on Windows (Node 24.11.1, npm 9.8.1).
- TypeScript, ESLint with zero warnings, all 22 regression tests and the production build passed.
- The independent Linux Docker image built successfully, including its own clean install and complete checks (Node 24, npm 11.19.1).
- The running image returned HTTP 200 for `/kirish`, rendered the login/password form, and served its JavaScript, CSS and image assets.
- Missing platform-specific lockfile entries were restored without changing existing locked dependency resolutions.
- The backend repository retained its preexisting changes; no backend source or deployment files were modified.

Local diagnostic logs are in the ignored `logs/` directory. These checks did not
use production credentials or exercise authenticated backend/database workflows.

## Changes and limits

Remaining deployment-patch fixes were preserved: permission-aware controls,
bootstrap branch/group lookups, supported notification channels, safe unbound
uploads, pickup verification guards and permission cache invalidation. Existing
medical normalization and tagged pickup recipients were retained.

The API boundary now maps debt balances and totals, payment allocations,
billing-run metadata, explanation arrays, and attendance dates/current groups.
The Telegram panel consumes `deepLink`. Form schema types match the installed
Zod resolver. Required debt fields are validated so a contract failure cannot
silently become a displayed zero.

A successful local build and synthetic tests are not production acceptance.
Verify login/refresh/logout, permissions and tenant boundaries, real database
writes, billing/payment operations, file/export workflows, and Telegram binding
in a test environment before production deployment.
