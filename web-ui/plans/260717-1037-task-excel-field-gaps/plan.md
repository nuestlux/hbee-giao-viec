---
title: "Task UI fields gap-fill vs Excel báo cáo 25 cột"
status: completed
priority: P1
source: skill
brainstorm: plans/reports/260717-1036-brainstorm-task-fields-vs-excel-report.md
created: 2026-07-17
---

# Plan: Task fields ↔ Excel report gaps

## Overview

Bổ sung UI/workspace nhiệm vụ cho khớp file báo cáo đơn vị 25 cột: đơn vị phối hợp, khó khăn/đề xuất khi cập nhật tiến độ, badge mức độ hoàn thành (hạn), tóm tắt hệ thống & gia hạn. Giữ engine `report-unit-in-progress.ts`.

## Design lock

- Approach A full (brainstorm approved)
- Scope: TaskDetail + TaskFormFields + store verify; Reports export unchanged map
- Out: list redesign, flat 25-col form

## Phases

| Phase | Title | Status | Priority | Depends |
|-------|-------|--------|----------|---------|
| 01 | Multi-select đơn vị phối hợp | completed | P1 | — |
| 02 | Progress form: khó khăn + đề xuất | completed | P1 | — |
| 03 | Badge mức độ hoàn thành + block hệ thống/gia hạn | completed | P1 | — |
| 04 | Smoke export báo cáo + build | completed | P2 | 01, 02, 03 |

Phases 01–03 parallelizable (different UI regions); 04 integrates.

## Acceptance (plan-level)

- [ ] coordinatingDepartments editable + viewable; export col 5
- [ ] addProgressUpdate with difficulties/suggestions from UI; export 14–15
- [ ] Badge Đúng tiến độ / Sắp đến hạn / Quá hạn on detail
- [ ] View: id, assigner, updatedAt, completedDate, extension count, last previous due
- [ ] `npm run build` pass

## Risks

| Risk | Mitigation |
|------|------------|
| Confuse progress mốc vs mức độ hạn | Different labels/colors |
| Multi-select UX | Chips + checkbox dropdown, exclude lead dept |
| Store already has coordinating patch | Verify only |

## Cook

```
/ck:cook plans/260717-1037-task-excel-field-gaps
```
