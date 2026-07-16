---
phase: 2
title: "Dashboard UI feature cards"
status: pending
priority: P1
dependencies: [1]
---

# Phase 02: UI — 5 feature cards + layout

## Overview

Replace 7-card row with 5 feature cards; keep welcome; one pie; lists.

## Cards

1. Văn bản đến  
2. Nhiệm vụ  
3. Hạn xử lý  
4. Chờ xử lý  
5. Thông báo  

## Related Code Files

- Modify: `web-ui/src/pages/Dashboard.tsx`  
- Optional: `components/KPICard.tsx`  

## Implementation Steps

1. Wire store data into derive helper  
2. Render 5 cards grid responsive  
3. Pie only (remove bar dept on home)  
4. Keep near-deadline + activity lists  
5. Navigation links per design  

## Success Criteria

- [ ] 5 cards visible  
- [ ] No 7-card row  
- [ ] Click navigates  

## Risk Assessment

Visual density on mobile — 2-col grid.
