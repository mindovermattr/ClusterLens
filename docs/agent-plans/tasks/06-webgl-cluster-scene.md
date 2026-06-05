# Task 06: WebGL Cluster Scene

## Objective

Implement the React Three Fiber scene that visualizes nodes, links, roles, statuses, partitions, and message movement.

## Prerequisites

- Task 05 is complete.
- Frontend store contains cluster snapshot and active message events.

## Scope

- Add WebGL scene.
- Render nodes around a circle.
- Render links between nodes.
- Render labels.
- Render role and status visual states.
- Animate message particles.
- Support selecting a node by clicking it.

## Out of Scope

- Advanced camera tooling.
- Complex physics.
- Large-cluster optimization beyond basic performance care.
- Landing page.

## Implementation Steps

1. Add React Three Fiber and Three.js dependencies if not already present.
2. Create `ClusterScene` as the main scene surface.
3. Compute stable node positions around a circle from node ids.
4. Render `NodeMesh` for each node.
5. Use distinct visual states:
   - leader: prominent accent and halo/ring
   - candidate: active election color
   - follower: neutral active color
   - down: dimmed and lowered opacity
6. Render `EdgeMesh` links between nodes.
7. Visually mark partitioned cross-group links as blocked, broken, or warning-colored.
8. Render labels with node ids and concise role indicators.
9. Render `MessageParticle` animations from `message_sent` until `message_delivered` or timeout.
10. Add click handling to select a node in the store.
11. Ensure the scene works at desktop and reasonable laptop viewport sizes.

## Expected Files

- `apps/frontend/src/scene/ClusterScene.tsx`
- `apps/frontend/src/scene/NodeMesh.tsx`
- `apps/frontend/src/scene/EdgeMesh.tsx`
- `apps/frontend/src/scene/MessageParticle.tsx`
- `apps/frontend/src/scene/labels.tsx`
- `apps/frontend/src/app/App.tsx`

## Verification

Run:

```bash
pnpm --filter frontend test
pnpm build
```

Manual check:

- Open frontend with backend running.
- Confirm 5 nodes render in a stable layout.
- Confirm leader is visually distinct.
- Confirm down nodes are visually distinct.
- Confirm message particles move between nodes.
- Confirm clicking a node updates selected node state in the panels.
- Confirm partition state is visible.

## Definition of Done

- WebGL scene is not blank.
- Nodes, links, labels, and messages are visible.
- Visual state changes match backend snapshots.
- Selection works from the scene to the UI store.
- No text or controls overlap the scene incoherently.

## Handoff Notes

The next task will refine end-to-end controls. Keep scene behavior data-driven and avoid embedding simulation rules in rendering components.
