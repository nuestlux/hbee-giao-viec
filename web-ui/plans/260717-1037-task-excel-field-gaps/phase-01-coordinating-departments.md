---
phase: 1
title: "Multi-select đơn vị phối hợp"
status: pending
priority: P1
dependencies: []
---

# Phase 01: Đơn vị phối hợp

## Overview

Form + view cho `Task.coordinatingDepartments` (Excel col 5).

## Requirements

- Multi-select departments except current `assignedDepartmentId`
- Save via `updateTask` / `addTask` (store already patches array)
- View: list names joined `; `

## Files

- Modify: `src/components/TaskFormFields.tsx`
- Modify: `src/pages/TaskDetail.tsx` (view summary if not in form read-only)
- Verify: `src/store/useStore.ts` addTask/updateTask coordinatingDepartments
- Optional: mock seed 1–2 tasks with coordinating ids

## Steps

1. UI multi-select (checkbox list in Phân công & lịch)
2. Wire formData.coordinatingDepartments
3. taskToFormData / emptyTaskForm include array
4. Read-only display chips/text
5. Build

## Success

- [ ] Create/edit persists coordinatingDepartments
- [ ] Report col 5 non-empty when set
- [ ] Build OK
