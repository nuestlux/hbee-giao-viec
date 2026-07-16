---
phase: 7
title: "Gia hạn và phê duyệt"
status: pending
priority: P1
dependencies: [5, 6]
---

# Phase 07: Gia hạn và phê duyệt

## Overview

Chuẩn hóa xin gia hạn, duyệt/từ chối, phê duyệt hoàn thành, trả lại và mở lại nhiệm vụ.

## Requirements

- ExtensionRequest lưu hạn cũ, hạn đề nghị, lý do, minh chứng và quyết định.
- Hạn hiện hành chỉ đổi sau khi phê duyệt trong transaction.
- Chống tự phê duyệt mặc định và chống hai quyết định đồng thời.
- Mở lại nhiệm vụ không xóa lần hoàn thành cũ.

## Related Code Files

- Create: `apps/api/src/modules/approvals/`, `task-extensions/`
- Create: `apps/web/src/features/approvals/`, `task-extensions/`
- Modify: `apps/api/prisma/schema.prisma`

## Implementation Steps

1. Tạo ExtensionRequest, ApprovalDecision và CompletionHistory.
2. Implement xin gia hạn, duyệt, từ chối, yêu cầu bổ sung.
3. Tạo inbox “Chờ tôi phê duyệt” và delegation có thời hạn.
4. Implement phê duyệt hoàn thành, trả lại, mở lại có lý do.
5. Dùng version/unique decision constraint để chỉ một quyết định thắng.
6. Audit người duyệt, thời điểm, ý kiến, hạn cũ/mới.

## Success Criteria

- [ ] Không sửa được hạn trực tiếp sau khi giao.
- [ ] Báo cáo phân biệt đúng quá hạn và gia hạn hợp lệ.
- [ ] Hai người duyệt đồng thời chỉ một người thành công.
- [ ] Mọi quyết định có lịch sử bất biến.

## Risk Assessment

MVP chỉ một cấp phê duyệt; data model có thể mở rộng nhưng không xây workflow engine. Quy tắc delegation phải thu hồi ngay khi hết hạn hoặc người ủy quyền bị khóa.

