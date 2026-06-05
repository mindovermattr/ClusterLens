# ClusterLens Agent Plan Design

## Context

ClusterLens is currently a roadmap-only repository. The source document is `clusterlens-mvp-roadmap.md`, which describes a WebGL distributed systems visualizer with a TypeScript frontend, TypeScript backend, WebSocket event stream, in-memory simulation, and an MVP centered on a simplified Bully leader election algorithm.

The requested artifact is not application code. It is a detailed execution plan for future agents: one master plan plus separate task files.

## Chosen Approach

Use a sequential integration plan. Each agent receives a bounded phase with explicit prerequisites, files to create or modify, success criteria, verification commands, and a handoff section for the next agent.

This is the safest structure for an empty repository because the first tasks establish shared contracts before frontend and backend work depend on them. It also prevents early conflicts between agents by avoiding parallel edits to the same foundational modules.

## Alternatives Considered

Frontend/backend split would be faster in theory, but it is fragile before protocol types, package layout, and simulation contracts exist.

Feature-slice ownership would work later, after the scaffold is stable. For the MVP start, it would cause multiple agents to touch the same base files and make integration harder.

## Planned Documents

- `docs/agent-plans/master-plan.md` defines the full MVP sequence, repository conventions, agent handoff rules, shared architecture, and acceptance gates.
- `docs/agent-plans/tasks/01-project-scaffold.md` creates the monorepo structure, tooling, basic frontend/backend apps, and WebSocket smoke path.
- `docs/agent-plans/tasks/02-shared-protocol.md` defines protocol and domain types shared by frontend and backend.
- `docs/agent-plans/tasks/03-backend-simulation-core.md` implements the simulation engine, cluster, node model, scheduler, and snapshots.
- `docs/agent-plans/tasks/04-backend-network-and-election.md` implements delayed delivery, partitions, Bully election, heartbeat, and backend tests.
- `docs/agent-plans/tasks/05-frontend-state-and-panels.md` implements WebSocket client state, control panel, cluster state panel, and event log.
- `docs/agent-plans/tasks/06-webgl-cluster-scene.md` implements the WebGL scene, node rendering, labels, links, and message animation.
- `docs/agent-plans/tasks/07-interactive-failure-controls.md` connects kill/restore/partition/latency controls end to end.
- `docs/agent-plans/tasks/08-testing-and-quality.md` adds focused unit, integration, and manual QA coverage.
- `docs/agent-plans/tasks/09-documentation-and-demo.md` writes README, architecture notes, known limitations, and demo guidance.

## Agent Task Contract

Every task file uses the same structure:

- Objective
- Prerequisites
- Scope
- Out of scope
- Implementation steps
- Expected files
- Verification
- Definition of Done
- Handoff notes

This contract keeps each task executable without requiring the agent to reinterpret the full roadmap.

## Scope Boundaries

The plan targets only the MVP described in the roadmap:

- 5-node default cluster
- backend as source of truth
- in-memory simulation
- WebSocket protocol
- simplified Bully Algorithm
- WebGL visualization
- failure controls
- event log
- focused tests and README

The plan explicitly excludes auth, persistence, collaborative rooms, Kubernetes integration, full Raft, production observability, and complex scene physics.

## Review Notes

The plan should remain implementation-oriented but not overfit to a specific package manager beyond recommending `pnpm` unless the scaffold agent chooses otherwise for a documented reason.

The agent documents should avoid vague instructions such as "polish UI" without acceptance criteria. Where polish is required, the task must state observable outcomes.
