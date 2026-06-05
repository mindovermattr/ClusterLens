# Task 09: Documentation And Demo

## Objective

Make the MVP understandable and presentable through README, architecture notes, algorithm explanation, limitations, and demo guidance.

## Prerequisites

- Task 08 is complete.
- The app runs locally and passes verification.

## Scope

- Write root README.
- Explain architecture.
- Explain Bully Algorithm behavior.
- Document WebSocket protocol.
- Document local setup and test commands.
- Document limitations and roadmap.
- Add guidance for recording a short demo.

## Out of Scope

- Building a marketing landing page.
- Deploying live demo.
- Creating production Docker or CI unless already added by prior tasks.

## Implementation Steps

1. Write README with the roadmap-required structure:
   - What is this?
   - Demo
   - Features
   - Architecture
   - How the simulation works
   - Implemented algorithms
   - WebSocket protocol
   - Running locally
   - Development
   - Testing
   - Roadmap
   - Known limitations
2. Add an architecture diagram using Mermaid or a compact text diagram.
3. Explain the simplified Bully Algorithm in terms of node ids, heartbeat timeout, election, answer, and coordinator messages.
4. Document command and event protocol with TypeScript snippets or references to shared package files.
5. Document the MVP manual QA scenario.
6. Add known limitations honestly:
   - no persistence
   - no multi-user rooms
   - simplified Bully behavior
   - packet loss configured for future work but not active in MVP
   - no full Raft replication
7. Add roadmap summary for versions 0.2 through 1.0.
8. Add demo recording guidance for a 30-60 second clip.

## Expected Files

- `README.md`
- Optional: `docs/architecture.md`
- Optional: `docs/demo-script.md`

## Verification

Run:

```bash
pnpm build
pnpm test
```

Manual check:

- Follow README local run instructions from a clean terminal.
- Confirm commands are accurate.
- Confirm README does not claim features that are not implemented.

## Definition of Done

- README is accurate and complete for MVP.
- Architecture and algorithm are understandable without reading all source code.
- Run and test commands work.
- Known limitations are explicit.
- Demo script covers leader election and network partition.

## Handoff Notes

This is the final MVP planning task. If future agents continue beyond MVP, start with roadmap version 0.2: scenarios and replay.
