---
title: "Dashboard trang chủ — KPI theo tính năng chính"
date: "2026-07-16"
type: brainstorm-report
project: "Downloads/Giao viec hbee/web-ui"
status: approved
modes: []
recommended_plan: "plans/260716-dashboard-feature-kpis/"
---

# Brainstorm: Dashboard KPI feature-centric

## Problem statement

Trang chủ `/` hiện **7 KPI card toàn slice nhiệm vụ** (tổng, đang làm, chờ duyệt, hoàn thành, đúng hạn, sắp hạn, quá hạn) → noise, trùng pie chart, **không** phản ánh map tính năng phần mềm (VB đến, NV, hạn, chờ xử lý, thông báo).

## Requirements (đã chốt)

| # | Requirement |
|---|---|
| R1 | Overview ≤ **5 cards**, mỗi card = domain module chính |
| R2 | Bỏ 7-card task-slice; “đúng hạn / hoàn thành” không đứng riêng trên overview |
| R3 | Data derive live từ store (docs, tasks, extensions, notifications) |
| R4 | Layout: welcome + 5 cards + **1 chart** + 2 list (sắp hạn + hoạt động) |
| R5 | Mock UI only — project `web-ui` |
| R6 | Out: NestJS, role-based KPI (B), redesign Reports full |

## Approaches evaluated

| Option | Verdict |
|---|---|
| **A** Feature map 4–5 cards | **Chọn** |
| B Role dashboard | Defer — scope lớn |
| C Gộp 7 task card | Reject — không đổi sang feature |

## Final solution — 5 cards

1. **Văn bản đến** — total docs · sub: chưa gắn NV → `/documents`  
2. **Nhiệm vụ** — open count · sub: in-progress / waiting → `/tasks`  
3. **Hạn xử lý** — overdue · sub: near ≤7d → `/tasks?tab=overdue`  
4. **Chờ xử lý** — waiting approval + pending extensions → `/tasks`  
5. **Thông báo** — unread → `/notifications`  

Open task def: status ∉ {COMPLETED, CANCELLED, DRAFT} (nháp không tính “đang mở”).

## Layout

1. Welcome  
2. Feature KPI grid `2 / sm:3 / xl:5`  
3. One pie (task status) — drop bar dept on home (hoặc giữ bar, drop pie; **default: pie only**)  
4. Near-deadline table + recent activity  

## Touchpoints

- Modify: `web-ui/src/pages/Dashboard.tsx`  
- Optional: `web-ui/src/utils/dashboard-stats.ts`  
- Reuse: `KPICard` nếu fit  

## Acceptance

- [ ] ≤5 overview cards  
- [ ] Click đúng module  
- [ ] Không hardcode 156  
- [ ] Mobile 2-col ổn  
- [ ] Build pass  

## Risks

| Risk | Mitigation |
|---|---|
| Chờ xử lý mơ hồ | Count = waitingApproval tasks + pending extensions |
| Trùng chart | Chỉ 1 chart trên home |

## Next

Plan: `plans/260716-dashboard-feature-kpis/` → `/cook`

## Unresolved

None — approved 2026-07-16.
