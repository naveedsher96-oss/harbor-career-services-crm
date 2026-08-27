# Harbor / Career Services CRM

A private career-services workspace for managing healthcare employers, graduates, job opportunities, outreach follow-ups, filtered reports, and safe CSV imports.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/career-services-crm/src/pages/` — dashboard, employer, graduate, job bank, settings, and report screens.
- `artifacts/career-services-crm/src/components/` — shared workspace shell, page primitives, and CSV import dialog.
- `artifacts/career-services-crm/src/lib/csv.ts` — CSV parsing, template, and browser download helpers.
- `artifacts/api-server/src/routes/career.ts` — career-services API routes and demo data seeding.
- `lib/db/src/schema/` — PostgreSQL schema for programs, employers, graduates, jobs, relationships, and activity.
- `lib/api-spec/openapi.yaml` — source-of-truth API contract.
- `artifacts/career-services-crm/src/index.css` — shared Harbor workspace theme.

## Architecture decisions

- The app is CRM-first: jobs live in the same system as employer relationships rather than being a public job board.
- Employers, jobs, and graduates connect to programs through IDs so one record can serve multiple healthcare programs without duplication.
- Graduate visibility is explicit (`opted-in`, `needs-review`, or `private`) and job matching only returns opted-in graduates.
- Reports are downloaded client-side from the currently filtered records; CSV imports use name/email duplicate checks before saving.

## Product

The workspace gives one career-services manager a single place to see relationship health, maintain employer and graduate directories, keep a program-aware job bank, review follow-ups, export filtered employer or graduate reports, and import records from CSV templates.

## User preferences

- Keep the first version focused on a private, single-user workflow; Outlook connection and broader access can be added after the core workflow is proven.

## Gotchas

- CSV imports expect lowercase header matching, with templates available from each import dialog.
- The generated API validation layer uses Zod 4 syntax; keep the workspace Zod catalog aligned with the generator.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
