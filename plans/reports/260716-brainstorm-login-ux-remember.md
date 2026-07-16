---
title: "Brainstorm: Login UX polish + Ghi nhớ đăng nhập"
date: 2026-07-16
status: approved
mode: ck-brainstorm
project: "Giao viec hbee / web-ui"
related: "260716-brainstorm-login-help-links.md"
---

# Brainstorm: UX/UI login chuẩn + Ghi nhớ đăng nhập

## Summary

Chỉnh form login theo pattern web phổ biến. Checkbox **Ghi nhớ đăng nhập** = lưu email + persist session; **không** lưu password trong app. Giữ policy admin (quên MK / cấp TK).

## Problem statement

- Users expect login giống Google/gov SaaS: empty fields, Remember + Forgot một hàng, hierarchy rõ.
- Current: prefill demo, demo block lớn, thiếu Remember, help links dưới CTA.
- “Lưu mật khẩu” user intent → industry **Remember me**, not app-side password store.

## Requirements (exact)

| # | Req |
|---|---|
| 1 | Layout pattern chuẩn: split brand + card; fields mặc định trống |
| 2 | Checkbox **Ghi nhớ đăng nhập** (trái); **Quên mật khẩu?** (phải) cùng hàng dưới password |
| 3 | CTA Đăng nhập full width; **Chưa có tài khoản?** dưới CTA |
| 4 | Remember ON + login OK → save email + session `localStorage` |
| 5 | Remember OFF + login OK → clear saved email; session `sessionStorage` only |
| 6 | Không lưu password app-side |
| 7 | Modal admin (forgot/register) giữ nguyên policy |
| 8 | Demo accounts: collapsible footer |

### Acceptance

- [ ] Open `/login` → empty email/password unless remembered email
- [ ] Checkbox visible, label «Ghi nhớ đăng nhập»
- [ ] Remember flow works across reload
- [ ] No-remember: close tab ends session (sessionStorage)
- [ ] No password key in localStorage
- [ ] Help modals still open

### Out of scope

- NestJS/cookies production
- Browser password manager UI custom
- Full visual redesign beyond login page
- Storing plaintext password

### Constraints / touchpoints

- `web-ui/src/pages/Login.tsx`
- `web-ui/src/auth/session.ts` (new keys + storage split)
- `web-ui/src/store/useStore.ts` (login/logout respect storage mode)
- Tailwind + existing Modal

## Approaches evaluated

| | Pros | Cons | Decision |
|---|---|---|---|
| **A. Pattern chuẩn + Remember me** | UX quen, an toàn hơn | sessionStorage subtle | **Chọn** |
| B. Chỉ thêm checkbox | Nhanh | Prefill demo vẫn lạ | Reject |
| C. Lưu password localStorage | “Đúng chữ” user | Security debt | Reject |
| Centered card only | Mobile clean | Mất brand panel | Reject (user) |

## Final design

### Storage keys

```
hbee-auth-user-id     → sessionStorage OR localStorage (by remember)
hbee-auth-remember    → "1" | remove
hbee-auth-email       → last email if remember
```

### Layout

```
[Email]
[Password] [eye]
[✓ Ghi nhớ đăng nhập]          [Quên mật khẩu?]
[          Đăng nhập           ]
        Chưa có tài khoản?
─── Tài khoản dùng thử (▼) ───
```

### Copy

- Checkbox: `Ghi nhớ đăng nhập`
- Forgot/register modal: unchanged from prior brainstorm

## Implementation notes

1. `session.ts`: helpers load/save remember email; saveSessionUserId(userId, { remember }); clear both storages on logout.
2. `useStore.login`: accept optional `remember?: boolean` or read from caller after success.
3. `Login.tsx`: empty defaults; hydrate email from storage; wire checkbox; collapsible demo; remove “demo UI” badge or soften.
4. Logout: clear userId both storages; keep remembered email if remember flag set.

## Risks

| Risk | Mitigation |
|---|---|
| User expects password autofill by checkbox | Label «Ghi nhớ đăng nhập» + browser autocomplete |
| sessionStorage surprise | Expected for “không ghi nhớ” |
| Demo collapse hide for PO | Default collapsed, one click expand |

## Success metrics

- Login feels familiar vs common web apps
- Remember works without password in storage
- Policy admin links intact

## Next steps

1. Implement (1–2 files, no multi-phase plan required)
2. Smoke on http://localhost:5173/login

## Unresolved questions

- None — approved 2026-07-16.
