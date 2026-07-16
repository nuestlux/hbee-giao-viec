---
phase: 9
title: "Trang chủ, snapshot, báo cáo và Excel"
status: pending
priority: P1
dependencies: [3, 4, 5, 6, 7, 8]
---

# Phase 09: Trang chủ, snapshot, báo cáo và Excel

## Overview

Xây dashboard theo vai trò, báo cáo tại ngày chốt và Excel tương thích mẫu nguồn sau khi BA ký data dictionary.

## Requirements

- KPI: tổng, đang thực hiện, chờ duyệt, hoàn thành, đúng hạn, sắp hạn, quá hạn.
- ReportRun và ReportSnapshotRow lưu dữ liệu đã materialize, bộ lọc, template version, checksum.
- Báo cáo tại ngày X dùng dữ liệu có hiệu lực tại X, không dùng trạng thái hiện tại.
- Excel giữ mapping cột đã ký và chống formula injection.

## Related Code Files

- Create: `apps/api/src/modules/dashboard/`, `reporting/`, `exports/`
- Create: `apps/web/src/features/dashboard/`, `reports/`, `pages/home/`
- Create: `tests/fixtures/report-template/`, `tests/golden/`
- Modify: `apps/worker/src/jobs/export-report.job.ts`

## Implementation Steps

1. BA chốt data dictionary 26 cột, enum và công thức tiến độ.
2. Tạo read models/KPI có data scope và drill-down.
3. Tạo luồng preview → chốt snapshot → export → tải file.
4. Materialize snapshot bất biến cùng metadata và checksum.
5. Xuất Excel qua worker; trung hòa formula injection và giữ kiểu date/number.
6. Đối soát snapshot với dữ liệu mẫu 9 nhiệm vụ và golden file.
7. Index/EXPLAIN ANALYZE truy vấn aggregate; chỉ dùng materialized view khi có bằng chứng cần.

## Success Criteria

- [ ] KPI khớp 100% với fixture đã biết và không đếm dữ liệu ngoài quyền.
- [ ] Xuất lại cùng snapshot cho cùng dữ liệu/checksum nghiệp vụ.
- [ ] Excel mở không lỗi, đúng cột, kiểu dữ liệu và ngày chốt.
- [ ] Click KPI tới đúng danh sách nguồn.

## Risk Assessment

Đây là phase cần red-team. Không code trước khi BA ký định nghĩa đúng hạn, gia hạn và ngày chốt. Snapshot phải độc lập với thay đổi nguồn sau này.

