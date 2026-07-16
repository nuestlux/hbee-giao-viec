---
phase: 6
title: "Tiến độ, trao đổi và minh chứng"
status: pending
priority: P1
dependencies: [5]
---

# Phase 06: Tiến độ, trao đổi và minh chứng

## Overview

Cho phép cán bộ cập nhật tiến độ, khó khăn, đề xuất, lộ trình, trao đổi và nộp kết quả có minh chứng.

## Requirements

- Progress 0–100; giảm tiến độ phải có lý do hoặc quyền đặc biệt.
- Timeline hợp nhất status, progress, comment, file và audit nghiệp vụ.
- Nội dung render an toàn, chống XSS; lịch sử quan trọng không được xóa.
- Nộp kết quả chuyển nhiệm vụ sang WAITING_APPROVAL.

## Related Code Files

- Create: `apps/api/src/modules/task-progress/`, `comments/`, `submissions/`
- Create: `apps/web/src/features/task-detail/`, `task-progress/`, `comments/`
- Modify: `apps/api/prisma/schema.prisma`

## Implementation Steps

1. Tạo ProgressUpdate, TaskComment, CompletionSubmission và attachment link.
2. Tạo timeline cursor pagination với index `(task_id, created_at)`.
3. Form cập nhật tiến độ, khó khăn, đề xuất, bước tiếp theo và minh chứng.
4. Mention người dùng; deep link có kiểm tra quyền.
5. Implement nộp kết quả, trả lại bổ sung và nộp lại.
6. Sanitize input, escape output và test script/HTML injection.

## Success Criteria

- [ ] Lãnh đạo xem được toàn bộ diễn biến tại một màn hình.
- [ ] Mỗi kết quả có người nộp, thời điểm, nội dung và minh chứng.
- [ ] Người phối hợp chỉ sửa phần được cấp quyền.
- [ ] Timeline vẫn phản hồi tốt với lịch sử dài.

## Risk Assessment

Không dùng phần trăm như dữ liệu hình thức: BA quy định thời điểm bắt buộc có mô tả. Bình luận có thể soft-delete nhưng sự kiện xóa phải còn audit.

