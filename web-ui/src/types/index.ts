// Organization
export interface Organization { id: string; name: string; code: string; address: string; phone: string; }

// Department  
export interface Department { id: string; name: string; code: string; parentId: string | null; headId: string | null; deputyHeadId: string | null; memberCount: number; isActive: boolean; }

// User
export type UserRole = 'CHAIRMAN' | 'VICE_CHAIRMAN' | 'DEPT_HEAD' | 'DEPT_DEPUTY' | 'SPECIALIST' | 'CLERK' | 'ADMIN';
export interface User { id: string; fullName: string; email: string; phone: string; role: UserRole; departmentId: string; departmentName: string; position: string; avatar: string; isActive: boolean; lastLogin: string; }

// Catalogs
export type UrgencyLevel = 'THUONG' | 'KHAN' | 'THUONG_KHAN';
export type SecurityLevel = 'THUONG' | 'MAT' | 'TOI_MAT';
export interface DocumentType { id: string; name: string; code: string; isActive: boolean; }
export interface TaskCategory { id: string; name: string; code: string; isActive: boolean; }
export interface Field { id: string; name: string; code: string; isActive: boolean; }

// Incoming Document
export type DocumentSourceKind =
  | 'NGHI_QUYET'
  | 'KET_LUAN'
  | 'CHI_THI'
  | 'CTHD'
  | 'KE_HOACH'
  | 'CONG_VAN'
  | 'KHAC';

export interface IncomingDocument {
  id: string;
  documentNumber: string;
  issuedDate: string;
  receivedDate: string;
  issuer: string;
  subject: string;
  documentTypeId: string;
  documentTypeName: string;
  fieldId: string;
  fieldName: string;
  urgency: UrgencyLevel;
  security: SecurityLevel;
  attachments: Attachment[];
  taskIds: string[];
  createdBy: string;
  createdAt: string;
  /** Loại nguồn (Nghị quyết / Chỉ thị / …) — nuôi báo cáo */
  sourceKind?: DocumentSourceKind | null;
  /** Trích dẫn đầy đủ nguồn */
  sourceCitation?: string | null;
}

export interface Attachment { id: string; fileName: string; fileSize: number; mimeType: string; uploadedAt: string; uploadedBy: string; }

// Task
export type TaskStatus = 'DRAFT' | 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'WAITING_APPROVAL' | 'COMPLETED' | 'REJECTED' | 'NEEDS_CHANGES' | 'PAUSED' | 'CANCELLED';
export type TaskScope = 'ORGANIZATION' | 'DEPARTMENT';
export type ProgressLevelCode = 'ON_TRACK' | 'NEAR_DEADLINE' | 'OVERDUE';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  scope: TaskScope;
  assignedDepartmentId: string;
  assignedDepartmentName: string;
  assigneeId: string;
  assigneeName: string;
  assignerId: string;
  assignerName: string;
  coordinatingDepartments: string[];
  sourceDocumentId: string | null;
  sourceDocumentNumber: string | null;
  urgency: UrgencyLevel;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  progress: number;
  dueDate: string;
  startDate: string;
  completedDate: string | null;
  categoryId: string;
  categoryName: string;
  fieldId: string;
  fieldName: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
  /** LĐVP / lãnh đạo chủ trì (báo cáo col 2) */
  chairLeaderUserId?: string | null;
  chairLeaderName?: string | null;
  /** Đầu mối thực hiện — free text tổ/nhóm (col 5), ≠ assignee */
  focalPointText?: string | null;
  sourceKind?: DocumentSourceKind | null;
  sourceCitation?: string | null;
  /** Kết quả thực hiện (col 11) */
  executionResult?: string | null;
  /** Lộ trình (col 17) — text MVP */
  roadmap?: string | null;
  /** ID hệ ngoài / import (col 15) */
  externalTaskId?: string | null;
  approverUserId?: string | null;
  approverName?: string | null;
  approverEmail?: string | null;
  approverPhone?: string | null;
}

// Progress Update  
export interface ProgressUpdate { id: string; taskId: string; userId: string; userName: string; userAvatar: string; progress: number; previousProgress: number; content: string; difficulties: string | null; suggestions: string | null; attachments: Attachment[]; createdAt: string; }

// Comment
export interface TaskComment { id: string; taskId: string; userId: string; userName: string; userAvatar: string; content: string; mentions: string[]; attachments: Attachment[]; createdAt: string; isEdited: boolean; }

// Extension Request
export type ExtensionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export interface ExtensionRequest { id: string; taskId: string; taskTitle: string; requesterId: string; requesterName: string; currentDueDate: string; requestedDueDate: string; reason: string; attachments: Attachment[]; status: ExtensionStatus; decidedBy: string | null; decidedByName: string | null; decidedAt: string | null; decisionNote: string | null; createdAt: string; }

// Notification
export type NotificationType = 'TASK_ASSIGNED' | 'TASK_ACCEPTED' | 'PROGRESS_UPDATE' | 'EXTENSION_REQUEST' | 'APPROVAL_NEEDED' | 'TASK_COMPLETED' | 'TASK_OVERDUE' | 'COMMENT' | 'DEADLINE_REMINDER';
export interface Notification { id: string; type: NotificationType; title: string; message: string; linkTo: string; isRead: boolean; createdAt: string; }

// Audit
export interface AuditLog { id: string; action: string; entityType: string; entityId: string; userId: string; userName: string; changes: string; createdAt: string; ipAddress: string; }

// Report
export interface ReportKPI { totalTasks: number; inProgress: number; waitingApproval: number; completed: number; onTime: number; nearDeadline: number; overdue: number; completionRate: number; onTimeRate: number; }

// Permission
export interface Permission { id: string; code: string; name: string; module: string; }
export interface Role { id: string; name: string; code: string; description: string; permissions: string[]; userCount: number; }
