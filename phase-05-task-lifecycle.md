---
phase: 5
title: "Vòng đời nhiệm vụ và giao việc"
status: pending
priority: P1
dependencies: [2, 3, 4]
---

# Phase 05: Vòng đời nhiệm vụ và giao việc

## Overview

Xây lõi sản phẩm: tạo, giao, tiếp nhận, từ chối, thực hiện và chuyển chờ duyệt theo state machine được BA ký.

## Requirements

- Workflow: DRAFT → ASSIGNED → ACCEPTED → IN_PROGRESS → WAITING_APPROVAL → COMPLETED.
- Nhánh: REJECTED, NEEDS_CHANGES, PAUSED, CANCELLED; OVERDUE là trạng thái tính toán.
- Đúng một đơn vị chủ trì; nhiều đơn vị phối hợp; một đầu mối chính.
- Có `external_task_id`, nguồn văn bản/text snapshot, optimistic locking và history.

## Related Code Files

- Create: `apps/api/src/modules/tasks/domain/`, `application/`, `presentation/`
- Create: `apps/web/src/features/tasks/`, `pages/tasks/`
- Create: `packages/contracts/src/task.ts`
- Modify: `apps/api/prisma/schema.prisma`

## Implementation Steps

1. Tạo Task, TaskAssignment, TaskMilestone, TaskStatusHistory, DueDateHistory.
2. Implement state machine và policy; không nhận status/audit fields trực tiếp từ client.
3. Tạo/sửa draft, giao, tiếp nhận, từ chối có lý do và hủy có thẩm quyền.
4. Tạo danh sách Tôi giao, Giao cho tôi, Phòng tôi, Phối hợp, Sắp hạn, Quá hạn.
5. Filter/search/pagination; lưu filter cá nhân nếu cần.
6. Audit mọi thay đổi trách nhiệm, nội dung, trạng thái và hạn.
7. Test concurrency khi hai người cùng sửa/chuyển trạng thái.

## Success Criteria

- [ ] Hoàn thành luồng từ văn bản đến nhiệm vụ đang thực hiện.
- [ ] Không thể bỏ qua transition hoặc tự nhận quyền qua payload.
- [ ] Lịch sử cho biết ai đổi gì, lúc nào và lý do.
- [ ] Quá hạn/đúng hạn nhất quán theo ngày chốt và `Asia/Ho_Chi_Minh`.

## Risk Assessment

Đây là phase cần red-team trước code. Khóa state machine MVP bằng ADR; không tổng quát hóa workflow engine. Nhiệm vụ chỉ có một chủ trì chính để tránh mất trách nhiệm giải trình.

