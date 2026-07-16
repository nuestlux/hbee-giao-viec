# Deploy notes — HBEE Giao việc

> **Mục đích:** một chỗ duy nhất để lưu thông tin deploy (môi trường, URL, lệnh, người phụ trách).  
> **Không commit secret:** token, password DB, SSH key → ghi vào `docs/deploy.local.md` (đã gitignore) hoặc password manager.

---

## 1. Tóm tắt môi trường

| Môi trường | URL | Host / Provider | Branch | Trạng thái | Cập nhật |
|---|---|---|---|---|---|
| Local | `http://localhost:5173` | Máy dev | — | OK | 2026-07-16 |
| Staging | _điền sau_ | _Vercel / VPS / …_ | `main` / `develop` | — | — |
| Production (Pages) | `https://nuestlux.github.io/hbee-giao-viec/` | GitHub Pages | `main` | Live (+ SPA 404.html) | 2026-07-16 |
| GitHub repo | `https://github.com/nuestlux/hbee-giao-viec` | GitHub | `main` | OK | 2026-07-16 |

---

## 2. Repo & GitHub

| Mục | Giá trị |
|---|---|
| GitHub org/user | `nuestlux` |
| Tên repo | `hbee-giao-viec` |
| Visibility | Public |
| Default branch | `main` |
| Pages URL | `https://nuestlux.github.io/hbee-giao-viec/` |
| Pages source | GitHub Actions (`.github/workflows/deploy-pages.yml`) |
| Vite `base` | `/hbee-giao-viec/` |

### Lệnh tạo repo lần đầu (khi đã `gh auth login`)

```bash
cd "C:\Users\Desktop\Downloads\Giao viec hbee"
gh repo create hbee-giao-viec --private --source=. --remote=origin --push
```

Hoặc:

```bash
git remote add origin https://github.com/<USER>/<REPO>.git
git push -u origin main
```

---

## 3. Frontend (hiện tại — static SPA)

### Build

```bash
cd web-ui
npm ci
npm run build
# artifact: web-ui/dist
```

### Runtime

- **Không cần Node** trên server production cho static host.
- Serve thư mục `dist` bằng Nginx / Caddy / GitHub Pages / CDN.
- **SPA fallback:** mọi path không phải file tĩnh → `index.html` (React Router `BrowserRouter`).

#### Nginx (ví dụ)

```nginx
server {
  listen 80;
  server_name giao-viec.example.vn;
  root /var/www/hbee-giao-viec;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

#### GitHub Pages — base path

Nếu site nằm tại `https://USER.github.io/REPO/` thì trong `web-ui/vite.config.ts`:

```ts
export default defineConfig({
  base: '/REPO/',
  plugins: [react(), tailwindcss()],
})
```

Nếu custom domain root (`https://giao-viec.example.vn/`) → `base: '/'`.

### Biến môi trường frontend (tương lai)

Tạo `web-ui/.env.example` / `.env.production` khi nối API thật:

| Biến | Mô tả | Ví dụ |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL API NestJS | `https://api.example.vn/api/v1` |
| `VITE_APP_TITLE` | Tiêu đề app (optional) | `HBEE Giao việc` |

Chỉ biến prefix `VITE_` mới được bundle vào client — **không** nhét secret vào đây.

---

## 4. Backend (kế hoạch — chưa có code trong repo)

Theo `plan.md`: NestJS + PostgreSQL + Prisma + MinIO + pg-boss + Caddy.

| Thành phần | Ghi chú deploy |
|---|---|
| PostgreSQL | Backup định kỳ; timezone app `Asia/Ho_Chi_Minh`, DB UTC |
| MinIO / S3 | Bucket riêng; presigned URL ngắn hạn |
| API | `/api/v1`, reverse proxy TLS |
| Worker | Cùng monorepo process hoặc container `worker` |
| Secrets | `DATABASE_URL`, JWT, MinIO keys — chỉ env / secret manager |

### Checklist trước production (từ plan M5)

- [ ] Tắt mock auth / demo password
- [ ] RBAC + data scope theo `organization_id`
- [ ] TLS (Caddy hoặc reverse proxy)
- [ ] Backup DB + restore drill
- [ ] Audit log append-only
- [ ] File scan / không serve file chưa quét
- [ ] Rate limit login, CORS đúng domain

---

## 5. Lịch sử deploy

Ghi mỗi lần release (mới nhất trên cùng):

| Ngày | Môi trường | Version / commit | Người | Ghi chú |
|---|---|---|---|---|
| 2026-07-16 | production (Pages) | a1c5892 | nuestlux | Tạo repo public, push main, bật Pages Actions |
| 2026-07-16 | — | 4812f63 | — | Chuẩn bị source + docs local |

**Template dòng mới:**

```text
| YYYY-MM-DD | production | abc1234 | tên | deploy UI static lên … |
```

---

## 6. Contacts / truy cập

| Vai trò | Tên | Liên hệ | Ghi chú |
|---|---|---|---|
| Owner repo GitHub | | | |
| Server admin | | | |
| BA / product | | | |

Secrets và mật khẩu SSH/DB: **password manager** hoặc `docs/deploy.local.md` (local only).

---

## 7. Troubleshooting nhanh

| Triệu chứng | Hướng xử lý |
|---|---|
| Refresh trang 404 | Thiếu SPA rewrite → `index.html` |
| CSS/JS 404 trên Pages | Sai `base` trong Vite |
| Login demo không vào được | Xóa localStorage keys `hbee-auth-*`; password mock `123456` |
| `gh` 401 Bad credentials | `gh auth login -h github.com` rồi push lại |
| Build fail TypeScript | `cd web-ui && npm run build` — sửa lỗi type trước khi deploy |

---

## 8. File local (không commit)

Tạo `docs/deploy.local.md` trên máy bạn để ghi:

- IP server, SSH user, port
- Connection string DB
- Token GitHub / deploy keys
- Tài khoản MinIO / SMTP

File này nằm trong `.gitignore`.
