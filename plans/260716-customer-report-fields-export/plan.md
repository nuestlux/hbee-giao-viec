---
title: "Customer report 25-col fields + Excel export"
status: completed
created: "2026-07-16"
mode: default
source: ck-plan
brainstorm: "plans/reports/260716-brainstorm-customer-report-fields-gap.md"
stack: "React, Vite, Zustand mock, SheetJS/exceljs"
---

# Plan: Field gap + xuất báo cáo NV đang TH (25 cột)

## Goal

Mở rộng schema/UI Task + Văn bản đến đủ dữ liệu; builder snapshot tại ngày chốt; export Excel **1:1** mẫu khách; Công việc phòng / Báo cáo dùng chung engine.

## Source decisions

See brainstorm report. Key locks:

- Col7 = `dueDate`; col5 = `focalPointText` (≠ assignee); col12 computed 3 nhãn, near≤3d
- Col9 Task sourceKind/citation + fallback VB; col10 status→VN map
- Approach A; all 25 columns

## Phases

| Phase | Name | Depends | Priority |
|---:|---|---|---|
| 01 | Types, mock seed, status/progress helpers | — | P1 |
| 02 | Forms Task + IncomingDocument fields | 01 | P1 |
| 03 | Report row builder (25 cols, asOf filter) | 01 | P1 |
| 04 | Excel export template | 03 | P1 |
| 05 | Wire Reports + DepartmentWork UI | 02–04 | P2 |

## Acceptance (plan-level)

- [x] Export file has 25 columns in customer order
- [x] Col12 never user-editable; computed for asOf
- [x] Col5 from focalPointText
- [x] Forms capture all NEW persist fields
- [x] Dept work + Reports call same builder
- [x] `npm run build` passes

## Out of scope

- Nest/Prisma backend
- Perfect OLE `.xls` (use `.xlsx`)
- Multi-milestone roadmap UI

## Open questions (BA later)

1. Extension count: APPROVED only?
2. In-progress status set exact list?
3. Org header static vs settings?

## Next

`/ck:cook plans/260716-customer-report-fields-export` after review.
