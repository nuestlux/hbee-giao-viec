---
title: "Gap field báo cáo NV đang TH đơn vị (25 cột khách)"
status: approved
created: "2026-07-16"
mode: brainstorm
source: ck-brainstorm
source_file: "bao_cao_nhiem_vu_dang_thuc_hien_don_vi_20260507102610.xls"
approach: A
---

# Brainstorm: Field gap vs báo cáo khách

## 1. Problem

Khách dùng báo cáo Excel **“BÁO CÁO THỰC HIỆN NHIỆM VỤ_ĐANG THỰC HIỆN”** (đơn vị, ngày chốt, 25 cột). H-Bee mock có Task/VB/Progress/Extension nhưng **thiếu field + snapshot + template export** → không tái tạo báo cáo.

**Underlying need:** parity dữ liệu + xuất đúng mẫu hành chính, không chỉ “thêm UI”.

## 2. Scout (codebase)

- Stack: React 19 / Vite / Zustand mock — `web-ui/`
- Types: `src/types/index.ts` — IncomingDocument, Task, ProgressUpdate, ExtensionRequest
- UI: Tasks, IncomingDocuments CRUD; DepartmentWork demo slice; Reports toast giả
- Plan: `plan.md` — computed quá hạn/sắp hạn/đúng tiến độ; snapshot báo cáo bất biến
- Sample khách: OLE `.xls`, sheet “Danh sách nhiệm vụ dơn vị”, 9 rows, 25 cols, header 2 dòng (Gia hạn / Người phê duyệt)

## 3. Decisions locked (user)

| # | Quyết định |
|---|---|
| Scope | Field design + **mẫu xuất Excel 1:1** |
| Coverage | **Toàn bộ 25 cột** |
| Cột 7 Ngày hoàn thành | = **`dueDate`** (kế hoạch) |
| Cột 5 Đầu mối | = **`focalPointText` free text** (tổ/nhóm), ≠ assignee |
| Cột 12 Mức độ | **Computed** @ asOf: Đúng tiến độ / Sắp đến hạn (≤3 ngày) / Quá hạn |
| Cột 10 Trạng thái | **Map TaskStatus → nhãn VN** |
| Cột 9 Nguồn gốc | Task `sourceKind`+`sourceCitation`, **fallback VB đến** |
| Approach | **A** — mở rộng domain + export engine |

## 4. Approaches evaluated

| | Pros | Cons |
|---|---|---|
| **A Domain+export (chọn)** | 1 source of truth; form=báo cáo; reuse công việc phòng | Nhiều field form; seed mock |
| B Snapshot-only | Ít đụng form | Lệch vận hành; tay đúc snapshot |
| C JSON custom fields | Linh hoạt | Overkill 25 cột cố định |

## 5. Final column map (25)

| Col | Header khách | Source |
|---:|---|---|
| 0 | STT | computed |
| 1 | Tên nhiệm vụ | `title` |
| 2 | LĐVP chủ trì | **NEW** `chairLeaderUserId?` + `chairLeaderName` |
| 3 | Đơn vị chủ trì | `assignedDepartmentName` |
| 4 | Đơn vị phối hợp | resolve names `coordinatingDepartments` |
| 5 | Đầu mối thực hiện | **NEW** `focalPointText` |
| 6 | Ngày thực hiện | `startDate` |
| 7 | Ngày hoàn thành (KH) | `dueDate` |
| 8 | Loại nhiệm vụ | `categoryName` |
| 9 | Nguồn gốc | `sourceKind` + `sourceCitation` \| fallback document |
| 10 | Trạng thái nhiệm vụ | map status label VN |
| 11 | Kết quả thực hiện | **NEW** `executionResult` |
| 12 | Mức độ hoàn thành | **computed** asOf |
| 13 | Khó khăn | latest ProgressUpdate.difficulties ≤ asOf |
| 14 | Đề xuất | latest ProgressUpdate.suggestions ≤ asOf |
| 15 | ID nhiệm vụ | **NEW** `externalTaskId` \|\| internal id |
| 16 | Người giao nhiệm vụ | `assignerName` |
| 17 | Lộ trình thực hiện | **NEW** `roadmap` (text MVP) |
| 18 | Ngày cập nhật | `updatedAt` |
| 19 | Ngày hoàn thành thực tế | `completedDate` |
| 20 | Gia hạn · Số lần | count ExtensionRequest (APPROVED — confirm BA) |
| 21 | Gia hạn · Mốc cũ | previous dueDate before last approved extension |
| 22 | Người phê duyệt · Họ tên | **NEW** approver snapshot |
| 23 | Email | approver email snapshot |
| 24 | Điện thoại | approver phone snapshot |

### Status label map (col 10)

| TaskStatus | Export label |
|---|---|
| DRAFT | Nháp |
| ASSIGNED | Đã giao |
| ACCEPTED | Đã nhận |
| IN_PROGRESS | Đang thực hiện |
| WAITING_APPROVAL | Chờ phê duyệt |
| NEEDS_CHANGES | Cần bổ sung |
| PAUSED | Tạm dừng |
| COMPLETED | Hoàn thành |
| REJECTED | Từ chối |
| CANCELLED | Đã hủy |

### Progress level (col 12) @ asOf

```
if dueDate < asOf && not (completed with completedDate): Quá hạn
else if 0 ≤ days(dueDate - asOf) ≤ 3: Sắp đến hạn
else: Đúng tiến độ
```

No manual override. `nearDays=3` constant MVP (settings later optional).

### Filter “Đang thực hiện” (report type)

Default statuses: ASSIGNED, ACCEPTED, IN_PROGRESS, WAITING_APPROVAL, NEEDS_CHANGES, PAUSED  
(Exclude DRAFT, COMPLETED, CANCELLED, REJECTED — BA can tweak.)

## 6. Schema deltas (persist)

### Task (NEW / clarify)

```ts
chairLeaderUserId?: string | null
chairLeaderName: string
focalPointText: string              // đầu mối tổ/nhóm
sourceKind: string | null           // enum catalog optional
sourceCitation: string | null
executionResult: string | null
roadmap: string | null
externalTaskId: string | null
approverUserId?: string | null
approverName: string | null
approverEmail: string | null
approverPhone: string | null
// keep assignee* for in-app assignment (not export col 5)
```

### IncomingDocument (NEW)

```ts
sourceKind: string | null
sourceCitation: string | null
// issuer, subject, documentNumber, security already exist
```

On “create task from document”: copy sourceKind/citation/number into Task.

### No DepartmentWork entity

View = Task filtered by department + same export builder.

## 7. Export template

- Title block: CỘNG HÒA… / Độc lập… (optional org branding)
- “BÁO CÁO THỰC HIỆN NHIỆM VỤ_ĐANG THỰC HIỆN”
- `Ngày chốt dữ liệu báo cáo: DD/MM/YYYY`
- `Tổng nhiệm vụ_Đang thực hiện: N`
- Header row 1 + subheader row (cols 20–24 merge groups)
- Body rows STT… 25 cols
- Lib on implement: exceljs or sheetjs (not in package yet)

## 8. UI touchpoints

| Screen | Change |
|---|---|
| Task form/detail | sections: chủ trì/phối hợp/đầu mối; nguồn; kết quả/lộ trình; phê duyệt; external id |
| Incoming document form | sourceKind, sourceCitation |
| Department work | real dept filter; button Xuất báo cáo đơn vị |
| Reports | report type “NV đang TH theo đơn vị”; asOf date; dept; download |

## 9. Implementation phases (for /ck:plan)

1. Types + mock seed + status/progress helpers  
2. Forms/lists Task + Document fields  
3. `buildUnitInProgressReport(asOf, deptId)` unit-testable  
4. Excel template export  
5. Wire DepartmentWork + Reports UI  
6. Optional: save report snapshot history  

## 10. Risks

- Sample file sparse (many empty cols) — UI must allow empty optional fields  
- externalTaskId import uniqueness / idempotent  
- Approver vs completion approver workflow — MVP free/select user, not full BPM  
- .xls vs .xlsx: implement xlsx first; customer can open  

## 11. Success metrics

- [ ] Export 25 columns same order as customer file  
- [ ] Col 12 always computed for given asOf  
- [ ] Col 5 uses focalPointText not assignee  
- [ ] Col 7 = dueDate; col 19 = completedDate  
- [ ] Demo seed ≥1 full-ish row  
- [ ] Department work uses same builder  

## 12. Out of scope (this design)

- Real Nest/Prisma backend  
- Full multi-milestone roadmap UI  
- Bit-perfect .xls OLE binary (use .xlsx)  
- Auto-scrape party document systems  

## 13. Next

- `/ck:plan` from this report (default; --tdd if want helper tests first for formula/export)  
- Unresolved: extension count = APPROVED only vs all; exact “đang TH” status set — confirm BA once  

## Unresolved questions

1. Extension count: only APPROVED or all statuses?  
2. Report filter include WAITING_APPROVAL / PAUSED?  
3. Org header text fixed “Đảng ủy…” vs dynamic from organization settings?  
