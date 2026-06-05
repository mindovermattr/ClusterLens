# ClusterLens MVP Agent Master Plan

Source roadmap: `clusterlens-mvp-roadmap.md`

## Goal

Build ClusterLens as a portfolio-ready MVP: a browser-based WebGL visualizer for a distributed cluster where the backend simulates leader election, network latency, node failures, and network partitions, while the frontend renders the cluster state and real-time message flow.

The MVP is complete when a user can run the app locally, see a 5-node cluster, observe a leader, kill the leader, watch a Bully election choose a new leader, create/heal a partition, adjust latency, and understand the sequence through the event log.

## Execution Model

Use sequential agent tasks. Do not start a later task until the previous task's Definition of Done is satisfied.

Recommended order:

1. `tasks/01-project-scaffold.md`
2. `tasks/02-shared-protocol.md`
3. `tasks/03-backend-simulation-core.md`
4. `tasks/04-backend-network-and-election.md`
5. `tasks/05-frontend-state-and-panels.md`
6. `tasks/06-webgl-cluster-scene.md`
7. `tasks/07-interactive-failure-controls.md`
8. `tasks/08-testing-and-quality.md`
9. `tasks/09-documentation-and-demo.md`

## Core Architecture

Use a TypeScript monorepo with separate frontend and backend apps plus a shared package for protocol and domain types.

Recommended layout:

```txt
apps/
  backend/
    src/
      index.ts
      server/
      simulation/
      algorithms/
      protocol/
      utils/
  frontend/
    src/
      main.tsx
      app/
      api/
      scene/
      panels/
      domain/
packages/
  shared/
    src/
      protocol.ts
      snapshots.ts
      commands.ts
      events.ts
docs/
  agent-plans/
```

Backend is the source of truth. Frontend must not decide algorithmic outcomes; it renders snapshots and event streams.

## MVP Technology Choices

Use these defaults unless an agent finds a concrete blocker:

- Package manager: `pnpm`
- Frontend: Vite, React, TypeScript
- WebGL: React Three Fiber with Three.js
- State: Zustand
- Styling: CSS Modules or plain CSS with a restrained app layout
- Backend: Node.js, TypeScript, Fastify, `ws`
- Validation: Zod
- Logging: pino
- Tests: Vitest for unit tests, targeted integration tests where practical

## Shared Runtime Parameters

Use these defaults in configuration:

- Node count: 5
- Tick interval: 100 ms
- Snapshot interval: 100-250 ms
- Heartbeat interval: 1000 ms
- Heartbeat timeout: 3000 ms
- Default network latency: 200 ms
- Random jitter: 0-200 ms
- Packet loss: keep at 0 for MVP, but expose a config field for future use

## Protocol Baseline

Client commands:

```ts
type ClientCommand =
  | { type: 'simulation:start' }
  | { type: 'simulation:pause' }
  | { type: 'simulation:reset'; nodeCount?: number }
  | { type: 'node:kill'; nodeId: string }
  | { type: 'node:restore'; nodeId: string }
  | { type: 'network:setLatency'; latencyMs: number }
  | { type: 'network:createPartition'; groups: string[][] }
  | { type: 'network:healPartition' };
```

Server events:

```ts
type ServerEvent =
  | { type: 'snapshot'; state: ClusterSnapshot }
  | { type: 'node_updated'; node: NodeSnapshot }
  | { type: 'message_sent'; message: NetworkMessageSnapshot }
  | { type: 'message_delivered'; messageId: string }
  | { type: 'leader_changed'; leaderId: string | null }
  | { type: 'event_log'; entry: EventLogEntry }
  | { type: 'error'; message: string };
```

## Agent Handoff Rules

Each agent must leave the repository in a runnable or clearly verifiable state.

Each task should end with:

- changed files summary
- verification commands run
- known limitations or follow-up notes
- any assumptions made

If a task changes shared types, the agent must update all direct consumers or explicitly document the downstream breakage and why it is acceptable for that task.

## Integration Gates

After task 1: frontend connects to backend and renders connection status plus a test snapshot.

After task 2: shared protocol compiles and both apps import it.

After task 3: backend simulation emits changing snapshots with stable node state.

After task 4: killing the leader triggers a Bully election and emits message/election events.

After task 5: frontend panels reflect live backend state and commands are wired.

After task 6: WebGL scene renders nodes, links, labels, roles, and animated messages.

After task 7: kill, restore, partition, heal, and latency controls work end to end.

After task 8: critical algorithm and network behavior has automated coverage.

After task 9: README explains architecture, algorithm, run commands, testing, roadmap, and limitations.

## MVP Exclusions

Do not add these during MVP tasks unless the task file is explicitly updated:

- authentication
- database persistence
- multiplayer rooms
- Kubernetes integration
- Raft log replication
- production-grade observability
- complex physics
- geographic maps
- advanced packet loss modes

## Final MVP Acceptance

The final project must satisfy these checks:

1. App runs locally using documented commands.
2. Browser shows a 5-node cluster.
3. One node becomes leader.
4. Leader sends heartbeat messages.
5. Messages are visible as animated particles.
6. Killing the leader starts an election.
7. A new leader is elected.
8. Restoring a node returns it to the cluster.
9. Network partition changes message delivery.
10. Event log explains user-visible state changes.
11. Code is split into clear modules.
12. README documents architecture and limitations.
