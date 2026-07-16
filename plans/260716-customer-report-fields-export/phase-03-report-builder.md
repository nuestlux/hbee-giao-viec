---
phase: 3
title: "Report row builder (25 cols, asOf filter)"
status: pending
priority: P1
dependencies: [1]
---

# Phase 03: buildUnitInProgressReport

## Overview

Pure function: given tasks, departments, progress, extensions, asOf, dept filter → rows matching 25 customer columns.

## Requirements

- Functional: filter đang TH; map all columns; resolve coordinating dept names; extension count + previous due
- Non-functional: pure, deterministic, timezone Asia/Ho_Chi_Minh for date-only compare

## Related files

- Create: `web-ui/src/utils/report-unit-in-progress.ts`
- Create: `web-ui/src/utils/report-column-defs.ts` (ordered headers)
- Optional test: `web-ui/src/utils/report-unit-in-progress.test.ts` if vitest added; else manual fixture assert

## Implementation steps

1. Define `UnitInProgressRow` with 25 fields (or `string[]` ordered + headers const)
2. Filter tasks by status set + optional assignedDepartmentId
3. For each task build row:
   - STT later at export
   - col5 focalPointText
   - col7 format dueDate
   - col9 join sourceKind + sourceCitation or document fallback
   - col10 getTaskStatusReportLabel
   - col11 executionResult
   - col12 computeProgressLevel label
   - col13–14 latest progress ≤ asOf
   - col15 externalTaskId || id
   - col20–21 from extensions
   - col22–24 approver snapshots
4. Format dates `DD/MM/YYYY`
5. Export helper `IN_PROGRESS_STATUSES` constant (document BA defaults)

## Success criteria

- [ ] Fixture with 1 task produces non-empty required cols 1,3,6,10,12,15
- [ ] Overdue task → col12 Quá hạn at asOf after due
- [ ] No UI dependency

## Risks

- Date parse ISO vs DD/MM — normalize in one place
