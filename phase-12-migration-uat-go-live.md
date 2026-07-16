---
phase: 12
title: "Migration, UAT và go-live"
status: pending
priority: P1
dependencies: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
---

# Phase 12: Migration, UAT và go-live

## Overview

Nhập dữ liệu thực tế, đào tạo người dùng, pilot, nghiệm thu và đưa hệ thống vào vận hành có khả năng rollback.

## Requirements

- Import upload → preview/validate → commit; lỗi theo dòng/cột.
- `external_task_id` idempotent; không ghi đè dữ liệu thủ công ngoài mapping được duyệt.
- UAT theo vai trò và luồng P1; reconciliation báo cáo và attachment.
- Integration ngoài chỉ triển khai khi có API, owner và contract test.

## Related Code Files

- Create: `apps/api/src/modules/imports/`, `integrations/`
- Create: `scripts/migration/`, `tests/uat/`, `tests/fixtures/import/`
- Create: `docs/user-guide/`, `docs/runbooks/go-live.md`

## Implementation Steps

1. Chốt mapping Excel cũ sang entity, enum và trường lỗi cần đối soát.
2. Implement import preview/commit idempotent và exception report.
3. Dry-run nhiều lần trên bản sao, đối soát tổng và theo trạng thái/phòng ban.
4. Viết UAT theo vai trò; đào tạo quản trị, văn thư, lãnh đạo, cán bộ.
5. Pilot một phòng/bộ phận và sửa blocker.
6. Diễn tập migration, smoke test và rollback.
7. Cutover production; hypercare 1–2 tuần; khóa yêu cầu mới trừ blocker.
8. Đưa backlog SSO/ký số/liên thông/email/SMS/Zalo vào release riêng nếu được duyệt.

## Success Criteria

- [ ] 100% bản ghi hợp lệ được nhập; bản ghi lỗi có owner xử lý.
- [ ] Import cùng dữ liệu hai lần không nhân đôi nhiệm vụ.
- [ ] UAT không còn blocker/critical và có sign-off nghiệp vụ.
- [ ] Production smoke test pass login, văn bản, nhiệm vụ, duyệt, báo cáo và file.
- [ ] Có owner vận hành, kênh hỗ trợ và rollback đã diễn tập.

## Risk Assessment

Excel lịch sử có thể bẩn và thiếu trường. Không tự suy đoán enum; preview, mapping table và BA sign-off là bắt buộc. Core workflow không phụ thuộc đồng bộ vào API tích hợp bên ngoài.

