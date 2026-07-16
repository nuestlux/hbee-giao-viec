---
title: "User active/deactive harden + dashboard isActive"
date: "2026-07-16"
status: implemented
project: "Downloads/Giao viec hbee/web-ui"
---

# Active / Deactive users + dashboard

## Finding
Core đã có (`toggleUserActive`, login block, filter). Gap: UX/confirm/RBAC/seed/chart clarity.

## Done (Approach A)
- Users: ConfirmDialog khóa/mở, nút text, RBAC `user.manage`+lãnh đạo
- Seed 2 user inactive (user-012, user-014)
- Dashboard card: `X hoạt động · Y đã khóa`
- Chart: pie Trạng thái (active/locked) + pie Vai trò (chỉ active)
- Live via Zustand `users`

## Acceptance
- [x] Toggle + confirm
- [x] Permission gate
- [x] Chart/card from isActive
- [x] Seed inactive demo
