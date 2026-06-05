# Task 07: Interactive Failure Controls

## Objective

Make all MVP failure and network controls work end to end with clear visual and log feedback.

## Prerequisites

- Task 06 is complete.
- Backend supports kill, restore, partition, heal, and latency commands.
- Frontend panels and scene are connected to shared state.

## Scope

- Complete kill/restore selected node flow.
- Complete create/heal partition flow.
- Complete latency slider flow.
- Improve command validation and user feedback.
- Ensure event log explains the consequences.

## Out of Scope

- Scenario replay.
- Timeline debugger.
- Chaos mode.
- Advanced packet loss controls.

## Implementation Steps

1. Audit all control commands against shared protocol types.
2. Ensure kill/restore controls use selected node id and disable invalid actions.
3. For partition MVP, implement a simple 2-vs-rest partition action based on selected node or a fixed split if no selected node exists.
4. Add heal partition command.
5. Make latency slider send debounced `network:setLatency` commands.
6. Display current latency and partition state in the cluster state panel.
7. Ensure backend emits event log entries for every user command and resulting state change.
8. Ensure frontend surfaces backend `error` events without breaking the app.
9. Run a full manual QA scenario from start to partition heal.

## Expected Files

- `apps/frontend/src/panels/ControlPanel.tsx`
- `apps/frontend/src/panels/ClusterStatePanel.tsx`
- `apps/frontend/src/app/store.ts`
- `apps/backend/src/simulation/SimulationEngine.ts`
- `apps/backend/src/simulation/Network.ts`
- `packages/shared/src/commands.ts`
- `packages/shared/src/snapshots.ts`

## Verification

Run:

```bash
pnpm build
pnpm test
```

Manual QA:

1. Start simulation.
2. Wait for leader.
3. Kill leader.
4. Confirm election starts.
5. Confirm new leader appears.
6. Restore killed node.
7. Create partition.
8. Confirm blocked links/messages.
9. Heal partition.
10. Confirm cluster returns to stable state.
11. Change latency and confirm message animation/delivery timing changes.

## Definition of Done

- Every MVP control sends the correct command.
- Backend validates every command.
- Invalid actions produce clear error events.
- Partition and latency have visible effects.
- Event log narrates user actions and simulation consequences.

## Handoff Notes

The next task will harden test coverage. Document any behavior that is intentionally simplified, especially partition semantics.
