---
title: "Web quản lý giao việc xã/phường"
status: pending
created: "2026-07-15"
mode: deep
source: ck-plan
stack: "React, NestJS, PostgreSQL, Prisma, MinIO, pg-boss"
---

# Kế hoạch triển khai web quản lý giao việc xã/phường

## Mục tiêu

Xây dựng ứng dụng web quản lý xuyên suốt từ văn bản đến, giao nhiệm vụ, cập nhật tiến độ, gia hạn, phê duyệt, nhắc hạn đến báo cáo tại ngày chốt. Phần mềm phục vụ khoảng 30–300 người dùng trong một xã/phường, triển khai ban đầu trên một máy chủ và có khả năng mở rộng sang đơn vị khác mà không phải tách microservice.

## Phạm vi và giả định

- Một nhiệm vụ có đúng một đơn vị chủ trì, có thể có nhiều đơn vị phối hợp và một đầu mối chính.
- Nhiệm vụ có thể tạo độc lập hoặc từ một văn bản đến.
- Gia hạn và hoàn thành dùng quy trình phê duyệt một cấp trong MVP.
- `Quá hạn`, `Sắp đến hạn`, `Đúng tiến độ` là dữ liệu tính toán, không cho người dùng sửa tay.
- Ngày nghiệp vụ dùng múi giờ `Asia/Ho_Chi_Minh`; timestamp lưu UTC.
- Tài liệu mật/hạn chế cần quyền theo đối tượng; quản trị kỹ thuật không mặc nhiên được đọc nội dung.
- Dashboard, báo cáo và Excel chỉ triển khai sau khi state machine, lịch sử hạn và công thức tại ngày chốt được BA ký xác nhận.

## Kiến trúc được chọn

### Stack

| Lớp | Công nghệ |
|---|---|
| Frontend | React, Vite, TypeScript, TanStack Router/Query, React Hook Form, Zod |
| Backend | NestJS, Fastify adapter, REST `/api/v1`, OpenAPI |
| Database | PostgreSQL, Prisma; SQL kiểm soát cho báo cáo phức tạp |
| File | MinIO/S3-compatible, presigned URL ngắn hạn |
| Job nền | pg-boss và transactional outbox trên PostgreSQL |
| Test | Vitest, Supertest, Testcontainers, Playwright, k6 |
| Deploy | pnpm workspace, Docker Compose, Caddy |

### Cấu trúc dự kiến

```text
apps/
  web/
  api/
  worker/
packages/
  api-client/
  contracts/
  shared/
infra/
tests/
docs/
```

Backend là modular monolith. Module không truy cập repository của module khác; giao tiếp qua application service hoặc domain event. Không đưa Kubernetes, Kafka, Elasticsearch, event sourcing hay microservices vào bản đầu.

## Quy tắc dữ liệu bắt buộc

1. Mọi bản ghi nghiệp vụ có `organization_id`; query áp RBAC và data scope ở backend.
2. Không hard-delete người dùng, phòng ban hoặc danh mục đã phát sinh lịch sử.
3. Không sửa trực tiếp hạn sau khi giao; mọi thay đổi hạn có lịch sử hoặc yêu cầu gia hạn.
4. API chỉ cho phép transition hợp lệ; client không được gửi trạng thái tùy ý.
5. Hoàn thành phải có người nộp, thời điểm, kết quả và quyết định phê duyệt.
6. Audit append-only, ghi cùng transaction với thay đổi nghiệp vụ.
7. Snapshot báo cáo bất biến; xuất lại cùng snapshot phải cho cùng dữ liệu.
8. Import theo `external_task_id` phải idempotent hoặc đưa vào đối soát.
9. File chưa quét, quét lỗi hoặc bị cách ly không được tải xuống.
10. Excel export phải trung hòa formula injection với dữ liệu bắt đầu bằng `=`, `+`, `-`, `@`.

## Roadmap

| Phase | Nội dung | Phụ thuộc | Thời lượng |
|---:|---|---|---|
| 01 | Foundation, monorepo, CI, hạ tầng local | Không | 1–2 sprint |
| 02 | IAM, đăng nhập, RBAC, audit nền | 01 | 2 sprint |
| 03 | Phòng ban, người dùng, danh mục | 02 | 1 sprint |
| 04 | Văn bản đến, phân loại mật, tệp | 01–03 | 2 sprint |
| 05 | Vòng đời nhiệm vụ và giao việc | 02–04 | 2 sprint |
| 06 | Tiến độ, trao đổi, minh chứng | 05 | 1–2 sprint |
| 07 | Gia hạn và phê duyệt hoàn thành | 05–06 | 1 sprint |
| 08 | Thông báo, nhắc hạn, worker | 05–07 | 1 sprint |
| 09 | Trang chủ, snapshot, báo cáo, Excel | 03–08 | 2 sprint |
| 10 | Công việc phòng và lịch | 03,05,06,08 | 2 sprint |
| 11 | Hardening, hiệu năng, backup, runbook | 01–10 | 1–2 sprint |
| 12 | Import lịch sử, UAT, pilot, go-live | 01–11 | 2–3 sprint |

## Mốc phát hành

| Milestone | Phases | Giá trị |
|---|---|---|
| M0 | 01 | Dự án chạy được, CI và hạ tầng local |
| M1 | 02–03 | Đăng nhập, phân quyền, cơ cấu và danh mục |
| M2 | 04–06 | Văn bản → giao việc → tiến độ → nộp kết quả |
| M3 — MVP | 07–08 | Gia hạn, phê duyệt, nhắc hạn; đủ pilot nghiệp vụ |
| M4 | 09–10 | Dashboard, Excel, công việc phòng, lịch |
| M5 | 11–12 | Đủ điều kiện production và go-live |

MVP chức năng dừng tại Phase 08. Phase 11–12 vẫn là điều kiện bắt buộc trước production.

## Definition of Ready

- Story nêu rõ vai trò, mục tiêu và giá trị nghiệp vụ.
- Acceptance criteria viết Given/When/Then.
- Quyền và phạm vi dữ liệu đã xác định.
- Trạng thái trước/sau và lỗi nghiệp vụ đã mô tả.
- Có wireframe hoặc hành vi UI cho màn hình mới.
- API, trường dữ liệu, validation, audit và notification đã xác định.
- Dependency có owner và không còn câu hỏi chặn sprint.

## Definition of Done

- Code review hoàn tất; lint, typecheck, unit, integration và E2E liên quan đều pass.
- OpenAPI/client contract và migration được cập nhật.
- Permission/data-scope có test tự động.
- Hành động nhạy cảm có audit; log không chứa secret hoặc nội dung mật.
- UI có loading, empty, error, validation và responsive state.
- Không còn lỗi bảo mật critical/high chưa được chấp nhận chính thức.
- PO/BA nghiệm thu acceptance criteria trên UAT.
- Tài liệu người dùng và runbook được cập nhật khi hành vi vận hành thay đổi.

## Cổng kiểm soát trước khi code

- BA ký state machine nhiệm vụ, quyền giao/duyệt và quy tắc gia hạn trước Phase 05.
- BA ký định nghĩa đúng hạn/quá hạn, ngày chốt và mapping 26 cột Excel trước Phase 09.
- Đơn vị xác nhận mức độ mật, quy tắc need-to-know và kênh thông báo an toàn trước Phase 04/08.
- Xác nhận tích hợp SSO, chữ ký số, SMS/Zalo hoặc phần mềm văn bản là Release 3, trừ khi có API và yêu cầu bắt buộc sớm.

## Kiểm thử xuyên suốt

- Unit: state machine, hạn xử lý, approval policy, permission policy.
- Integration: PostgreSQL thật qua Testcontainers, migration, transaction, concurrency.
- API: ma trận `role × organization × department × object relationship`.
- E2E: đăng nhập, văn bản, giao việc, tiến độ, gia hạn, duyệt, báo cáo, tải file.
- Security: IDOR/BOLA, mass assignment, XSS, CSRF, upload độc hại, Excel injection.
- Data: snapshot bất biến, import idempotent, báo cáo mẫu đối soát đủ 9 nhiệm vụ.

## Câu hỏi cần BA khóa

1. Một nhiệm vụ có một hay nhiều cá nhân chịu trách nhiệm chính?
2. Ai được giao việc cấp xã và cấp phòng?
3. Quy trình từ chối tiếp nhận và trả lại kết quả có cần cấp trung gian?
4. Hạn có tính ngày nghỉ/lễ hay theo ngày lịch?
5. Văn bản mật cấp quyền theo vai trò hay từng hồ sơ?
6. Tên, thứ tự, định dạng nào trong báo cáo Excel bắt buộc giữ nguyên?
7. Có cần SSO, ký số, liên thông văn bản, email/SMS/Zalo trong lần phát hành đầu?

## Validation Log

### Red-team summary

- Bổ sung kiểm soát IDOR/BOLA, mass assignment, XSS, upload độc hại và Excel formula injection.
- Bắt buộc phân tách workflow status với sức khỏe tiến độ.
- Bắt buộc lịch sử hạn, optimistic locking và quyết định phê duyệt một lần.
- Bắt buộc snapshot bất biến để báo cáo lịch sử không đổi theo dữ liệu hiện tại.
- Hoãn dashboard/report cho tới khi BA ký state machine và data dictionary.

### Whole-Plan Consistency Sweep

- Files reread: `plan.md` và 12 tệp `phase-*.md`.
- Decision deltas checked: 8.
- Reconciled stale references: 0.
- Unresolved contradictions: 0.
- Open BA decisions: 7, đều đã đặt thành cổng trước phase liên quan và không chặn Phase 01.

## Tệp phase

- [Phase 01](phase-01-foundation.md)
- [Phase 02](phase-02-iam-rbac.md)
- [Phase 03](phase-03-organization-catalogs.md)
- [Phase 04](phase-04-incoming-documents-files.md)
- [Phase 05](phase-05-task-lifecycle.md)
- [Phase 06](phase-06-progress-collaboration.md)
- [Phase 07](phase-07-extensions-approvals.md)
- [Phase 08](phase-08-notifications-jobs.md)
- [Phase 09](phase-09-dashboard-reports.md)
- [Phase 10](phase-10-department-work-calendar.md)
- [Phase 11](phase-11-hardening-operations.md)
- [Phase 12](phase-12-migration-uat-go-live.md)
