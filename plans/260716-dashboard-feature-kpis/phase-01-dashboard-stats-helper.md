---
phase: 1
title: "Dashboard stats helper"
status: pending
priority: P1
dependencies: []
---

# Phase 01: Derive dashboard stats

## Overview

Pure function(s) compute 5 feature metrics from store slices — no hardcode fallbacks.

## Requirements

- docsTotal, docsUnassigned (taskIds empty)
- tasksOpen, tasksInProgress, tasksWaitingApproval
- tasksOverdue, tasksNearDeadline (≤7 days, not completed/cancelled)
- pendingExtensions
- unreadNotifications
- pie slices from open/completed/waiting/overdue as needed

## Related Code Files

- Create: `web-ui/src/utils/dashboard-stats.ts` (optional if inline keep simple)
- Read: `useStore` fields, `types`

## Implementation Steps

1. Define `DashboardFeatureStats` type  
2. Implement `deriveDashboardStats({ documents, tasks, extensions, notifications })`  
3. Unit-free manual verify with mock counts  

## Success Criteria

- [ ] Open excludes DRAFT, COMPLETED, CANCELLED  
- [ ] Near = due within 7d and not overdue  

## Risk Assessment

Date timezone mock ISO — use local Date compare consistent with rest of app.
