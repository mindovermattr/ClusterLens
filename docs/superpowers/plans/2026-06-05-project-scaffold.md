# Project Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the initial ClusterLens monorepo scaffold with a runnable TypeScript backend, runnable Vite React frontend, shared package, and WebSocket smoke path.

**Architecture:** Use a pnpm workspace with `apps/backend`, `apps/frontend`, and `packages/shared`. The backend exposes HTTP health and WebSocket endpoints; the frontend connects to the WebSocket and renders connection status plus the static smoke snapshot. The shared package holds temporary scaffold-level types that Task 02 will replace with the formal protocol.

**Tech Stack:** pnpm, TypeScript, Vite, React, Fastify, `@fastify/websocket`, Vitest.

---

## File Structure

Create these files:

```txt
package.json
pnpm-workspace.yaml
tsconfig.base.json
README.md
packages/shared/package.json
packages/shared/tsconfig.json
packages/shared/src/index.ts
apps/backend/package.json
apps/backend/tsconfig.json
apps/backend/src/index.ts
apps/backend/src/server/httpServer.ts
apps/backend/src/server/websocketServer.ts
apps/backend/src/smokeSnapshot.ts
apps/backend/src/index.test.ts
apps/frontend/package.json
apps/frontend/index.html
apps/frontend/tsconfig.json
apps/frontend/vite.config.ts
apps/frontend/src/main.tsx
apps/frontend/src/app/App.tsx
apps/frontend/src/app/App.test.tsx
apps/frontend/src/api/websocketClient.ts
apps/frontend/src/styles.css
```

Responsibilities:

- Root files define workspace scripts and shared TypeScript defaults.
- `packages/shared` exports scaffold snapshot/event types.
- `apps/backend/src/server/httpServer.ts` creates the Fastify app.
- `apps/backend/src/server/websocketServer.ts` registers the WebSocket smoke endpoint.
- `apps/backend/src/smokeSnapshot.ts` owns the static cluster payload.
- `apps/frontend/src/api/websocketClient.ts` owns browser WebSocket lifecycle.
- `apps/frontend/src/app/App.tsx` renders connection state and snapshot data.

---

### Task 1: Root Workspace Metadata

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`

- [ ] **Step 1: Create root `package.json`**

Write:

```json
{
  "name": "clusterlens",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pnpm --parallel --filter backend --filter frontend dev",
    "build": "pnpm --recursive build",
    "typecheck": "pnpm --recursive typecheck",
    "test": "pnpm --recursive test",
    "lint": "pnpm --recursive lint"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "typescript": "^5.5.3",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

Write:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create `tsconfig.base.json`**

Write:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true
  }
}
```

- [ ] **Step 4: Run install**

Run:

```bash
pnpm install
```

Expected: lockfile is created and install exits with code 0.

- [ ] **Step 5: Commit root metadata**

Run:

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json pnpm-lock.yaml
git commit -m "build: initialize workspace"
```

---

### Task 2: Shared Package

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create `packages/shared/package.json`**

Write:

```json
{
  "name": "@clusterlens/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run --passWithNoTests",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.5.3",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create `packages/shared/tsconfig.json`**

Write:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/shared/src/index.ts`**

Write:

```ts
export type NodeRole = 'follower' | 'candidate' | 'leader';
export type NodeStatus = 'alive' | 'down';

export type NodeSnapshot = {
  id: string;
  role: NodeRole;
  status: NodeStatus;
};

export type ClusterSnapshot = {
  timeMs: number;
  running: boolean;
  leaderId: string | null;
  nodes: NodeSnapshot[];
};

export type ServerEvent = {
  type: 'snapshot';
  state: ClusterSnapshot;
};
```

- [ ] **Step 4: Build shared package**

Run:

```bash
pnpm --filter @clusterlens/shared build
```

Expected: command passes and `packages/shared/dist/index.js` exists.

- [ ] **Step 5: Commit shared package**

Run:

```bash
git add packages/shared
git commit -m "build: add shared workspace package"
```

---

### Task 3: Backend Smoke Server

**Files:**
- Create: `apps/backend/package.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/backend/src/smokeSnapshot.ts`
- Create: `apps/backend/src/server/httpServer.ts`
- Create: `apps/backend/src/server/websocketServer.ts`
- Create: `apps/backend/src/index.ts`
- Create: `apps/backend/src/index.test.ts`

- [ ] **Step 1: Create `apps/backend/package.json`**

Write:

```json
{
  "name": "backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@clusterlens/shared": "workspace:*",
    "@fastify/websocket": "^10.0.1",
    "fastify": "^4.28.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "tsx": "^4.16.2",
    "typescript": "^5.5.3",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create `apps/backend/tsconfig.json`**

Write:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "moduleResolution": "Bundler"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `apps/backend/src/smokeSnapshot.ts`**

Write:

```ts
import type { ClusterSnapshot } from '@clusterlens/shared';

export const smokeSnapshot: ClusterSnapshot = {
  timeMs: 0,
  running: false,
  leaderId: 'node-5',
  nodes: [
    { id: 'node-1', role: 'follower', status: 'alive' },
    { id: 'node-2', role: 'follower', status: 'alive' },
    { id: 'node-3', role: 'follower', status: 'alive' },
    { id: 'node-4', role: 'follower', status: 'alive' },
    { id: 'node-5', role: 'leader', status: 'alive' }
  ]
};
```

- [ ] **Step 4: Create `apps/backend/src/server/websocketServer.ts`**

Write:

```ts
import type { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import type { ServerEvent } from '@clusterlens/shared';
import { smokeSnapshot } from '../smokeSnapshot.js';

export async function registerWebsocketServer(app: FastifyInstance): Promise<void> {
  await app.register(websocket);

  app.get('/ws', { websocket: true }, (connection) => {
    const event: ServerEvent = {
      type: 'snapshot',
      state: smokeSnapshot
    };

    connection.socket.send(JSON.stringify(event));
  });
}
```

- [ ] **Step 5: Create `apps/backend/src/server/httpServer.ts`**

Write:

```ts
import Fastify from 'fastify';
import { registerWebsocketServer } from './websocketServer.js';

export async function createHttpServer() {
  const app = Fastify({
    logger: true
  });

  app.get('/health', async () => ({ status: 'ok' }));

  await registerWebsocketServer(app);

  return app;
}
```

- [ ] **Step 6: Create `apps/backend/src/index.ts`**

Write:

```ts
import { createHttpServer } from './server/httpServer.js';

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '127.0.0.1';

const app = await createHttpServer();

await app.listen({ port, host });
```

- [ ] **Step 7: Create backend smoke test**

Create `apps/backend/src/index.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { smokeSnapshot } from './smokeSnapshot.js';

describe('smokeSnapshot', () => {
  it('contains a 5 node cluster with a leader', () => {
    expect(smokeSnapshot.nodes).toHaveLength(5);
    expect(smokeSnapshot.leaderId).toBe('node-5');
    expect(smokeSnapshot.nodes.find((node) => node.role === 'leader')?.id).toBe('node-5');
  });
});
```

- [ ] **Step 8: Verify backend**

Run:

```bash
pnpm --filter backend test
pnpm --filter backend build
```

Expected: both commands pass.

- [ ] **Step 9: Commit backend smoke server**

Run:

```bash
git add apps/backend
git commit -m "build: add backend smoke server"
```

---

### Task 4: Frontend Smoke App

**Files:**
- Create: `apps/frontend/package.json`
- Create: `apps/frontend/index.html`
- Create: `apps/frontend/tsconfig.json`
- Create: `apps/frontend/vite.config.ts`
- Create: `apps/frontend/src/main.tsx`
- Create: `apps/frontend/src/api/websocketClient.ts`
- Create: `apps/frontend/src/app/App.tsx`
- Create: `apps/frontend/src/app/App.test.tsx`
- Create: `apps/frontend/src/styles.css`

- [ ] **Step 1: Create `apps/frontend/package.json`**

Write:

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1 --port 5173",
    "build": "tsc -p tsconfig.json && vite build",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run --environment jsdom",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@clusterlens/shared": "workspace:*",
    "@vitejs/plugin-react": "^4.3.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "vite": "^5.3.3"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/react": "^15.0.7",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "jsdom": "^24.1.0",
    "typescript": "^5.5.3",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create `apps/frontend/tsconfig.json`**

Write:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 3: Create `apps/frontend/vite.config.ts`**

Write:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()]
});
```

- [ ] **Step 4: Create `apps/frontend/index.html`**

Write:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ClusterLens</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `apps/frontend/src/api/websocketClient.ts`**

Write:

```ts
import type { ServerEvent } from '@clusterlens/shared';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export type WebsocketClientHandlers = {
  onStatusChange(status: ConnectionStatus): void;
  onEvent(event: ServerEvent): void;
  onError(error: Error): void;
};

export function connectWebsocket(
  url: string,
  handlers: WebsocketClientHandlers
): () => void {
  handlers.onStatusChange('connecting');

  const socket = new WebSocket(url);

  socket.addEventListener('open', () => {
    handlers.onStatusChange('connected');
  });

  socket.addEventListener('close', () => {
    handlers.onStatusChange('disconnected');
  });

  socket.addEventListener('error', () => {
    handlers.onError(new Error('WebSocket connection failed'));
  });

  socket.addEventListener('message', (message) => {
    try {
      handlers.onEvent(JSON.parse(String(message.data)) as ServerEvent);
    } catch (error) {
      handlers.onError(error instanceof Error ? error : new Error('Invalid WebSocket event'));
    }
  });

  return () => {
    socket.close();
  };
}
```

- [ ] **Step 6: Create `apps/frontend/src/app/App.tsx`**

Write:

```tsx
import { useEffect, useMemo, useState } from 'react';
import type { ClusterSnapshot } from '@clusterlens/shared';
import { connectWebsocket, type ConnectionStatus } from '../api/websocketClient';

const defaultWebsocketUrl = 'ws://127.0.0.1:3001/ws';

export function App() {
  const websocketUrl = useMemo(
    () => import.meta.env.VITE_WS_URL ?? defaultWebsocketUrl,
    []
  );
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [snapshot, setSnapshot] = useState<ClusterSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return connectWebsocket(websocketUrl, {
      onStatusChange: setStatus,
      onEvent: (event) => {
        if (event.type === 'snapshot') {
          setSnapshot(event.state);
        }
      },
      onError: (nextError) => {
        setError(nextError.message);
      }
    });
  }, [websocketUrl]);

  return (
    <main className="app-shell">
      <section className="panel">
        <p className="eyebrow">ClusterLens</p>
        <h1>Distributed System Visualizer</h1>
        <dl className="status-list">
          <div>
            <dt>Connection</dt>
            <dd>{status}</dd>
          </div>
          <div>
            <dt>Leader</dt>
            <dd>{snapshot?.leaderId ?? 'none'}</dd>
          </div>
          <div>
            <dt>Nodes</dt>
            <dd>{snapshot?.nodes.length ?? 0}</dd>
          </div>
        </dl>
        {error ? <p role="alert" className="error">{error}</p> : null}
      </section>

      <section className="panel">
        <h2>Smoke Snapshot</h2>
        <pre>{snapshot ? JSON.stringify(snapshot, null, 2) : 'Waiting for backend snapshot...'}</pre>
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Create `apps/frontend/src/main.tsx`**

Write:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 8: Create `apps/frontend/src/styles.css`**

Write:

```css
:root {
  color: #172026;
  background: #eef3f6;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

body {
  margin: 0;
}

.app-shell {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 16px;
  min-height: 100vh;
  padding: 24px;
  box-sizing: border-box;
}

.panel {
  background: #ffffff;
  border: 1px solid #d5dde3;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 10px 30px rgb(23 32 38 / 8%);
}

.eyebrow {
  margin: 0 0 8px;
  color: #48606f;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0 0 16px;
}

.status-list {
  display: grid;
  gap: 12px;
  margin: 0;
}

.status-list div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.status-list dt {
  color: #536b7a;
}

.status-list dd {
  margin: 0;
  font-weight: 700;
}

.error {
  margin: 16px 0 0;
  color: #a32929;
}

pre {
  overflow: auto;
  max-height: calc(100vh - 120px);
  margin: 0;
  padding: 16px;
  background: #172026;
  color: #f4f8fa;
  border-radius: 8px;
}

@media (max-width: 760px) {
  .app-shell {
    grid-template-columns: 1fr;
    padding: 16px;
  }
}
```

- [ ] **Step 9: Create frontend smoke test**

Create `apps/frontend/src/app/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  listeners = new Map<string, Array<(event: any) => void>>();

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  addEventListener(type: string, listener: (event: any) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  close = vi.fn();

  emit(type: string, event: any = {}) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);

describe('App', () => {
  it('renders a snapshot received from the websocket', async () => {
    render(<App />);

    const socket = MockWebSocket.instances[0]!;
    socket.emit('open');
    socket.emit('message', {
      data: JSON.stringify({
        type: 'snapshot',
        state: {
          timeMs: 0,
          running: false,
          leaderId: 'node-5',
          nodes: [{ id: 'node-5', role: 'leader', status: 'alive' }]
        }
      })
    });

    expect(await screen.findByText('connected')).toBeInTheDocument();
    expect(screen.getByText('node-5')).toBeInTheDocument();
  });
});
```

- [ ] **Step 10: Verify frontend**

Run:

```bash
pnpm install
pnpm --filter frontend test
pnpm --filter frontend build
```

Expected: both commands pass.

- [ ] **Step 11: Commit frontend smoke app**

Run:

```bash
git add apps/frontend package.json pnpm-lock.yaml
git commit -m "build: add frontend smoke app"
```

---

### Task 5: README And Full Smoke Verification

**Files:**
- Create or modify: `README.md`

- [ ] **Step 1: Create initial `README.md`**

Write:

```md
# ClusterLens

ClusterLens is a WebGL distributed-system visualizer. The current scaffold provides a TypeScript monorepo, a backend WebSocket smoke endpoint, and a frontend smoke screen that renders the initial cluster snapshot.

## Current Scaffold

- `apps/backend`: Fastify backend with `/health` and `/ws`.
- `apps/frontend`: Vite React frontend.
- `packages/shared`: shared scaffold-level TypeScript types.

## Running Locally

Install dependencies:

```bash
pnpm install
```

Start the backend:

```bash
pnpm --filter backend dev
```

Start the frontend in another terminal:

```bash
pnpm --filter frontend dev
```

Open `http://127.0.0.1:5173`.

## Verification

```bash
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```

## MVP Roadmap

The detailed MVP roadmap lives in `clusterlens-mvp-roadmap.md`.

The agent execution plan lives in `docs/agent-plans/master-plan.md`.
```

- [ ] **Step 2: Run full verification**

Run:

```bash
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```

Expected: all commands pass.

- [ ] **Step 3: Run manual smoke test**

Run backend:

```bash
pnpm --filter backend dev
```

Run frontend in another terminal:

```bash
pnpm --filter frontend dev
```

Open `http://127.0.0.1:5173`.

Expected:

- Connection status changes to `connected`.
- Leader displays as `node-5`.
- Node count displays as `5`.
- Smoke snapshot JSON is visible.

- [ ] **Step 4: Commit README**

Run:

```bash
git add README.md
git commit -m "docs: document scaffold workflow"
```

---

## Self-Review Checklist

- Spec coverage: this plan covers workspace setup, frontend, backend, shared package, scripts, WebSocket smoke event, connection status, static snapshot rendering, README, and verification.
- Scope control: this plan does not implement simulation, WebGL, Bully election, failure controls, or protocol validation beyond scaffold types.
- Type consistency: `ClusterSnapshot`, `NodeSnapshot`, and `ServerEvent` are defined once in `@clusterlens/shared` and imported by both apps.
- Commit cadence: each logical scaffold section has its own Conventional Commit.
