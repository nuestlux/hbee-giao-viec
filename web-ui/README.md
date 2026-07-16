# HBEE Web UI

Frontend React + TypeScript + Vite cho hệ thống quản lý giao việc xã/phường.

## Scripts

```bash
npm install
npm run dev       # dev server
npm run build     # production → dist/
npm run preview   # preview dist
npm run lint      # oxlint
```

## Stack

React 19, Vite 8, Tailwind 4, React Router 7, Zustand, Recharts, xlsx, Lucide.

## Ghi chú

- Auth hiện tại là **mock** (client session). Xem `src/auth/session.ts`.
- Dữ liệu demo: `src/data/mockData.ts`.
- Deploy: xem `../docs/DEPLOY.md`.
