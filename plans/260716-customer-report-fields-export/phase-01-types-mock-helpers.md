---
phase: 1
title: "Types, mock seed, status/progress helpers"
status: pending
priority: P1
dependencies: []
---

# Phase 01: Types + mock + helpers

## Overview

Extend TypeScript models and seed data; pure helpers for status labels and progress-level at asOf.

## Requirements

- Functional: Task/Document new fields; helpers pure + unit-testable via Vitest optional or manual assert
- Non-functional: no break existing lists; defaults empty string/null

## Related files

- Modify: `web-ui/src/types/index.ts`
- Modify: `web-ui/src/data/mockData.ts`
- Create: `web-ui/src/utils/task-status-labels.ts` (or extend `ui-labels.ts`)
- Create: `web-ui/src/utils/report-progress-level.ts`

## Implementation steps

1. Extend `Task` with: chairLeaderName, chairLeaderUserId?, focalPointText, sourceKind, sourceCitation, executionResult, roadmap, externalTaskId, approverUserId?, approverName, approverEmail, approverPhone
2. Extend `IncomingDocument` with sourceKind, sourceCitation
3. Seed ≥3 tasks with partial/full report fields; 1 with externalTaskId like customer
4. `getTaskStatusReportLabel(status)` map VN
5. `computeProgressLevel(dueDate, completedDate, status, asOf, nearDays=3)` → `ON_TRACK | NEAR_DEADLINE | OVERDUE` + VN labels Đúng tiến độ / Sắp đến hạn / Quá hạn
6. Export labels in ui-labels if preferred single source

## Success criteria

- [ ] Types compile
- [ ] Mock loads without runtime error
- [ ] Progress level: past due → OVERDUE; within 3 days → NEAR; else ON_TRACK
- [ ] Build green

## Risks

- Existing mock objects missing new fields → fill defaults in seed or normalize in store
