# Task 02: Shared Protocol

## Objective

Define the typed protocol and domain snapshots shared by frontend and backend.

## Prerequisites

- Task 01 is complete.
- Frontend and backend can import from `packages/shared`.

## Scope

- Define command, event, snapshot, node, network, and message types.
- Add Zod schemas for client commands and server events where useful.
- Make backend smoke event use shared protocol types.
- Make frontend WebSocket client parse and handle typed events.

## Out of Scope

- Real simulation logic.
- Frontend visual design beyond displaying typed data.
- Exhaustive protocol versioning.

## Implementation Steps

1. Create shared type modules for commands, events, snapshots, and algorithm concepts.
2. Define `NodeRole` as `follower | candidate | leader`.
3. Define `NodeStatus` as `alive | down`.
4. Represent partition state at the network level rather than making `partitioned` a node status. A node can be alive and partitioned from another group.
5. Define `NetworkMessageSnapshot` with `id`, `type`, `sourceNodeId`, `targetNodeId`, `sentAtMs`, `deliverAtMs`, and delivery status.
6. Define `EventLogEntry` with timestamp, event type, source, target, and human-readable message.
7. Add Zod validation for incoming client commands in the backend.
8. Add frontend event handling with exhaustive switching.
9. Keep protocol names aligned with the roadmap.

## Expected Files

- `packages/shared/src/commands.ts`
- `packages/shared/src/events.ts`
- `packages/shared/src/snapshots.ts`
- `packages/shared/src/protocol.ts`
- `packages/shared/src/index.ts`
- `apps/backend/src/protocol/clientMessages.ts`
- `apps/backend/src/protocol/serverEvents.ts`
- `apps/frontend/src/api/protocol.ts`

## Verification

Run:

```bash
pnpm build
pnpm test
```

Manual check:

- Start backend and frontend.
- Confirm frontend still receives and displays typed snapshot.
- Send an invalid command from a temporary script or browser console and confirm backend returns an `error` event instead of crashing.

## Definition of Done

- Shared package exports all MVP protocol types.
- Backend validates client commands.
- Frontend handles every server event type with exhaustive control flow.
- Static smoke snapshot conforms to `ClusterSnapshot`.

## Handoff Notes

The next backend task will build simulation models around these types. Avoid overfitting types to placeholder data.
