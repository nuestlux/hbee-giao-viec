# Brainstorm: Task UI fields vs Excel báo cáo NV đang TH

**Date:** 2026-07-17  
**Source Excel:** `Downloads/bao_cao_nhiem_vu_dang_thuc_hien_don_vi_20260717.xlsx`  
**Sheet:** Danh sách nhiệm vụ đơn vị (25 cols)  
**Status:** Design approved (gap-fill A full)  
**Scope:** TaskDetail workspace + existing Reports export — not list redesign

---

## Problem

Excel unit report = 25-col contract for leadership. UI/task form incomplete → empty report cells, especially coordinating depts + difficulties/suggestions.

## Excel ↔ UI gap (summary)

| Priority | Excel cols | Gap |
|----------|------------|-----|
| P0 | 5 Đơn vị phối hợp | Model `coordinatingDepartments[]` exists; **no form/view UI** |
| P0 | 14–15 Khó khăn, Đề xuất | On `ProgressUpdate`; progress edit UI missing separate fields |
| P1 | 13 Mức độ hoàn thành | Computed `computeProgressLevel` — not shown on detail |
| P1 | 16–22 ID, giao, dates, gia hạn stats | Partial / weak on view |
| OK | 2–4, 6–12, 17–18, 23–25 | Mostly in form or system |

## Design approved

### Approach A — gap-fill (chosen)
- Multi-select coordinating departments in Phân công & lịch
- Progress edit: mốc + content + **difficulties** + **suggestions**
- Badge mức độ hoàn thành (read-only, due-based)
- View block: system + extension summary
- Keep report engine map; ensure data fills

### Out of scope
- List column redesign
- Flat 25-col form
- Manual edit of computed progress-level badge

## Touchpoints

- `src/components/TaskFormFields.tsx` — phối hợp multi-select
- `src/pages/TaskDetail.tsx` — progress fields, badge, system/extension summary
- `src/store/useStore.ts` — already patches `coordinatingDepartments`; `addProgressUpdate` already has difficulties/suggestions
- `src/utils/report-unit-in-progress.ts` — no header change
- `src/utils/report-progress-level.ts` — reuse badge
- Optional mock seed

## Acceptance

1. Save coordinating depts → export col 5 populated  
2. Save progress with difficulties/suggestions → cols 14–15  
3. Detail shows level badge (ON_TRACK / NEAR / OVERDUE labels)  
4. View shows id, assigner, updatedAt, completedDate, extension count + last previous due  
5. Build green  

## Next

`/ck:plan` → implement phases.
