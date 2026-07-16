---
title: "CRUD Văn bản đến + RBAC UI"
status: completed
created: "2026-07-16"
source: brainstorm-260716-incoming-docs-crud-rbac
stack: "React, Zustand mock"
---

# Plan: CRUD Văn bản đến + phân quyền

Brainstorm: `plans/reports/260716-brainstorm-incoming-docs-crud-rbac.md`

## Phases

| # | Phase | Status |
|---|---|---|
| 01 | Permission util + seed `document.delete` | completed |
| 02 | Store guards + IncomingDocuments CRUD UI | completed |

## Acceptance

- [x] CLERK: C/R/U/D; SPECIALIST: R only; CHAIRMAN/ADMIN: full
- [x] Modal chi tiết; edit form; delete confirm (block nếu có taskIds)
- [x] Không API/MinIO
- [x] Review fixes: update allowlist, seed xóa được, TOI_MAT seed, search redaction

## Cook log (2026-07-16)

- Verified plan already implemented
- code-reviewer: fixed high/medium findings
- tsc pass
