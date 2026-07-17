---
phase: 2
title: "Task Workspace page + routes (create/view/edit)"
status: pending
priority: P1
dependencies: [1]
---

# Phase 02: Task Workspace page + routes

## Overview

Biến `TaskDetail` thành workspace: create / view / edit. Route `/tasks/new` + `/tasks/:id` + `?edit=1`. Layout 2 cột theo design A; header actions; integrate `TaskFormFields`.

## Requirements

- Functional: create via `addTask`, edit via `updateTask`, view read-only
- Functional: progress modal, status modal, extension — giữ logic hiện có
- Functional: comments panel sticky
- Functional: Mức độ khẩn visible (badge view / select edit)
- Non-functional: HashRouter; declare `tasks/new` before `tasks/:id`

## Architecture

```
App.tsx
  tasks/new     → TaskWorkspace mode=create
  tasks/:id     → TaskWorkspace mode=view|edit

WorkspaceHeader (title, badges, actions)
Main col: description + TaskFormFields + ProgressSection + Extra + Extensions
Side col: TaskCommentsPanel
```

Prefer evolve `TaskDetail.tsx` → rename export still default, or new `TaskWorkspace.tsx` + thin re-export. Prefer **one page file + extracted panels** to avoid dual maintenance.

Mode detection:
- `id === 'new'` OR dedicated route element with `mode="create"`
- `searchParams edit=1` or local `isEditing` state after Sửa click
- After save edit → set view mode (recommended)

RBAC (section-level):
- canEditMeta: assign/create/update permissions (mirror Tasks.tsx canEdit)
- canUpdateProgress / canChangeStatus / canRequestExt / canApproveExt — keep TaskDetail rules

## Related Code Files

- Modify: `src/pages/TaskDetail.tsx` (primary workspace UI)
- Modify: `src/App.tsx` — add route `tasks/new` **before** `tasks/:id`
- Use: `src/components/TaskFormFields.tsx` (phase 01)
- Optional create: `src/components/TaskCommentsPanel.tsx`, `WorkspaceHeader` extract if file large
- Read: `src/store/useStore.ts` addTask/updateTask signatures

## Implementation Steps

1. Add route `/tasks/new` → same component with create flag (or path match)
2. Implement mode state: create | view | edit
3. Header sticky: back, title, StatusBadge, UrgencyBadge, action buttons
4. Main: wire TaskFormFields readOnly={!edit && !create}; hide progress select on edit/view (`showProgressSelect={create only}`)
5. Progress section + modals (port from current TaskDetail)
6. Extra accordion **defaultOpen=true**
7. Comments panel: flex height, empty compact
8. Create submit → addTask → navigate `/tasks/${id}` + toast
9. Edit save → updateTask → exit edit mode + toast
10. Dirty guard: beforeunload / confirm when navigate if dirty (simple window.confirm OK mock)
11. `npm run build`

## Success Criteria

- [ ] `/#/tasks/new` creates task and lands on detail
- [ ] `/#/tasks/:id` shows all primary + extra fields (extra open)
- [ ] Sửa → Lưu/Hủy works; khẩn editable in edit
- [ ] Progress/status/extension/comments still work
- [ ] Build clean

## Risk Assessment

- `useParams().id === 'new'` if route order wrong → register explicit path first
- Large file → modularize comments/progress panels
