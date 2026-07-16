---
title: "Brainstorm: Login help links (forgot password / get account)"
date: 2026-07-16
status: approved
mode: ck-brainstorm
project: "Giao viec hbee / web-ui"
---

# Brainstorm: Form login — bổ sung nút hướng dẫn admin

## Summary

Form login thiếu link hỗ trợ. Policy nội bộ: **không** self-reset, **không** self-register. Chốt UI: 2 text-link + modal chữ chung (liên hệ quản trị viên).

## Problem statement

- User context: cán bộ xã/phường, TK do admin cấp.
- Struggle: form chỉ có Đăng nhập + demo → thiếu “quên MK” / “chưa có TK”.
- Cause: mock auth MVP chỉ làm login/logout.
- Consequence: user nghĩ thiếu tính năng hoặc bấm nhầm.
- Success: 2 link rõ; modal nói đúng policy admin.

## Requirements (exact)

| # | Requirement |
|---|---|
| 1 | Link **Quên mật khẩu?** → modal: liên hệ quản trị viên để **reset** mật khẩu |
| 2 | Link **Chưa có tài khoản?** → modal: tài khoản do **admin cấp**, liên hệ quản trị viên |
| 3 | Thông tin liên hệ: **chữ chung** — không SĐT/email cụ thể |
| 4 | Không form reset / không form đăng ký / không gửi email |
| 5 | Giữ login mock hiện tại (email + password demo) |

### Acceptance criteria

- [ ] Dưới nút Đăng nhập có 2 link: Quên mật khẩu? · Chưa có tài khoản?
- [ ] Bấm từng link mở modal đúng copy policy
- [ ] Modal có nút Đóng; không submit data
- [ ] Không route `/forgot` / `/register`
- [ ] Login demo vẫn pass

### Out of scope

- NestJS/API auth, Argon2, session cookie production
- Email OTP / forgot-password flow
- Public signup
- Đổi header/sidebar logout

### Constraints

- Stack lock: React + Vite + Zustand mock
- Touchpoint chính: `web-ui/src/pages/Login.tsx`
- Optional reuse: `web-ui/src/components/Modal.tsx` (nếu API phù hợp)
- KISS/YAGNI — 1 file là đủ

## Approaches evaluated

| Approach | Pros | Cons | Decision |
|---|---|---|---|
| **A. Link + modal** | Rõ “nút”, KISS, 1 page | — | **Chọn** |
| B. Trang `/forgot` `/register` | SEO-like consumer | Over-engineer mock | Reject |
| C. Text tĩnh không bấm | Ít code | Vẫn “thiếu nút” | Reject (user) |

## Final design

### Layout

```
[ Email ]
[ Password ]
[ Đăng nhập ]

Quên mật khẩu?  ·  Chưa có tài khoản?
```

### Copy (vi)

**Modal quên MK**
- Title: Quên mật khẩu
- Body: Bạn không thể tự đặt lại mật khẩu trên hệ thống. Vui lòng liên hệ quản trị viên để được reset mật khẩu.
- CTA: Đóng

**Modal chưa có TK**
- Title: Chưa có tài khoản
- Body: Hệ thống không hỗ trợ đăng ký tự do. Tài khoản do quản trị viên cấp. Vui lòng liên hệ quản trị viên để được tạo tài khoản.
- CTA: Đóng

### State

- `helpModal: null | 'forgot' | 'register'`
- Không đổi store auth

## Implementation notes

1. `Login.tsx`: thêm 2 button `type="button"` text style.
2. Modal: reuse `Modal` component hoặc dialog Tailwind local.
3. Giữ block demo accounts (dev only) — không conflict policy production copy.
4. Khi có backend phase-02: copy modal vẫn đúng; chỉ admin UI reset password sau.

## Risks

| Risk | Mitigation |
|---|---|
| User expect real email reset | Copy modal dứt khoát “không tự reset” |
| Demo block confuse production | Có thể ẩn demo sau UAT (ngoài scope) |

## Success metrics

- User tự hiểu: quên MK / cần TK → hỏi admin
- Zero dead-end (mọi link có feedback)

## Next steps

1. Implement theo design (cook / plan 1 phase)
2. Smoke: open http://localhost:5173/login → 2 modal + login
3. Không cần plan multi-phase

## Unresolved questions

- None — design approved 2026-07-16.
