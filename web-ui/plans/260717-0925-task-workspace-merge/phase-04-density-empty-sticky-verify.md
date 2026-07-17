---
phase: 4
title: "Density / empty / sticky chat polish + verify"
status: pending
priority: P2
dependencies: [2, 3]
---

# Phase 04: Density, empty states, sticky chat, verify

## Overview

Chỉnh UX density theo screenshot pain: bớt whitespace, empty gọn, chat sticky viewport. Verify RBAC + build + manual paths.

## Requirements

- Functional: empty progress/chat ≤ compact single message row
- Functional: comments panel sticky in column; height `min` + `max` theo viewport (not fixed 600px empty look)
- Functional: accordion extra default open verified
- Non-functional: build + lint; optional responsive tabs skeleton if easy (lg+ 2col; <lg stack OK without full tabs if time)

## Architecture

```
.chat-panel {
  position sticky; top: headerOffset;
  display flex; flex-col;
  max-height: calc(100vh - header - padding);
}
.empty → py-4 text-sm text-center, no py-8 huge
```

## Related Code Files

- Modify: workspace comments + progress empty UI in TaskDetail/panels
- Modify: spacing classes on cards (`p-6` → `p-4` where sparse)
- Verify: permissions matrix quick checklist

## Implementation Steps

1. Replace `h-[600px]` with flex sticky max-height pattern
2. Compact empty states (progress, comments, create-mode chat placeholder)
3. Visual pass: task empty history, task with updates, create page
4. RBAC smoke: user without assign cannot Sửa meta; assignee can progress/comment
5. `npm run lint` + `npm run build`
6. Note residual issues in plan reports if any

## Success Criteria

- [ ] Detail page không “lỗ trắng” lớn khi empty (match design intent)
- [ ] Khẩn + full fields visible without modal
- [ ] Chat usable while scrolling main column (desktop)
- [ ] lint + build green
- [ ] Checklist acceptance plan.md checked

## Risk Assessment

- Sticky + overflow parent: ensure MainLayout main scroll container allows sticky (test; if broken, fixed height scroll inside panel is fallback)
- Mobile: stacked columns OK for v1

## Validation checklist (copy to done report)

- [ ] Create `/tasks/new` → Giao việc → detail
- [ ] View all fields + extra open
- [ ] Edit urgency + save
- [ ] Progress update appears in history
- [ ] Comment send
- [ ] List no modal
- [ ] Build OK
