---
phase: 8
title: "Thông báo, nhắc hạn và background jobs"
status: pending
priority: P1
dependencies: [5, 6, 7]
---

# Phase 08: Thông báo, nhắc hạn và background jobs

## Overview

Tạo thông báo tin cậy cho giao việc, phối hợp, sắp hạn, quá hạn và phê duyệt mà không mất hoặc gửi trùng khi worker khởi động lại.

## Requirements

- pg-boss + transactional outbox; job idempotent, retry/backoff, dead-letter.
- In-app notification là MVP; email/SMS/Zalo qua adapter ở release sau.
- Thông báo kênh không an toàn không chứa trích yếu/nội dung mật.
- Deadline tính theo `Asia/Ho_Chi_Minh`, lưu thời điểm UTC.

## Related Code Files

- Create: `apps/api/src/modules/notifications/`, `outbox/`
- Create: `apps/worker/src/jobs/`, `infrastructure/pg-boss/`
- Create: `apps/web/src/features/notifications/`
- Modify: modules `tasks`, `approvals` để phát domain events

## Implementation Steps

1. Tạo OutboxEvent, Notification, NotificationPreference.
2. Phát event giao việc, tiếp nhận, tiến độ, chờ duyệt, kết quả duyệt.
3. Worker xử lý outbox với dedupe key và retry.
4. Scheduler tạo nhắc trước hạn 3 ngày, 1 ngày và khi quá hạn theo cấu hình.
5. Tạo notification center, unread count, mark read và deep link.
6. Thêm dashboard job lỗi/dead-letter cho quản trị vận hành.

## Success Criteria

- [ ] Restart worker không mất hoặc nhân đôi thông báo.
- [ ] Fake-clock test qua đủ biên đúng hạn/quá hạn.
- [ ] Deep link không làm lộ đối tượng không có quyền.
- [ ] Không có nội dung mật trong payload kênh ngoài.

## Risk Assessment

Chống notification storm bằng dedupe, digest và rate limit. Notification không bao giờ là nguồn sự thật; trạng thái luôn đọc từ DB nghiệp vụ.

