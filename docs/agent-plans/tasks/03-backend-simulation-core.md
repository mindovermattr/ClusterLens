# Task 03: Backend Simulation Core

## Objective

Implement the backend in-memory simulation engine, cluster model, node model, scheduler, tick loop, and periodic snapshots.

## Prerequisites

- Task 02 is complete.
- Shared protocol types compile.
- Backend can send typed server events.

## Scope

- Build simulation lifecycle: start, pause, reset.
- Build cluster and node state.
- Build deterministic tick-based time progression.
- Emit snapshots on a configured interval.
- Apply basic client commands that do not require network delivery internals.

## Out of Scope

- Bully election behavior.
- Message delivery queue.
- Network partition behavior.
- WebGL frontend.

## Implementation Steps

1. Add `SimulationEngine` with `start`, `pause`, `reset`, `tick`, and `applyCommand`.
2. Add `Cluster` that owns nodes, simulation time, current leader, and network config.
3. Add `ClusterNode` or equivalent domain model with id, status, role, last heartbeat time, known leader, and election state fields.
4. Add `Scheduler` for scheduled callbacks keyed by simulation time.
5. Initialize default cluster with 5 alive follower nodes.
6. Implement command handling for start, pause, reset, kill node, restore node, and set latency at the state level.
7. Emit `snapshot`, `node_updated`, and `event_log` events.
8. Make WebSocket connections receive the current snapshot immediately.
9. Keep all mutable simulation state on the backend.

## Expected Files

- `apps/backend/src/simulation/SimulationEngine.ts`
- `apps/backend/src/simulation/Cluster.ts`
- `apps/backend/src/simulation/Node.ts`
- `apps/backend/src/simulation/Scheduler.ts`
- `apps/backend/src/utils/logger.ts`
- `apps/backend/src/server/websocketServer.ts`

## Verification

Run:

```bash
pnpm --filter backend test
pnpm build
```

Manual check:

- Start backend and frontend.
- Press or send start/pause/reset commands if the frontend has temporary controls.
- Confirm snapshots update while running and stop changing while paused.
- Confirm killing/restoring a node changes snapshots and event log entries.

## Definition of Done

- Simulation has a stable tick loop.
- Time advances only while running.
- Reset returns to 5 alive follower nodes with no leader.
- Node kill/restore affects backend snapshots.
- Backend does not crash on invalid node ids; it emits an error event.

## Handoff Notes

The next task will add network delivery and Bully election. Keep algorithm behavior behind a future `NodeBehavior` boundary where practical.
