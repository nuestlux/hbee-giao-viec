---
phase: 1
title: "Foundation và kiến trúc dự án"
status: pending
priority: P1
dependencies: []
---

# Phase 01: Foundation và kiến trúc dự án

## Overview

Khởi tạo monorepo, web shell theo sidebar mẫu, API, PostgreSQL, MinIO, CI và bộ quy ước đủ để các phase sau phát triển theo vertical slice.

## Requirements

- React/Vite/TypeScript strict; NestJS/Fastify; REST `/api/v1` và OpenAPI.
- Docker Compose chạy PostgreSQL, MinIO, API và worker placeholder.
- Request ID, lỗi chuẩn hóa, Pino structured logs, health live/ready.
- Vitest, Supertest, Testcontainers và Playwright được cấu hình.

## Related Code Files

- Create: `pnpm-workspace.yaml`, `package.json`, `.env.example`
- Create: `apps/web/`, `apps/api/`, `apps/worker/`, `packages/contracts/`
- Create: `infra/docker-compose.yml`, `.github/workflows/ci.yml`
- Create: `docs/development-rules.md`, `docs/system-architecture.md`

## Implementation Steps

1. Khởi tạo pnpm workspace và quy ước lint/format/typecheck.
2. Tạo app shell và route placeholder: Trang chủ, Văn bản đến, Nhiệm vụ, Công việc phòng, Báo cáo, Hệ thống.
3. Tạo NestJS API, validation pipe, Swagger và error envelope.
4. Cấu hình Prisma migration/seed và kết nối PostgreSQL.
5. Cấu hình MinIO, storage adapter và health checks.
6. Thêm request ID, log redaction và endpoint `/health/live`, `/health/ready`.
7. Thiết lập test/CI và hướng dẫn chạy local.

## Success Criteria

- [ ] Clone mới có thể chạy toàn bộ hệ thống bằng tài liệu.
- [ ] Web gọi API; migration và seed chạy lặp lại được.
- [ ] CI chạy lint, typecheck, unit, integration và build.
- [ ] Log không ghi secret hoặc payload tài liệu.

## Risk Assessment

Giữ package dùng chung tối thiểu; mọi dịch vụ phụ thuộc chạy qua Docker để tránh lệch Windows/Linux. Không tạo abstraction chưa có hai consumer thực tế.

