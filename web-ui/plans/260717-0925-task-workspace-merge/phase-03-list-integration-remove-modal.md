---
phase: 3
title: "List integration — remove modal, deep links"
status: pending
priority: P1
dependencies: [2]
---

# Phase 03: List integration — remove modal

## Overview

`Tasks.tsx` list-only: CTA + row actions navigate workspace. Xóa Modal form và state form liên quan.

## Requirements

- Functional: `+ Giao việc` → `navigate('/tasks/new')`
- Functional: row click → `/tasks/:id` (đã có)
- Functional: action Sửa trên row (nếu có) → `/tasks/:id?edit=1`
- Functional: delete confirm giữ nguyên nếu đang có
- Non-functional: giảm LOC Tasks.tsx; không regress filters/tabs/table

## Architecture

```
Tasks list ──+ Giao việc──▶ /tasks/new
           ──row click────▶ /tasks/:id
           ──edit action──▶ /tasks/:id?edit=1
```

## Related Code Files

- Modify: `src/pages/Tasks.tsx` — remove Modal, formOpen, formData, editingId, handleSubmit form path
- Modify: columns actions if edit button opens modal → navigate
- Keep: filters, tabs, DataTable, Pagination, delete dialog, toast for delete

## Implementation Steps

1. Map all `setFormOpen(true)` / edit openers → navigate
2. Remove form JSX Modal block
3. Remove unused imports (FormField, emptyForm local, etc.)
4. Ensure canCreate still gates CTA visibility
5. Manual smoke: create from list, edit from list action, delete still works
6. `npm run build`

## Success Criteria

- [ ] No form modal on Tasks page
- [ ] Create/edit entry points reach workspace
- [ ] List filters/sort/tabs unchanged
- [ ] Build clean

## Risk Assessment

- Dead code leftovers → lint/oxlint
- External links expecting modal — none in mock app
