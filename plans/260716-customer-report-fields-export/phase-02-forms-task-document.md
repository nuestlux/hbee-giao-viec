---
phase: 2
title: "Forms Task + IncomingDocument fields"
status: pending
priority: P1
dependencies: [1]
---

# Phase 02: Forms capture new fields

## Overview

User can enter all persist fields needed for 25-col report on Task and Incoming Document.

## Requirements

- Functional: create/edit task + document forms include new fields; detail view shows them
- Non-functional: optional fields allow empty; Vietnamese labels short ERP style

## Related files

- Modify: `web-ui/src/pages/Tasks.tsx` (create/edit modal)
- Modify: `web-ui/src/pages/TaskDetail.tsx`
- Modify: `web-ui/src/pages/IncomingDocuments.tsx`
- Modify: `web-ui/src/store/useStore.ts` if add/update strips unknown keys
- Optional: list columns show sourceKind / external id

## Implementation steps

1. Task form sections:
   - Chủ trì: LĐVP (text/select user), đơn vị (existing), phối hợp (existing multi)
   - Đầu mối: `focalPointText` textarea short
   - Nguồn: sourceKind select + sourceCitation; prefill from document if linked
   - Kết quả / Lộ trình: executionResult, roadmap
   - Phê duyệt: approver pick or free name/email/phone
   - externalTaskId
2. Document form: sourceKind, sourceCitation
3. On create task from document: copy source fields + documentNumber into citation
4. Store update paths preserve new fields
5. Keep assignee fields for in-app assignment (not report col 5)

## Success criteria

- [ ] Save/reload mock state keeps new fields
- [ ] Empty optional OK
- [ ] Build green

## Risks

- Modal form too long → accordion/tabs “Báo cáo / Phê duyệt”
