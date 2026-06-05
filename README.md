# ClusterLens

ClusterLens is an MVP scaffold for a distributed systems visualization tool.

## Current Run Commands

Install dependencies:

```bash
pnpm install
```

Install dependencies from the lockfile in CI-style environments:

```bash
pnpm bootstrap
```

Build every workspace package:

```bash
pnpm build
```

Run the backend:

```bash
pnpm --filter backend dev
```

Run the frontend:

```bash
pnpm --filter frontend dev
```

Run quality checks:

```bash
pnpm typecheck
pnpm test
pnpm lint
```
