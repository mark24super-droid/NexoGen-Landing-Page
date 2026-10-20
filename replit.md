# NexoGen

NexoGen is a visual business landing-page builder. The current Phase 1 is a local-first demo: users can start from a template, edit and reorder sections, save drafts in the browser, and export HTML or JSON. AI generation, account-based storage, and hosting are not connected.

## Run & Operate

- Use the Replit Run button / managed workflow `artifacts/nexogen: web` to run NexoGen at `/`. The workflow supplies `PORT` and `BASE_PATH`.
- `pnpm install --frozen-lockfile` — install the existing workspace dependencies
- `pnpm --filter @workspace/nexogen run typecheck` — check NexoGen's TypeScript
- `PORT=24942 BASE_PATH=/ pnpm --filter @workspace/nexogen run build` — build NexoGen
- For manual development outside the managed workflow: `PORT=24942 BASE_PATH=/ pnpm --filter @workspace/nexogen run dev`
- `pnpm --filter @workspace/api-server run dev` — optional API scaffold, not needed by the current demo
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- NexoGen's current local-first demo requires no secrets or external services. `DATABASE_URL` is needed only if using the separate database/API scaffold.

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/nexogen/src/App.tsx` — NexoGen routes, templates, structured page model, local project management, editor, and exports
- `artifacts/nexogen/src/index.css` — editor shell, responsive layouts, and customer-page preview styles
- `artifacts/api-server/` — shared API service; NexoGen's current Phase 1 does not call it
- `lib/api-spec/openapi.yaml` — shared API contract source of truth

## Architecture decisions

- Starter projects use validated structured data and approved React sections; do not execute generated JavaScript.
- Phase 1 stores drafts in browser local storage and labels that limitation in the interface.
- HTML and JSON are client-side exports. Publishing is intentionally a setup-needed state until a real host is connected.
- Demo templates are not AI-generated. Keep AI generation and hosting claims explicit until those services are implemented.

## Product

The longer-term product goal is to let business owners describe a landing page, generate a structured first draft with AI, edit it visually, and publish or export it without writing code.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Local projects exist only in the browser that created them and may be removed when browser storage is cleared.
- The API server and database scaffold exist in the workspace but are not part of the NexoGen Phase 1 project flow.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
