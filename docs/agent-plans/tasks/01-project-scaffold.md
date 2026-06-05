# Task 01: Project Scaffold

## Objective

Create the monorepo foundation for ClusterLens with a runnable frontend, runnable backend, shared package placeholder, linting/build scripts, and a WebSocket smoke path.

## Prerequisites

- Repository contains `clusterlens-mvp-roadmap.md`.
- No application scaffold is assumed.

## Scope

- Create monorepo structure.
- Configure TypeScript for frontend, backend, and shared package.
- Add basic frontend and backend apps.
- Add WebSocket connection from frontend to backend.
- Render connection status and a test cluster snapshot in the frontend.

## Out of Scope

- Real simulation engine.
- WebGL rendering.
- Bully Algorithm.
- Failure controls.
- Full protocol validation.

## Implementation Steps

1. Initialize package metadata with workspace support.
2. Add `apps/frontend`, `apps/backend`, and `packages/shared`.
3. Configure Vite React TypeScript frontend.
4. Configure Node TypeScript backend with Fastify and `ws`.
5. Add root scripts for install, dev, build, typecheck, test, and lint.
6. Add a backend WebSocket endpoint that accepts connections and sends a static `snapshot`.
7. Add a frontend WebSocket client that connects to the backend URL from config.
8. Render connection status and a compact JSON or list view of the static snapshot.
9. Add a basic README section with current run commands.

## Expected Files

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `apps/frontend/package.json`
- `apps/frontend/src/main.tsx`
- `apps/frontend/src/app/App.tsx`
- `apps/frontend/src/api/websocketClient.ts`
- `apps/backend/package.json`
- `apps/backend/src/index.ts`
- `apps/backend/src/server/httpServer.ts`
- `apps/backend/src/server/websocketServer.ts`
- `packages/shared/package.json`
- `packages/shared/src/index.ts`

## Verification

Run:

```bash
pnpm install
pnpm build
pnpm --filter backend dev
pnpm --filter frontend dev
```

Manual check:

- Open the frontend in a browser.
- Confirm connection status becomes connected.
- Confirm static cluster snapshot is displayed.

## Definition of Done

- Root workspace installs cleanly.
- Frontend and backend start independently.
- Frontend connects to backend WebSocket.
- Backend sends a static snapshot.
- No simulation behavior is faked beyond the explicit smoke snapshot.

## Handoff Notes

The next agent will replace or formalize the static protocol through shared types. Keep the smoke snapshot simple and easy to delete or migrate.
