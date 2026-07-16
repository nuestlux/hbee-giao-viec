# Cook report: customer report fields + Excel export

**Plan:** `plans/260716-customer-report-fields-export`  
**Date:** 2026-07-16  
**Status:** DONE

## Delivered

### Phase 01
- Extended `Task` / `IncomingDocument` types (report fields optional)
- Helpers: `report-progress-level.ts`, status/source labels in `ui-labels.ts`
- Seed enriched `task-007`, `task-008`, `doc-001`

### Phase 02
- Task form: section “Thông tin báo cáo / chủ trì” (LĐVP, đầu mối, nguồn, kết quả, lộ trình, approver, external id)
- Document form: sourceKind + sourceCitation
- Store `addTask` / `updateTask` / `addDocument` / `updateDocument` persist new fields

### Phase 03
- `buildUnitInProgressReport` → 25 cells ordered like customer XLS
- Filter IN_PROGRESS_REPORT_STATUSES + department
- Col12 computed; col5 focalPointText; col7 dueDate; col20–21 extensions APPROVED

### Phase 04
- Dep `xlsx` (SheetJS)
- `downloadUnitInProgressXlsx` — title, ngày chốt, tổng, 25 headers

### Phase 05
- `Reports.tsx` — type “NV đang TH theo đơn vị”, asOf, dept, KPI preview, export
- `DepartmentWork.tsx` — real dept filter + Xuất báo cáo (same builder)

## Verify
- `npm run build` ✓

## Notes
- Export is `.xlsx` (not OLE `.xls`)
- Calendar view dept still placeholder
- Extension count = APPROVED only (open BA question)

## Unresolved
1. Exact in-progress status set with BA
2. Org header branding (Đảng ủy…) vs organization.name only
