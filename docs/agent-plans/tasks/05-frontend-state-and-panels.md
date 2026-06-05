# Task 05: Frontend State And Panels

## Objective

Implement the frontend WebSocket state layer and the three MVP panels: controls, cluster state, and event log.

## Prerequisites

- Task 04 is complete or backend emits compatible typed events.
- Shared protocol types are stable.
- Frontend can connect to backend.

## Scope

- Build frontend global state.
- Process snapshots and server events.
- Send client commands.
- Render control panel.
- Render cluster state panel.
- Render event log panel.
- Add reconnect handling.

## Out of Scope

- WebGL scene.
- Message particle animation.
- Complex responsive polish.

## Implementation Steps

1. Add Zustand store for cluster snapshot, event log, active messages, connection status, selected node, and UI state.
2. Implement typed WebSocket client with connect, disconnect, reconnect, send command, and event dispatch.
3. Handle `snapshot`, `node_updated`, `message_sent`, `message_delivered`, `leader_changed`, `event_log`, and `error`.
4. Add `ControlPanel` with start, pause, reset, kill selected node, restore selected node, create partition, heal partition, and latency slider.
5. Add `ClusterStatePanel` showing current leader, node list, role, status, known leader, last heartbeat, and selected node details.
6. Add `EventLogPanel` with timestamp, event type, source, target, and message.
7. Add disabled states for controls when disconnected or no node is selected.
8. Keep UI text concise and operational.

## Expected Files

- `apps/frontend/src/app/store.ts`
- `apps/frontend/src/api/websocketClient.ts`
- `apps/frontend/src/domain/types.ts`
- `apps/frontend/src/domain/selectors.ts`
- `apps/frontend/src/panels/ControlPanel.tsx`
- `apps/frontend/src/panels/ClusterStatePanel.tsx`
- `apps/frontend/src/panels/EventLogPanel.tsx`
- `apps/frontend/src/app/App.tsx`

## Verification

Run:

```bash
pnpm --filter frontend test
pnpm build
```

Manual check:

- Start backend and frontend.
- Confirm connection status updates.
- Confirm panels update from live backend events.
- Use controls to start, pause, reset, kill, restore, partition, heal, and set latency.

## Definition of Done

- Frontend state is derived from backend events.
- Commands are sent using shared protocol types.
- Panels expose all MVP controls and state.
- Event log is readable and bounded so it does not grow without limit.
- Reconnect attempts are visible through connection status.

## Handoff Notes

The WebGL task should use the store and selectors from this task instead of opening its own WebSocket connection.
