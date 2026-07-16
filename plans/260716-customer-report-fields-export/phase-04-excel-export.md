---
phase: 4
title: "Excel export template"
status: pending
priority: P1
dependencies: [3]
---

# Phase 04: Excel template 1:1

## Overview

Generate `.xlsx` download close to customer layout (title, asOf, total, 2-level header, body).

## Requirements

- Functional: browser download; 25 columns order; header groups for Gia hạn + Người phê duyệt
- Non-functional: no server; lib size acceptable

## Related files

- Create: `web-ui/src/utils/export-unit-in-progress-xlsx.ts`
- Modify: `web-ui/package.json` add `exceljs` or `xlsx` (sheetjs)
- Optional: `public/templates/` not required if code-built

## Implementation steps

1. Choose lib: prefer `exceljs` for merges/styles; or `xlsx` lighter
2. Sheet name e.g. `Danh sách nhiệm vụ đơn vị`
3. Rows: national motto (optional), report title, asOf line, total line, blank, header, subheader, data
4. Merge cells for header groups col20–21, 22–24
5. Column widths practical for long titles
6. Filename: `bao_cao_nhiem_vu_dang_thuc_hien_don_vi_YYYYMMDDHHmmss.xlsx`
7. Trigger download via Blob + anchor

## Success criteria

- [ ] File opens in Excel/LibreOffice
- [ ] 25 data columns present
- [ ] Total matches builder row count
- [ ] Build green with new dep

## Risks

- Bit-perfect .xls OLE out of scope — document xlsx OK for khách
