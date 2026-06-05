# Task 04: Backend Network And Election

## Objective

Implement delayed network delivery, network partitions, heartbeat, heartbeat timeout, and simplified Bully leader election.

## Prerequisites

- Task 03 is complete.
- Simulation engine emits snapshots and event logs.
- Node state has role/status fields.

## Scope

- Add network message queue.
- Add latency and jitter support.
- Add partition blocking.
- Add Bully Algorithm behavior.
- Emit message and leader events.
- Add backend unit tests for core behavior.

## Out of Scope

- Full Raft behavior.
- Log replication.
- Advanced packet loss, duplication, or reordering.
- Frontend message animation.

## Implementation Steps

1. Add `Network` with pending message queue and delivery rules.
2. Define message types: `heartbeat`, `election`, `answer`, `coordinator`.
3. Emit `message_sent` when a message enters the network.
4. Emit `message_delivered` when a message reaches a live node.
5. Block messages to down nodes.
6. Block messages across active partition groups.
7. Implement `NodeBehavior` interface with `onTick`, `onMessage`, `onStart`, and `onStop`.
8. Implement `BullyNodeBehavior`.
9. On startup, trigger election or select the highest alive node through election flow.
10. Make the leader send heartbeats every configured heartbeat interval.
11. Make followers start election after heartbeat timeout.
12. When a leader is killed, ensure a new highest alive reachable node becomes leader.
13. Emit `leader_changed` and explanatory `event_log` entries.
14. Add tests for leader death, highest alive winner, down node behavior, partition blocking, and partition healing.

## Expected Files

- `apps/backend/src/simulation/Network.ts`
- `apps/backend/src/algorithms/NodeBehavior.ts`
- `apps/backend/src/algorithms/bully/BullyNodeBehavior.ts`
- `apps/backend/src/algorithms/bully/BullyMessages.ts`
- `apps/backend/src/simulation/SimulationEngine.test.ts`
- `apps/backend/src/simulation/Network.test.ts`
- `apps/backend/src/algorithms/bully/BullyNodeBehavior.test.ts`

## Verification

Run:

```bash
pnpm --filter backend test
pnpm build
```

Manual check:

- Start simulation.
- Confirm a leader appears.
- Kill the leader.
- Confirm election messages appear.
- Confirm a new leader appears.
- Create a partition and confirm cross-group messages are blocked.
- Heal the partition and confirm delivery resumes.

## Definition of Done

- Highest alive node can become leader through Bully election.
- Killing the leader triggers reelection.
- Down nodes do not receive or process messages.
- Partition blocks cross-group delivery.
- Heal partition restores delivery.
- Event log explains elections and leader changes.

## Handoff Notes

The frontend tasks will depend on `message_sent`, `message_delivered`, `leader_changed`, `snapshot`, and `event_log` being stable and documented by shared types.
