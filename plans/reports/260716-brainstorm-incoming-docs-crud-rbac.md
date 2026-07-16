---
title: "Brainstorm: CRUD Văn bản đến + RBAC UI"
date: 2026-07-16
status: approved
mode: ck-brainstorm
project: "Giao viec hbee / web-ui"
screenshot: "Downloads/Screenshot 2026-07-16 152053.png"
---

# Brainstorm: Hoàn thiện CRUD Văn bản đến + phân quyền

## Summary

Màn `/documents` (screenshot): list + create nửa vời. Chốt: **CRUD mock đầy đủ** + **RBAC client** theo `document.*`; detail **modal**; thêm `document.delete`. Không backend/MinIO.

## Problem statement

- Users: văn thư, lãnh đạo, chuyên viên.
- Struggle: xem/sửa/xóa không chạy; mọi role cùng UI.
- Cause: mock UI incomplete; permissions seed unused.
- Success: CRUD work + nút/action theo quyền; demo login switch role verify.

## Requirements (exact)

| # | Req |
|---|---|
| 1 | **C** Create: «Tiếp nhận» + form validate + toast |
| 2 | **R** View: modal chi tiết đủ field + attachments mock |
| 3 | **U** Edit: form reuse, `updateDocument` |
| 4 | **D** Delete: ConfirmDialog + `deleteDocument` |
| 5 | Perm: create/view/edit/delete; hide + store guard |
| 6 | Seed: `document.delete`; CHAIRMAN, CLERK, ADMIN |
| 7 | TOI_MAT: che trích yếu nếu chỉ view thường |
| 8 | Download: mock toast / empty state |

### Acceptance

- [ ] CLERK: C/R/U/D + view
- [ ] SPECIALIST: R only (no C/U/D buttons)
- [ ] CHAIRMAN/ADMIN: full
- [ ] Eye opens detail modal
- [ ] Edit/delete refresh list
- [ ] No document.view → redirect or empty gate

### Out of scope

- NestJS, MinIO, ClamAV
- Create task from document
- Soft-delete / import

### Constraints / touchpoints

- `web-ui/src/pages/IncomingDocuments.tsx`
- `web-ui/src/utils/permissions.ts` (new)
- `web-ui/src/data/mockData.ts` (perms + roles)
- `web-ui/src/store/useStore.ts` (guards)
- Optional: Sidebar hide menu
- Stack: React + Zustand mock

## Approaches evaluated

| Approach | Decision |
|---|---|
| A CRUD mock + RBAC UI | **Chọn** |
| B CRUD no RBAC | Reject (user needs quyền) |
| C Full phase-04 API | Reject (no API codebase) |
| Detail modal | **Chọn** |
| Detail route | Reject |

## Final design

### Permission helper

```ts
// permissions.ts
hasPermission(user, roles, code): boolean
// map user.role (UserRole) → roles.find(r => r.code === user.role)
```

### Matrix

| Role code | create | view | edit | delete |
|---|---|---|---|---|
| CHAIRMAN | ✓ | ✓ | ✓ | ✓ |
| VICE_CHAIRMAN | ✓ | ✓ | ✓ | ✓ (same role-01) |
| DEPT_HEAD | ✓ | ✓ | — | — |
| DEPT_DEPUTY | — | ✓ | — | — |
| SPECIALIST | — | ✓ | — | — |
| CLERK | ✓ | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✓ | ✓ | ✓ |

Note: VICE_CHAIRMAN uses CHAIRMAN role pack in seed role-01.

### UI flow

1. List actions per row: View | Edit? | Delete? | Download
2. View modal: fields + file list; buttons Edit/Delete if allowed
3. Create/Edit modal: shared form fields
4. Delete: ConfirmDialog

### Store guards

- `addDocument` require create
- `updateDocument` require edit  
- `deleteDocument` require delete
- No-op + optional console/audit if denied

## Implementation notes

1. Add `document.delete` to permissions + role arrays.
2. Implement `hasPermission` util.
3. Rewrite IncomingDocuments actions + detail modal + edit mode.
4. Wire `updateDocument`/`deleteDocument` from store.
5. Gate page if !view.
6. Manual test: login 3 roles (clerk, specialist, chairman).

## Risks

| Risk | Mitigation |
|---|---|
| Client RBAC bypass | Accept for mock; real API later |
| Role code mismatch UserRole vs roles[].code | Map explicitly; VICE_CHAIRMAN → chairman pack |
| Hard delete breaks task refs | Soft message if taskIds.length; block delete or clear links |

**Delete rule:** if `taskIds.length > 0` → block delete + toast «Đang gắn nhiệm vụ, không xóa».

## Success metrics

- CRUD smoke pass 4 ops
- 2+ roles show different buttons
- Screenshot parity + extra actions

## Next steps

1. `/ck:plan` 1–2 phase hoặc cook trực tiếp
2. Implement + verify 3 demo accounts

## Unresolved questions

- None — design approved 2026-07-16.
