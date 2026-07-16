---
phase: 5
title: "Wire Reports + DepartmentWork UI"
status: pending
priority: P2
dependencies: [2, 3, 4]
---

# Phase 05: UI wiring

## Overview

Replace mock export toast; DepartmentWork uses real dept tasks + export button; Reports adds report type.

## Requirements

- Functional: user picks asOf + department → preview count → download
- Non-functional: reuse FilterBar patterns; short labels

## Related files

- Modify: `web-ui/src/pages/Reports.tsx`
- Modify: `web-ui/src/pages/DepartmentWork.tsx`
- Modify: `web-ui/src/store/useStore.ts` if dept filter needs currentUser.departmentId

## Implementation steps

1. Reports: report type option “NV đang thực hiện theo đơn vị”
2. Controls: date asOf (default today), department select (all | list)
3. Button “Xuất Excel” → builder + export util
4. Optional preview table first 10 rows from builder
5. DepartmentWork: filter tasks by currentUser.departmentId (or select); remove slice demo
6. Dept page: “Xuất báo cáo phòng” pre-fills dept
7. Empty state when 0 rows

## Success criteria

- [ ] End-to-end download from Reports and DepartmentWork
- [ ] Dept filter isolates tasks
- [ ] Build green

## Risks

- Demo users without departmentId — fallback all + message
