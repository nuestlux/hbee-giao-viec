# Brainstorm: Task Workspace — gộp Form Giao việc + Chi tiết

**Date:** 2026-07-17  
**Project:** `Downloads/Giao viec hbee/web-ui`  
**Status:** Design chốt (user approved approach A + accordion mở)  
**Sources:** Screenshot full Task Detail + crop Mức độ khẩn; code `TaskDetail.tsx`, `Tasks.tsx` modal form

---

## 1. Problem statement

### Solution-jumping diagnosis
User muốn “2 ảnh → 1 màn cho dễ nhìn”. Signal: form giao việc (modal) và chi tiết NV (route) **tách bề mặt** → người giao/người làm nhảy context; chi tiết thiếu field form (vd. mức khẩn chỉ badge); màn detail **thưa** (empty progress/chat + whitespace).

### Underlying problem
Người dùng không có **một workspace** để vừa nắm đủ thuộc tính việc vừa theo dõi tiến độ/trao đổi — form tạo/sửa và màn xem đang là 2 UX khác nhau.

### Assumption challenges
| Assumption | Risk if wrong | Validation |
|------------|---------------|------------|
| Gộp form+detail = dễ nhìn hơn | Field overload | Group primary vs “Thông tin thêm”; measure scroll |
| 1 layout cho cả 2 persona | Nút/field nhiễu | RBAC ẩn control; mode Xem mặc định |
| Bỏ modal list OK | Tạo việc chậm hơn 1 click | `/tasks/new` full page chấp nhận được |
| Accordion “Thêm” mặc định mở | Màn dài | User chốt mở — giữ; có collapse |

### Problem (structured)
- **Users:** người giao + người thực hiện (layout chung, RBAC)
- **Struggle:** tách modal form vs detail; field quan trọng (khẩn…) không nổi trên detail; empty state lãng phí
- **Cause:** `Tasks.tsx` Modal XL vs `TaskDetail.tsx` read-mostly 2-col
- **Consequence:** chậm scan, dễ miss meta, thao tác rời
- **Success:** 1 viewport workspace — đủ meta+nội dung+tiến độ+chat; tạo/sửa/xem cùng khung

### Alternative framings (đã loại)
- Frame B 3-cột: tốt màn rộng, xấu laptop/mobile
- Frame C detail+drawer: không đạt “1 màn”
- **Frame A (chọn):** 2 cột + Xem/Sửa

### Evidence status
**Weak–Medium:** screenshot product + yêu cầu explicit user; chưa user test.

---

## 2. Requirements (exact)

| # | Requirement |
|---|-------------|
| R1 | 1 Task Workspace: create + view + edit |
| R2 | Dual persona, 1 layout; RBAC như store hiện tại |
| R3 | Field form giao việc (gồm Mức độ khẩn) trên workspace, không chỉ badge |
| R4 | Cột chat sticky; empty state gọn |
| R5 | “Thông tin thêm (báo cáo)” **accordion mặc định MỞ** |
| R6 | List: bỏ modal form XL; `+ Giao việc` → `/tasks/new` |
| R7 | Progress: create = default Chưa TH; sau giao = modal/flow “Cập nhật tiến độ” + history |
| R8 | Scope out (round này): redesign list table, backend API thật, mobile native app |

**Acceptance (design):**
- Wireframe A chốt + field map + luồng route
- User approve trước implement

**Touchpoints:**
- `src/pages/TaskDetail.tsx` → mở rộng thành workspace (hoặc `TaskWorkspace.tsx`)
- `src/pages/Tasks.tsx` — gỡ modal form; deep link create/edit
- Shared: extract `TaskFormFields` (hoặc tương đương)
- Routes: `/tasks/new`, `/tasks/:id`, optional `?edit=1`
- Store: `addTask`, `updateTask`, progress/comment/extension (giữ)

---

## 3. Approaches evaluated

| ID | Approach | Verdict |
|----|----------|---------|
| A | 2 cột + mode Xem/Sửa; create cùng layout | **CHỌN** |
| B | 3 cột meta \| nội dung \| chat | Reject — hẹp viewport |
| C | Detail + drawer form | Reject — không 1 màn |

---

## 4. Final design — Approach A

### 4.1 Information architecture

```
Task Workspace
├── Sticky header (title, status, urgency, primary actions)
├── Meta strip (1 dòng scan)
├── Main column (~65%)
│   ├── Nội dung nhiệm vụ
│   ├── Phân công & lịch (grid 2col)
│   ├── Tiến độ thực hiện + history
│   ├── Thông tin thêm (accordion OPEN default)
│   └── Yêu cầu gia hạn (conditional)
└── Side column (~35%, sticky)
    └── Trao đổi & Bình luận + composer
```

### 4.2 Wireframe (desktop)

```
┌─ App shell (sidebar) ──────────────────────────────────────────────┐
│ ┌─ Sticky workspace header ──────────────────────────────────────┐ │
│ │ ←  Tiêu đề NV……………………  [Đã giao] [Khẩn ▾]                    │ │
│ │    Loại · Lĩnh vực · Hạn 21/7 · Giao bởi: …                     │ │
│ │                    [Sửa] [Đổi TT] [Cập nhật tiến độ] [Gia hạn]  │ │
│ │                    (edit:) [Hủy] [Lưu]                          │ │
│ └────────────────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────┬────────────────────────────────┐ │
│ │ NỘI DUNG                      │ TRAO ĐỔI & BÌNH LUẬN           │ │
│ │ (textarea / prose)            │ messages scroll                │ │
│ │                               │                                │ │
│ │ PHÂN CÔNG & LỊCH              │ empty: 1 dòng ngắn             │ │
│ │ Phòng | Người                 │                                │ │
│ │ Bắt đầu | Hạn                 │ ┌────────────────────────────┐ │ │
│ │ Loại | Lĩnh vực               │ │ Nhập…                  [>] │ │ │
│ │ Mức độ khẩn | (status read)   │ └────────────────────────────┘ │ │
│ │                               │                                │ │
│ │ TIẾN ĐỘ                       │ height ≈ viewport - header     │ │
│ │ [====····] Chưa TH            │ (không hard 600px rỗng)        │ │
│ │ history cards compact         │                                │ │
│ │                               │                                │ │
│ │ ▼ THÔNG TIN THÊM (mở sẵn)     │                                │ │
│ │ LĐ chủ trì | Mã ngoài         │                                │ │
│ │ Đầu mối                       │                                │ │
│ │ Nguồn | Trích dẫn             │                                │ │
│ │ Kết quả | Roadmap             │                                │ │
│ │ Người duyệt + contact         │                                │ │
│ │                               │                                │ │
│ │ GIA HẠN (nếu có)              │                                │ │
│ └───────────────────────────────┴────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### 4.3 Modes

| Mode | Route / trigger | UI |
|------|-----------------|-----|
| Create | `/tasks/new` | Fields editable; CTA **Giao việc**; chat panel placeholder “Lưu xong để trao đổi” |
| View | `/tasks/:id` | Read-only fields; badges; actions theo RBAC |
| Edit | `/tasks/:id` + Sửa hoặc `?edit=1` | Fields editable; **Lưu / Hủy**; dirty guard back |

### 4.4 Field map

**Luôn trong “Phân công & lịch” (primary):**
- title (header)
- description (Nội dung)
- assignedDepartmentId, assigneeId
- categoryId, fieldId
- urgency (**Mức độ khẩn** — select khi edit; badge+label khi view)
- startDate, dueDate
- status: không free-edit trong form grid — dùng **Đổi trạng thái**

**Accordion “Thông tin thêm” — default OPEN:**
- chairLeaderName, externalTaskId, focalPointText
- sourceKind, sourceCitation
- executionResult, roadmap
- approverUserId (+ email/phone read)

**Không nhét vào form edit như “tiến độ tạo” sau khi đã giao:**
- progress history + **Cập nhật tiến độ** modal (giữ pattern hiện tại)
- Create: progress default level 0 / Chưa TH

### 4.5 Density / empty (UX fix từ screenshot)

| Pain | Fix |
|------|-----|
| Whitespace lớn | `p-4`, gap-4; bỏ min-height thừa |
| Chat h-600 empty | flex column `min-h-[320px]` → `max-h` viewport; empty 1 dòng |
| Progress empty | 1 empty row + CTA, không py-8 khổng lồ |
| Khẩn chỉ badge | View: badge; Edit: select như form (screenshot crop) |

### 4.6 Mobile (< lg)

Tabs: `Thông tin` | `Tiến độ` | `Trao đổi`  
Header actions → menu “…” nếu chật.

### 4.7 RBAC (giữ spirit store)

| Action | Permission / rule |
|--------|-------------------|
| Create / edit assignment fields | task.assign / assigner |
| Update progress | task.update / assignee / assigner |
| Change status | accept/approve/assign + existing |
| Extension request/approve | extension.* |
| Comment | user can view task |
| Hide Sửa if no meta edit right | view-only workspace |

### 4.8 Routing & list

```
/tasks              list only (no form modal)
/tasks/new          workspace create
/tasks/:id          workspace view
/tasks/:id?edit=1   workspace edit
```

List `+ Giao việc` → navigate `/tasks/new`.  
Row click → `/tasks/:id`.  
Optional: action Sửa trên row → `?edit=1`.

### 4.9 Component sketch (implement later)

```
TaskWorkspacePage
├── WorkspaceHeader
├── TaskPrimaryFields   // view | edit
├── ProgressSection     // bar + history + open modal
├── TaskExtraFields     // accordion open default
├── ExtensionSection
└── TaskCommentsPanel   // sticky
shared: TaskFormFields (from Tasks modal)
```

---

## 5. Implementation considerations (for /ck:plan)

1. Extract form fields khỏi `Tasks.tsx` modal → shared module  
2. Evolve `TaskDetail.tsx` → workspace (create via empty task state / separate route)  
3. Add route `/tasks/new` in `App.tsx`  
4. Remove Modal form from list (keep page lighter)  
5. Dirty state + confirm leave  
6. Preserve toast + modals: progress, status, extension  
7. Visual regression: empty task, rich task, create, edit, mobile tabs  
8. YAGNI: no autosave, no realtime collab

**Risks:**
- Form + accordion open = long scroll — mitigated by sticky header + sticky chat  
- Permission edge cases on field-level edit — start section-level (Sửa bật cả primary+extra)  
- Break bookmarks — keep `/tasks/:id`

**Rollback:** re-enable modal form; detail read-only path.

---

## 6. Success metrics

- 0 navigation form↔detail để sửa mức khẩn / phân công  
- Key meta (khẩn, hạn, người, phòng, tiến độ, chat) visible without modal  
- Empty states ≤ ~80px height each  
- Create path ≤ 1 click from list CTA  
- No permission regression vs current store checks  

---

## 7. Next steps

1. User final approve design doc (this file)  
2. `/ck:plan` default — phase extract form → workspace routes → density → remove modal  
3. Optional journal after plan  

---

## Unresolved questions

- Field-level vs section-level edit permissions (recommend section-level v1)?  
- Sau Lưu edit: stay edit hay về view? (recommend → view)  
- Link văn bản đến → prefill workspace create? (out of scope unless asked)
