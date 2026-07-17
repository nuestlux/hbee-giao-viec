---
phase: 2
title: "Progress form: khó khăn + đề xuất"
status: pending
priority: P1
dependencies: []
---

# Phase 02: Khó khăn & Đề xuất on progress update

## Overview

Excel cols 14–15 from latest ProgressUpdate. Restore dedicated fields on progress edit UI (not only free note).

## Requirements

- Edit progress block fields: progress level, content (đã làm), difficulties, suggestions
- Save via `addProgressUpdate`
- History already renders difficulties/suggestions

## Files

- Modify: `src/pages/TaskDetail.tsx` (progress editor state + save)
- No store API change if addProgressUpdate already accepts difficulties/suggestions

## Steps

1. State: progressNote → content; add difficulties, suggestions state (or single object)
2. Form fields in Tiến độ section when mode edit && canUpdateProgress
3. handleSaveMeta / progress-only path pass all three strings
4. Optional: show latest difficulties/suggestions preview in view
5. Build

## Success

- [ ] Save update with both fields → history + export cols 14–15
- [ ] Empty optional OK
- [ ] Build OK
