---
phase: 4
title: "Smoke export báo cáo + build"
status: pending
priority: P2
dependencies: [1, 2, 3]
---

# Phase 04: Verify report export + build

## Overview

Manual/logic check: filled task → `buildUnitInProgressReport` cells match UI data. Full build.

## Steps

1. Seed or UI-create task with coordinating depts + progress difficulties/suggestions
2. Open Reports unit in-progress (or call builder) — cols 5, 14, 15, 13
3. `npm run build` + lint
4. Note residual gaps in plan status

## Success

- [ ] Col 5, 13, 14, 15 plausible
- [ ] Build green
- [ ] plan.md acceptance checked
