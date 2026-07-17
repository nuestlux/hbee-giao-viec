---
title: "Task Workspace — gộp Form Giao việc + Chi tiết"
status: completed
priority: P1
source: skill
brainstorm: plans/reports/260717-0924-brainstorm-task-workspace-merge.md
created: 2026-07-17
---

# Plan: Task Workspace merge

## Status

| Field | Value |
|-------|-------|
| Status | completed |
| Priority | P1 |
| Mode | default (no TDD flag) |
| Brainstorm | `plans/reports/260717-0924-brainstorm-task-workspace-merge.md` |

## Overview

Gộp modal form giao/sửa việc (`Tasks.tsx`) và màn chi tiết (`TaskDetail.tsx`) thành **1 Task Workspace**: create `/tasks/new`, view/edit `/tasks/:id`. Layout 2 cột (nội dung+meta+tiến độ | chat sticky). Mode Xem/Sửa. Accordion **Thông tin thêm** mặc định **mở**. Bỏ modal form trên list.

## Design decisions (locked)

1. Approach **A** — 2 cột + Xem/Sửa (not 3-col, not drawer)
2. Extra fields accordion **default open**
3. Dual persona, 1 layout, RBAC section-level v1
4. Progress sau giao: giữ modal cập nhật; create = default Chưa TH
5. List CTA → `/tasks/new` only

## Phases

| Phase | Title | Status | Priority | Depends |
|-------|-------|--------|----------|---------|
| 01 | Extract shared task form fields | completed | P1 | — |
| 02 | Task Workspace page + routes (create/view/edit) | completed | P1 | 01 |
| 03 | List integration — remove modal, deep links | completed | P1 | 02 |
| 04 | Density / empty / sticky chat polish + verify | completed | P2 | 02, 03 |

## Dependencies

- Brainstorm approved: workspace A + accordion open
- Store APIs unchanged: `addTask`, `updateTask`, progress/comment/extension
- No backend; mock Zustand only

## Acceptance criteria (plan-level)

- [ ] 1 màn tạo/xem/sửa đủ field form (gồm Mức độ khẩn) + tiến độ history + chat
- [ ] `/tasks/new` và `/tasks/:id` (+ `?edit=1`) hoạt động
- [ ] List không còn Modal form XL; `+ Giao việc` → create route
- [ ] Empty progress/chat gọn; chat sticky theo viewport
- [ ] Thông tin thêm accordion default open
- [ ] RBAC: không lộ action khi thiếu permission
- [ ] `npm run build` pass

## Out of scope

- Redesign list table / filters
- Real API / autosave / realtime chat
- Field-level permission granularity (v1 = section Sửa)
- Native mobile app

## Risks

| Risk | Mitigation |
|------|------------|
| TaskDetail.tsx phình >200 LOC | Extract `TaskFormFields`, `TaskCommentsPanel`, header components |
| Dirty leave without save | confirm on navigate when edit dirty |
| Route `/tasks/new` conflict `:id` | Declare `tasks/new` **before** `tasks/:id` in App.tsx |
| Accordion open → long scroll | Sticky header + sticky chat; collapse optional |

## Cook handoff

```
/ck:cook plans/260717-0925-task-workspace-merge
```

## Unresolved (carry from brainstorm)

- Sau Lưu edit → về view (recommend yes)
- Prefill từ văn bản đến → out of scope unless asked
