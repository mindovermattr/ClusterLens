# Task 08: Testing And Quality

## Objective

Add focused automated coverage and quality checks for the critical MVP behavior.

## Prerequisites

- Task 07 is complete.
- End-to-end MVP interactions work manually.

## Scope

- Add backend unit tests for simulation, network, and Bully election.
- Add integration tests where practical.
- Add frontend tests for store/event handling and critical panel behavior.
- Ensure build, typecheck, lint, and tests run from root.

## Out of Scope

- Full browser E2E suite unless the project already has tooling.
- Snapshot-heavy visual tests.
- Performance benchmarking beyond simple sanity checks.

## Implementation Steps

1. Add or finalize Vitest configuration for backend, frontend, and shared package.
2. Test that election starts when leader dies.
3. Test that the highest alive eligible node becomes leader in Bully Algorithm.
4. Test that down nodes do not receive or process messages.
5. Test that partition blocks messages between groups.
6. Test that heal partition restores delivery.
7. Test start simulation to leader appears.
8. Test kill leader to new leader appears.
9. Test frontend store handling for snapshot, message events, leader changes, event logs, and errors.
10. Add root scripts for `test`, `typecheck`, `lint`, and `build`.
11. Fix issues found by tests without broad unrelated refactors.

## Expected Files

- `apps/backend/src/**/*.test.ts`
- `apps/frontend/src/**/*.test.ts`
- `packages/shared/src/**/*.test.ts`
- `apps/backend/vitest.config.ts`
- `apps/frontend/vitest.config.ts`
- root `package.json`

## Verification

Run:

```bash
pnpm test
pnpm build
pnpm lint
pnpm typecheck
```

Manual check:

- Repeat the MVP QA flow once after automated tests pass.

## Definition of Done

- Critical distributed-system behaviors have automated tests.
- Root verification commands pass.
- Tests are deterministic enough to run repeatedly.
- No test depends on arbitrary real-time sleeps when simulation time can be advanced directly.

## Handoff Notes

The documentation task should reference the test commands and summarize known limitations discovered during testing.
