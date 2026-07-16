---
phase: 11
title: "Hardening bảo mật, hiệu năng và vận hành"
status: pending
priority: P1
dependencies: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
---

# Phase 11: Hardening bảo mật, hiệu năng và vận hành

## Overview

Kiểm chứng hệ thống đạt ngưỡng UAT/production về bảo mật, hiệu năng, quan sát, backup và khả năng phục hồi.

## Requirements

- OWASP, IDOR/BOLA, CSRF/CORS/cookie, rate limit, upload và export security.
- ClamAV hoặc tương đương trước production.
- Metrics/logs/traces, cảnh báo lỗi/job/dung lượng/backup/chứng thư.
- Backup PostgreSQL + MinIO mã hóa và diễn tập restore.

## Related Code Files

- Create: `apps/api/src/common/security/`, `observability/`
- Create: `infra/monitoring/`, `scripts/backup/`, `tests/load/`
- Create: `docs/runbooks/deploy.md`, `restore.md`, `incident-response.md`
- Modify: `.github/workflows/ci.yml`, `infra/docker-compose.yml`

## Implementation Steps

1. Threat model auth, quyền, file, export, audit và integration.
2. Hoàn thiện headers, CSRF/CORS, rate limit, input limit và secret management.
3. Tích hợp quét mã độc và lifecycle cách ly.
4. Review index bằng EXPLAIN ANALYZE; k6 list/dashboard/upload/export/job batch.
5. Thêm OpenTelemetry, Prometheus/Grafana và log rotation/redaction.
6. Backup/restore DB + MinIO trên môi trường sạch; ghi RPO/RTO thực đo.
7. Dependency/secret scan, accessibility và responsive testing.
8. Viết runbook deploy, rollback, dead-letter và sự cố dung lượng.

## Success Criteria

- [ ] Không còn critical/high security finding chưa được xử lý/chấp nhận.
- [ ] SLA phổ biến đạt số liệu được phê duyệt.
- [ ] Restore đầy đủ record, attachment, audit và snapshot.
- [ ] Đội vận hành chạy được deploy/rollback/runbook không cần tác giả code.

## Risk Assessment

Security baseline phải có từ Phase 01–04; phase này là kiểm chứng tổng thể. Backup chưa diễn tập restore không được coi là hoàn thành.

