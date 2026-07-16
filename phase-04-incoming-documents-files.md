---
phase: 4
title: "Văn bản đến và quản lý tệp"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 04: Văn bản đến và quản lý tệp

## Overview

Tiếp nhận, phân loại, tra cứu văn bản và dùng văn bản làm nguồn tạo một hoặc nhiều nhiệm vụ.

## Requirements

- Số/ký hiệu, ngày, cơ quan ban hành, trích yếu, loại, lĩnh vực, độ khẩn/mật.
- File lưu MinIO; DB chỉ lưu metadata, checksum và trạng thái quét.
- Download kiểm tra lại quyền và dùng URL ký ngắn hạn.
- Hỗ trợ cảnh báo trùng và phân quyền need-to-know.

## Related Code Files

- Create: `apps/api/src/modules/incoming-documents/`, `attachments/`
- Create: `apps/api/src/infrastructure/minio/`
- Create: `apps/web/src/features/incoming-documents/`, `shared/file-upload/`
- Modify: `apps/api/prisma/schema.prisma`

## Implementation Steps

1. Tạo IncomingDocument, Attachment, ObjectAccessGrant và history.
2. Tạo danh sách/chi tiết/form với filter, sort, pagination, tìm kiếm.
3. Upload staging, kiểm tra tên/MIME/kích thước/checksum, finalize sau DB commit.
4. Cách ly file chờ quét; không cho người dùng thường tải file chưa an toàn.
5. Cảnh báo trùng số/ký hiệu/cơ quan/ngày; không unique cứng nếu BA chưa xác nhận.
6. Thêm hành động “Tạo nhiệm vụ từ văn bản”.

## Success Criteria

- [ ] Văn thư nhập và tra cứu được văn bản cùng file.
- [ ] Một văn bản tạo được nhiều nhiệm vụ mà vẫn truy nguyên nguồn.
- [ ] Người không có quyền không lấy được file bằng đổi ID/URL.
- [ ] File orphan và file staging hết hạn được dọn bằng job.

## Risk Assessment

Chống MIME giả, zip bomb, path traversal và rò rỉ file mật. Nếu ClamAV chưa sẵn sàng, không được coi upload file là production-ready.

