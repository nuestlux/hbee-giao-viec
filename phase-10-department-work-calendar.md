---
phase: 10
title: "Công việc phòng và lịch công việc"
status: pending
priority: P2
dependencies: [3, 5, 6, 8]
---

# Phase 10: Công việc phòng và lịch công việc

## Overview

Quản lý công việc nội bộ phòng và lịch hạn mà không làm nhiễu báo cáo nhiệm vụ chỉ đạo cấp xã/phường.

## Requirements

- Reuse task core với `scope=DEPARTMENT`; tách policy, field và query.
- List/Kanban/calendar dùng cùng nguồn deadline.
- Công việc phòng có checklist, đầu mối, phối hợp và tiến độ nhanh.
- Không xuất vào báo cáo nhiệm vụ cấp xã nếu không được chuyển loại rõ ràng.

## Related Code Files

- Create: `apps/api/src/modules/department-work/`, `calendar/`
- Create: `apps/web/src/features/department-work/`, `calendar/`
- Modify: task core policies và `apps/api/prisma/schema.prisma`

## Implementation Steps

1. Bổ sung scope/policy công việc phòng trên task core.
2. Tạo CRUD, checklist, giao việc nội bộ và cập nhật nhanh.
3. Tạo list/Kanban và filter theo phòng/cán bộ/trạng thái.
4. Tạo lịch ngày/tuần/tháng từ deadline và milestone.
5. Nếu cho drag/drop đổi hạn, yêu cầu xác nhận, policy và audit.
6. Bổ sung ngày nghỉ/lễ chỉ khi BA xác nhận tính theo ngày làm việc.

## Success Criteria

- [ ] Phòng ban không xem/sửa công việc phòng khác ngoài quyền.
- [ ] Deadline trên list, Kanban và lịch luôn đồng nhất.
- [ ] Công việc phòng không xuất nhầm vào báo cáo cấp xã.
- [ ] Trưởng phòng/ủy quyền mới được giao việc cấp phòng.

## Risk Assessment

Không tạo entity workflow thứ hai gây trùng logic. MVP không đồng bộ Google/Outlook và không kéo thả nếu chưa có nhu cầu rõ.

