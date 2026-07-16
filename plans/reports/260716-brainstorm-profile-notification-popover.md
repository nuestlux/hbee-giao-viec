---
title: "Brainstorm: Profile + Notification popover (sidebar footer)"
date: 2026-07-16
status: approved
mode: ck-brainstorm
project: "Giao viec hbee / web-ui"
screenshot: "Downloads/Screenshot 2026-07-116 152616.png"
---

# Brainstorm: Profile user + Notification kiểu screenshot

## Summary

Footer sidebar: avatar (online), tên, role, chevron + chuông badge.  
Click user → menu tối (Cài HT / Đổi MK / Về chúng tôi / Đăng xuất).  
Click chuông → popover list notif + «Xem tất cả».  
Đổi MK = modal admin (không self-reset).

## Problem

- MainLayout bỏ top header; notif = full page only; profile = logout thô.
- User muốn UX dropdown gọn như screenshot SaaS.

## Requirements

| # | Req |
|---|---|
| 1 | Footer: Avatar + green dot + name + role + chevron + Bell+badge |
| 2 | Profile menu dark: Cài hệ thống (RBAC) · Thay đổi MK (modal admin) · Về chúng tôi · Đăng xuất |
| 3 | Bell → popover 8 notif newest; click mark read + navigate; Xem tất cả → /notifications |
| 4 | Outside click / Esc close; one panel open at a time |
| 5 | Mobile drawer: same footer |

### Acceptance

- [ ] Footer matches screenshot pattern
- [ ] Profile menu 4 items; logout works
- [ ] Bell panel shows store notifications + unread style
- [ ] SPECIALIST không thấy Cài hệ thống nếu !user.manage
- [ ] Đổi MK modal: liên hệ admin

### Out of scope

- Real password change API
- Push/WebSocket
- Re-enable full top Header

### Touchpoints

- Modify: `src/layouts/Sidebar.tsx`
- Create (optional split): `src/layouts/UserAccountMenu.tsx`, `src/layouts/NotificationPopover.tsx`
- Soft: `src/layouts/Header.tsx` unused
- Store: existing notification actions
- Modal: existing + help copy for password

## Approaches

| | Decision |
|---|---|
| A Footer popover | **Chọn** |
| B Top header | Reject |
| C Both | Reject |

## Design detail

### Footer bar
```
┌─────────────────────────────────────┐
│ [Avatar●]  Name              [⌃][🔔]│
│            Role                     │
└─────────────────────────────────────┘
```

### Profile menu (dark slate)
- Settings → /system/users if hasPermission user.manage else hide
- Key → modal forgot-password policy copy
- Info → /about or modal app info (name UBND, version mock)
- Logout red

### Notif panel
- Header: Thông báo | Đánh dấu tất cả đã đọc
- List item: icon by type, title, time relative, unread bg
- Footer link: Xem tất cả

## Risks

| Risk | Mitigation |
|---|---|
| z-index under drawer | z-50+ relative footer |
| Two popovers | mutual exclusive state |

## Next

Implement Sidebar (or cook) — small scope, plan optional 1 phase.

## Unresolved

None — approved 2026-07-16.
