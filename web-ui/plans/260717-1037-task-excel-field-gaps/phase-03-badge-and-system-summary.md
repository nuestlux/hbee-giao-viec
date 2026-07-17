---
phase: 3
title: "Badge mức độ hoàn thành + block hệ thống/gia hạn"
status: pending
priority: P1
dependencies: []
---

# Phase 03: Badge + system/extension summary

## Overview

Excel col 13 badge (computed). Cols 16–22 summary on view.

## Requirements

- Badge: use `computeProgressLevel` + `PROGRESS_LEVEL_LABELS` / getProgressLevelLabel from report-progress-level (asOf = today)
- Do not allow manual edit of badge
- Summary block: id, externalTaskId, assignerName, updatedAt, completedDate, extension count APPROVED, last previous due from approved ext

## Files

- Modify: `src/pages/TaskDetail.tsx`
- Reuse: `src/utils/report-progress-level.ts`
- Optional small badge component if cluttered

## Steps

1. Header badge next to status/urgency
2. Accordion “Thông tin hệ thống & gia hạn” default open on view
3. Extension stats helper (same logic as report extensionStats)
4. Build

## Success

- [ ] Near-deadline / overdue / on-track labels correct vs dueDate
- [ ] Extension count matches approved requests
- [ ] Build OK
