---
phase: 1
title: "Extract shared task form fields"
status: pending
priority: P1
dependencies: []
---

# Phase 01: Extract shared task form fields

## Overview

Tách field form giao/sửa việc từ modal `Tasks.tsx` ra module dùng chung, để Workspace (phase 02) và (tạm) modal tái sử dụng trước khi gỡ modal (phase 03).

## Requirements

- Functional: render đủ field primary + extra (báo cáo) controlled bởi `value`/`onChange` Partial\<Task\>
- Functional: support `readOnly` (view mode) vs editable
- Non-functional: không đổi store/API; giữ class `inputClass`/`selectClass`/`textareaClass`/`FormField`

## Architecture

```
Tasks.tsx modal  ──┐
                   ├──▶ components/task-form-fields.tsx (or task/TaskFormFields.tsx)
TaskWorkspace ─────┘         props: value, onChange, readOnly, catalogs (depts/users/categories/fields)
```

`emptyForm()` move sang `utils/task-form.ts` hoặc export từ module form.

## Related Code Files

- Create: `src/components/TaskFormFields.tsx` (hoặc `src/components/task/task-form-fields.tsx` nếu muốn folder)
- Create: `src/utils/task-form.ts` — `emptyTaskForm(): Partial<Task>`
- Modify: `src/pages/Tasks.tsx` — dùng shared component trong Modal (behavior giữ nguyên phase này)
- Read: `src/types/index.ts` Task fields; form block ~L577–830 Tasks.tsx

## Implementation Steps

1. List full field order từ form hiện tại (primary grid + extra block + approver)
2. Extract `emptyForm` → `emptyTaskForm`
3. Build `TaskFormFields` với:
   - Primary: title (optional hide nếu header owns title), description, dept, assignee, category, field, urgency, startDate, dueDate
   - **Không** include progress select trong shared primary cho workspace update path — optional prop `showProgressSelect?: boolean` default true for modal compat, workspace create can pass true once, edit false
4. Extra section: prop `extraDefaultOpen?: boolean` default **true** (user decision); render accordion/details
5. Wire Tasks modal to shared component; verify create/edit still works
6. `npm run build`

## Success Criteria

- [ ] Modal Tasks create/edit behavior identical
- [ ] Shared module exports fields + empty helper
- [ ] Build clean
- [ ] No store changes

## Risk Assessment

- Miss field when extract → checklist against Tasks form + Task type
- File >200 lines → split PrimaryFields / ExtraFields if needed
