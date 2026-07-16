---
title: "Cook report: CRUD Văn bản đến + RBAC"
date: 2026-07-16
plan: plans/260716-incoming-docs-crud-rbac
status: done
---

# Cook report

## Summary

Plan already implemented. Cook verified AC, code-reviewed, fixed high/medium issues. tsc pass.

## Acceptance

| AC | Result |
|---|---|
| CLERK C/R/U/D | OK |
| SPECIALIST R only | OK |
| CHAIRMAN/ADMIN full | OK |
| Modal detail / edit / delete block taskIds | OK |
| No API/MinIO | OK |

## Review fixes applied

1. `updateDocument` field allowlist (no taskIds mass-assign)
2. Seed `doc-020` taskIds=[] for delete happy path
3. Seed `doc-021` TOI_MAT for redaction demo
4. Search không leak TOI_MAT subject
5. Toast ok/err variants
6. Delete button disabled UX when has tasks

## Files

- `src/utils/permissions.ts`
- `src/pages/IncomingDocuments.tsx`
- `src/store/useStore.ts`
- `src/data/mockData.ts`

## Unresolved

- None for mock scope
- Production API RBAC still phase-02/04
