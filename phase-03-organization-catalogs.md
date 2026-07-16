---
phase: 3
title: "Cơ cấu tổ chức và danh mục"
status: pending
priority: P1
dependencies: [2]
---

# Phase 03: Cơ cấu tổ chức và danh mục

## Overview

Cấu hình xã/phường, phòng ban, chức vụ, membership theo thời gian và các danh mục dùng xuyên hệ thống.

## Requirements

- Cây phòng ban không có vòng; membership có ngày hiệu lực.
- Danh mục gồm loại văn bản, loại nhiệm vụ, lĩnh vực, độ khẩn, độ mật, ưu tiên.
- Bản ghi đã dùng chỉ được deactivate/archive, không hard-delete.
- Import có preview, validation và báo lỗi dòng/cột.

## Related Code Files

- Create: `apps/api/src/modules/organization/`, `catalogs/`
- Create: `apps/web/src/features/departments/`, `catalogs/`
- Modify: `apps/api/prisma/schema.prisma`, `prisma/seed.ts`

## Implementation Steps

1. Tạo Organization, Department, Position, DepartmentMembership.
2. CRUD cây phòng ban, trưởng/phó phòng và người dùng kiêm nhiệm.
3. CRUD/seed danh mục và quy tắc deactivate.
4. Import phòng ban/người dùng theo upload → preview → commit.
5. Áp permission quản trị và audit thay đổi cơ cấu.

## Success Criteria

- [ ] Quản trị cấu hình đủ cơ cấu trước khi nhập nghiệp vụ.
- [ ] Dropdown lấy từ danh mục chung, không hardcode ở web.
- [ ] Không tạo được cây phòng ban vòng hoặc mã trùng.
- [ ] Ngừng hoạt động không làm hỏng dữ liệu lịch sử.

## Risk Assessment

Thiết kế membership theo thời gian từ đầu để báo cáo lịch sử không đổi khi cán bộ chuyển phòng. Import không tự ghi đè bản ghi nghi ngờ trùng.

