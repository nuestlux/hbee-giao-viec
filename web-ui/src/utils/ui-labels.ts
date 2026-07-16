/**
 * Thuật ngữ UI thống nhất.
 * Giọng: ERP/hành chính — ngắn, không giải thích thừa.
 */
import type {
  TaskStatus,
  UrgencyLevel,
  SecurityLevel,
  DocumentSourceKind,
} from '../types';

/** Nhãn trạng thái dùng UI + xuất báo cáo (col 10) */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  DRAFT: 'Nháp',
  ASSIGNED: 'Đã giao',
  ACCEPTED: 'Đã nhận',
  IN_PROGRESS: 'Đang thực hiện',
  WAITING_APPROVAL: 'Chờ phê duyệt',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Từ chối',
  NEEDS_CHANGES: 'Cần bổ sung',
  PAUSED: 'Tạm dừng',
  CANCELLED: 'Đã hủy',
};

/** Filter danh sách — chỉ các trạng thái hay dùng */
export const TASK_STATUS_FILTER_OPTIONS: TaskStatus[] = [
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_APPROVAL',
  'COMPLETED',
  'CANCELLED',
];

export const DOCUMENT_SOURCE_KIND_LABELS: Record<DocumentSourceKind, string> = {
  NGHI_QUYET: 'Nghị quyết',
  KET_LUAN: 'Kết luận',
  CHI_THI: 'Chỉ thị',
  CTHD: 'Chương trình hành động',
  KE_HOACH: 'Kế hoạch',
  CONG_VAN: 'Công văn',
  KHAC: 'Khác',
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  THUONG: 'Thường',
  KHAN: 'Khẩn',
  THUONG_KHAN: 'Thượng khẩn',
};

export const SECURITY_LABELS: Record<SecurityLevel, string> = {
  THUONG: 'Thường',
  MAT: 'Mật',
  TOI_MAT: 'Tối mật',
};

export const EXTENSION_STATUS_LABELS = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
} as const;

/** Tiêu đề & nhãn màn hình — không kèm mô tả marketing */
export const PAGE_COPY = {
  home: {
    title: 'Trang chủ',
  },
  documents: {
    title: 'Văn bản đến',
    create: 'Tiếp nhận',
    createModal: 'Tiếp nhận văn bản',
    editModal: 'Sửa văn bản',
    empty: 'Không có văn bản',
  },
  tasks: {
    title: 'Nhiệm vụ',
    create: 'Giao việc',
    createModal: 'Giao việc mới',
    editModal: 'Sửa nhiệm vụ',
    empty: 'Chưa có nhiệm vụ',
    tabAll: 'Tất cả',
    tabByMe: 'Tôi giao',
    tabToMe: 'Được giao',
  },
  departmentWork: {
    title: 'Công việc phòng',
  },
  reports: {
    title: 'Báo cáo',
  },
  notifications: {
    title: 'Thông báo',
    /** Chỉ hiện khi còn chưa đọc */
    unreadCount: (n: number) => (n > 0 ? `${n} chưa đọc` : ''),
    markAll: 'Đọc tất cả',
    empty: 'Chưa có thông báo',
  },
  settings: {
    title: 'Cài đặt chung',
    menu: 'Cài đặt chung',
  },
  users: {
    title: 'Người dùng',
    create: 'Thêm người dùng',
    createModal: 'Thêm người dùng',
    editModal: 'Sửa người dùng',
  },
  roles: {
    title: 'Vai trò & quyền',
    create: 'Tạo vai trò',
    createModal: 'Tạo vai trò',
    editModal: 'Sửa vai trò',
  },
  departments: {
    title: 'Phòng ban',
    create: 'Thêm phòng ban',
    createModal: 'Thêm phòng ban',
    editModal: 'Sửa phòng ban',
  },
  catalogs: {
    title: 'Danh mục',
  },
  admin: {
    title: 'Quản trị',
  },
  login: {
    title: 'Đăng nhập',
  },
  appTagline: 'Giao việc',
} as const;

export function getTaskStatusLabel(status: string): string {
  return TASK_STATUS_LABELS[status as TaskStatus] || status;
}

/** Alias báo cáo — cùng map UI */
export function getTaskStatusReportLabel(status: string): string {
  return getTaskStatusLabel(status);
}

export function getDocumentSourceKindLabel(kind: string | null | undefined): string {
  if (!kind) return '';
  return DOCUMENT_SOURCE_KIND_LABELS[kind as DocumentSourceKind] || kind;
}
