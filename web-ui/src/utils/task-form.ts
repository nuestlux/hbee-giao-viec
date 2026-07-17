import type { Task } from '../types';
import { snapProgressToLevel } from './progress-levels';

/** Empty form for create task workspace / legacy modal. */
export function emptyTaskForm(): Partial<Task> {
  return {
    title: '',
    description: '',
    scope: 'DEPARTMENT',
    urgency: 'THUONG',
    priority: 'MEDIUM',
    assignedDepartmentId: '',
    assigneeId: '',
    coordinatingDepartments: [],
    categoryId: '',
    fieldId: '',
    dueDate: '',
    startDate: '',
    progress: 0,
    chairLeaderName: '',
    focalPointText: '',
    sourceKind: null,
    sourceCitation: '',
    executionResult: '',
    roadmap: '',
    externalTaskId: '',
    approverUserId: null,
    approverName: '',
    approverEmail: '',
    approverPhone: '',
  };
}

/** Map full Task → form patch for edit. */
export function taskToFormData(task: Task): Partial<Task> {
  return {
    title: task.title,
    description: task.description,
    urgency: task.urgency,
    priority: task.priority,
    assignedDepartmentId: task.assignedDepartmentId,
    assigneeId: task.assigneeId,
    coordinatingDepartments: [...(task.coordinatingDepartments || [])],
    categoryId: task.categoryId,
    fieldId: task.fieldId,
    dueDate: task.dueDate,
    startDate: task.startDate,
    progress: snapProgressToLevel(task.progress),
    scope: task.scope,
    chairLeaderName: task.chairLeaderName || '',
    chairLeaderUserId: task.chairLeaderUserId || null,
    focalPointText: task.focalPointText || '',
    sourceKind: task.sourceKind ?? null,
    sourceCitation: task.sourceCitation || '',
    executionResult: task.executionResult || '',
    roadmap: task.roadmap || '',
    externalTaskId: task.externalTaskId || '',
    approverUserId: task.approverUserId || null,
    approverName: task.approverName || '',
    approverEmail: task.approverEmail || '',
    approverPhone: task.approverPhone || '',
  };
}

export function isTaskFormValid(data: Partial<Task>): boolean {
  return Boolean(data.title && data.assignedDepartmentId && data.categoryId && data.dueDate);
}
