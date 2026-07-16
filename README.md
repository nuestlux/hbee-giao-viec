# HBEE — Web quản lý giao việc xã/phường

Ứng dụng web quản lý xuyên suốt từ **văn bản đến** → **giao nhiệm vụ** → **tiến độ** → **gia hạn / phê duyệt** → **báo cáo** tại ngày chốt.

> **Trạng thái hiện tại:** UI frontend (React + Vite) chạy mock data / client-side session. Backend NestJS + PostgreSQL theo kế hoạch trong `plan.md` (chưa có trong repo này).

## Cấu trúc repo

```text
.
├── web-ui/                 # Frontend React + TypeScript + Vite
├── plan.md                 # Kế hoạch triển khai đầy đủ (12 phase)
├── phase-01-…phase-12-…    # Chi tiết từng phase
├── plans/                  # Ghi chú / artifacts planning
└── docs/
    └── DEPLOY.md           # Ghi chú deploy (cập nhật sau mỗi lần lên môi trường)
```

## Stack (MVP UI)

| Lớp | Công nghệ |
|---|---|
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS 4, React Router, Zustand, Recharts, xlsx |
| Auth (tạm) | Session client-side + mock users (mật khẩu demo) |
| Backend (kế hoạch) | NestJS, PostgreSQL, Prisma, MinIO, pg-boss |
| Deploy (kế hoạch) | Docker Compose, Caddy; static UI có thể host GitHub Pages / Vercel / Nginx |

## Chạy local (frontend)

```bash
cd web-ui
npm install
npm run dev
```

Mở URL Vite in ra (thường `http://localhost:5173`).

### Build production

```bash
cd web-ui
npm run build
npm run preview
```

Output tĩnh: `web-ui/dist/`.

### Tài khoản demo

- Mật khẩu chung mock: `123456` (xem `web-ui/src/auth/session.ts`)
- Đăng nhập bằng email user mock trong UI

**Không dùng mock auth cho production.**

## Deploy

Xem **[docs/DEPLOY.md](docs/DEPLOY.md)** — checklist, biến môi trường, lịch sử deploy, và chỗ ghi thông tin máy chủ / domain / secrets (không commit secret).

### Deploy nhanh UI tĩnh (GitHub Pages)

1. Bật GitHub Pages: Settings → Pages → Source = **GitHub Actions**
2. Workflow `.github/workflows/deploy-pages.yml` build `web-ui` và publish `dist`
3. Cập nhật `base` trong `web-ui/vite.config.ts` nếu repo không ở root domain (ví dụ `base: '/<repo-name>/'`)

### Deploy UI lên Vercel / Netlify

- **Root directory:** `web-ui`
- **Build command:** `npm run build`
- **Output:** `dist`
- SPA rewrite: mọi route → `index.html`

## Tài liệu kế hoạch

- [plan.md](plan.md) — mục tiêu, kiến trúc, roadmap M0–M5
- Phase 01–12 — foundation → go-live

## License / sở hữu

Internal project — HBEE. Cập nhật license khi public repo.
