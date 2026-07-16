---
phase: 2
title: "IAM, đăng nhập và RBAC"
status: pending
priority: P1
dependencies: [1]
---

# Phase 02: IAM, đăng nhập và RBAC

## Overview

Xây nền bảo mật: tài khoản, session, vai trò, permission, phạm vi tổ chức/phòng ban và audit. Đây là điều kiện trước mọi dữ liệu nghiệp vụ.

## Requirements

- Argon2id; session cookie HttpOnly/Secure/SameSite; revoke khi khóa tài khoản.
- RBAC kết hợp scope: tổ chức, phòng ban, quan hệ với đối tượng và mức độ mật.
- API là lớp kiểm soát cuối; ẩn menu/nút phía web chỉ hỗ trợ UX.
- Quản trị kỹ thuật không mặc nhiên có quyền đọc tài liệu mật.

## Related Code Files

- Create: `apps/api/src/modules/auth/`, `iam/`, `users/`, `audit/`
- Create: `apps/api/src/common/guards/`, `policies/`
- Create: `apps/web/src/features/auth/`, `users/`, `roles/`
- Modify: `apps/api/prisma/schema.prisma`

## Implementation Steps

1. Tạo User, Session, Role, Permission, RolePermission, RoleAssignment.
2. Implement login/logout/đổi mật khẩu/revoke session/rate limit.
3. Tạo permission guard và object-scope policy dùng lại ở mọi module.
4. Tạo trang người dùng, khóa/mở tài khoản, gán vai trò và ma trận quyền.
5. Tạo audit append-only cùng transaction cho thay đổi quyền và đăng nhập nhạy cảm.
6. Viết test ma trận `role × organization × department × relationship`.

## Success Criteria

- [ ] Endpoint nghiệp vụ từ chối người chưa xác thực.
- [ ] Người phòng A không đọc/sửa đối tượng phòng B nếu không liên quan.
- [ ] Khóa người dùng làm mất quyền và vô hiệu session hiện tại.
- [ ] Thay đổi quyền có audit before/after đã lọc dữ liệu nhạy cảm.

## Risk Assessment

Rủi ro cao nhất là IDOR/BOLA và role explosion. Mọi query phải nhận security context; dùng permission + scope thay vì tạo vai trò cho từng trường hợp.

