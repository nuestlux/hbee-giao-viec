import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Calendar,
  FileText,
  Building2,
  UserCircle2,
  Edit2,
  Trash2,
  Check,
  Eye,
  BadgeCheck,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  StatusBadge,
  UrgencyBadge,
  ProgressBar,
  DataTable,
  FilterBar,
  filterSelectClass,
  ConfirmDialog,
  Pagination,
} from '../components';
import type { Task } from '../types';
import {
  canApproveTaskResult,
  canEditTaskMeta,
  canUpdateTaskProgress,
  hasPermission,
} from '../utils/permissions';
import { PAGE_COPY, TASK_STATUS_FILTER_OPTIONS, TASK_STATUS_LABELS } from '../utils/ui-labels';
import { sortRows, toggleSort, type SortState } from '../utils/table-sort';
import { useClientPagination } from '../hooks/use-client-pagination';

type TaskTab = 'assigned-by-me' | 'assigned-to-me' | 'all';
type DeadlineFilter = 'all' | 'near' | 'overdue';

function daysUntil(due: string) {
  return (new Date(due).getTime() - Date.now()) / 86400000;
}

export default function Tasks() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tasks, departments, currentUser, roles, deleteTask, changeTaskStatus } = useStore();

  const canCreate =
    hasPermission(currentUser, roles, 'task.create') ||
    hasPermission(currentUser, roles, 'task.assign');
  /** Sửa meta hoặc cập nhật tiến độ trên từng dòng */
  const canOpenTaskWorkspace = (task: Task) =>
    canEditTaskMeta(currentUser, roles, task) ||
    canUpdateTaskProgress(currentUser, roles, task);
  const canDelete =
    hasPermission(currentUser, roles, 'task.cancel') ||
    hasPermission(currentUser, roles, 'task.assign') ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'CHAIRMAN';
  const hasApprovePerm = hasPermission(currentUser, roles, 'task.approve');

  const tabParam = searchParams.get('tab');
  const tab: TaskTab =
    tabParam === 'assigned-by-me' || tabParam === 'assigned-to-me' || tabParam === 'all'
      ? tabParam
      : 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('all');
  const [sort, setSort] = useState<SortState>({ key: 'createdAt', direction: 'desc' });

  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'ok' | 'err' } | null>(null);

  const showToast = (message: string, variant: 'ok' | 'err' = 'ok') => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 3000);
  };

  const setTab = (next: TaskTab) => {
    if (next === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: next });
    }
  };

  const hasActiveFilters =
    Boolean(searchTerm) ||
    statusFilter !== 'all' ||
    deptFilter !== 'all' ||
    deadlineFilter !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDeptFilter('all');
    setDeadlineFilter('all');
  };

  const filteredTasks = useMemo(() => {
    const uid = currentUser?.id;
    const filtered = tasks.filter((task) => {
      if (tab === 'assigned-by-me' && task.assignerId !== uid) return false;
      if (tab === 'assigned-to-me' && task.assigneeId !== uid) return false;

      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        task.title.toLowerCase().includes(q) ||
        task.assigneeName?.toLowerCase().includes(q) ||
        task.assignedDepartmentName?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchDept =
        deptFilter === 'all' || task.assignedDepartmentId === deptFilter;

      let matchDeadline = true;
      if (deadlineFilter === 'overdue') {
        matchDeadline =
          task.isOverdue ||
          (task.status !== 'COMPLETED' &&
            task.status !== 'CANCELLED' &&
            daysUntil(task.dueDate) < 0);
      } else if (deadlineFilter === 'near') {
        const d = daysUntil(task.dueDate);
        matchDeadline =
          task.status !== 'COMPLETED' &&
          task.status !== 'CANCELLED' &&
          d >= 0 &&
          d <= 3;
      }

      return matchSearch && matchStatus && matchDept && matchDeadline;
    });

    return sortRows(filtered, sort, {
      title: (r) => r.title || '',
      assignee: (r) => r.assigneeName || r.assignedDepartmentName || '',
      progress: (r) => r.progress || 0,
      status: (r) => r.status || '',
      dueDate: (r) => r.dueDate,
      createdAt: (r) => r.createdAt,
    });
  }, [
    tasks,
    tab,
    currentUser?.id,
    searchTerm,
    statusFilter,
    deptFilter,
    deadlineFilter,
    sort,
  ]);

  const pageResetKey = `${tab}|${searchTerm}|${statusFilter}|${deptFilter}|${deadlineFilter}|${sort.key}|${sort.direction}`;
  const {
    page,
    setPage,
    pageSize,
    total,
    totalPages,
    pageItems: pagedTasks,
  } = useClientPagination(filteredTasks, 10, pageResetKey);

  const openCreate = () => {
    if (!canCreate) return;
    navigate('/tasks/new');
  };

  const openEdit = (task: Task, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!canOpenTaskWorkspace(task)) return;
    navigate(`/tasks/${task.id}?edit=1`);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const result = deleteTask(deleteTarget.id);
    setDeleteTarget(null);
    if (!result.ok) {
      showToast(result.error || 'Xóa thất bại', 'err');
      return;
    }
    showToast('Đã xóa nhiệm vụ');
  };

  const handleQuickApprove = (row: Task) => {
    if (!canApproveTaskResult(currentUser, roles, row)) {
      showToast('Không có quyền phê duyệt việc này', 'err');
      return;
    }
    const ok = changeTaskStatus(row.id, 'COMPLETED');
    if (!ok) {
      showToast('Phê duyệt thất bại', 'err');
      return;
    }
    showToast('Đã phê duyệt — hoàn thành');
  };

  const columns = [
    {
      key: 'title',
      title: 'Nội dung việc',
      sortable: true,
      render: (row: Task) => (
        <div className="max-w-md">
          <div className="font-semibold text-gray-900 line-clamp-2">{row.title}</div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              <FileText size={12} />
              {row.categoryName || '—'}
            </span>
            <UrgencyBadge urgency={row.urgency} />
          </div>
        </div>
      ),
    },
    {
      key: 'assignee',
      title: 'Giao cho',
      sortable: true,
      render: (row: Task) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
            <Building2 size={14} className="text-gray-400" />
            {row.assignedDepartmentName || '—'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <UserCircle2 size={14} className="text-gray-400" />
            {row.assigneeName || 'Chưa giao người'}
          </div>
        </div>
      ),
    },
    {
      key: 'progress',
      title: 'Tiến độ',
      sortable: true,
      render: (row: Task) => (
        <div className="w-32">
          <ProgressBar value={row.progress} showLabel size="sm" />
          <div
            className={`flex items-center gap-1 mt-1 text-xs ${
              row.isOverdue || daysUntil(row.dueDate) < 0
                ? 'text-red-600 font-medium'
                : daysUntil(row.dueDate) <= 3
                  ? 'text-amber-600'
                  : 'text-gray-500'
            }`}
          >
            <Calendar size={12} />
            Hạn: {row.dueDate ? new Date(row.dueDate).toLocaleDateString('vi-VN') : '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      sortable: true,
      render: (row: Task) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right' as const,
      render: (row: Task) => {
        const showApprove =
          hasApprovePerm && canApproveTaskResult(currentUser, roles, row);
        return (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {showApprove && (
              <button
                type="button"
                onClick={() => handleQuickApprove(row)}
                className="inline-flex items-center justify-center p-1.5 text-emerald-600 rounded-md hover:bg-emerald-50 hover:text-emerald-700"
                title="Phê duyệt"
                aria-label="Phê duyệt"
              >
                <BadgeCheck size={18} strokeWidth={1.75} />
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(`/tasks/${row.id}`)}
              className="p-1.5 text-gray-400 hover:text-primary-600 rounded-md hover:bg-primary-50"
              title="Xem"
            >
              <Eye size={16} />
            </button>
            {canOpenTaskWorkspace(row) && (
              <button
                type="button"
                onClick={(e) => openEdit(row, e)}
                className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                title={
                  canEditTaskMeta(currentUser, roles, row) ? 'Sửa' : 'Cập nhật tiến độ'
                }
              >
                <Edit2 size={16} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(row);
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                title="Xóa"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[210] text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm ${
            toast.variant === 'err' ? 'bg-red-500' : 'bg-emerald-500'
          }`}
        >
          <Check size={16} />
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
          {PAGE_COPY.tasks.title}
        </h1>
        {canCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus size={16} />
            {PAGE_COPY.tasks.create}
          </button>
        )}
      </div>

      {/* Tabs: Tôi giao / Giao cho tôi */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-0">
        {(
          [
            { id: 'all' as const, label: PAGE_COPY.tasks.tabAll },
            { id: 'assigned-by-me' as const, label: PAGE_COPY.tasks.tabByMe },
            { id: 'assigned-to-me' as const, label: PAGE_COPY.tasks.tabToMe },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo tên việc, người làm, phòng..."
        total={filteredTasks.length}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={filterSelectClass}
          aria-label="Lọc trạng thái"
        >
          <option value="all">Mọi trạng thái</option>
          {TASK_STATUS_FILTER_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {TASK_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className={filterSelectClass}
          aria-label="Lọc phòng ban"
        >
          <option value="all">Mọi phòng</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={deadlineFilter}
          onChange={(e) => setDeadlineFilter(e.target.value as DeadlineFilter)}
          className={filterSelectClass}
          aria-label="Lọc hạn"
        >
          <option value="all">Mọi hạn</option>
          <option value="near">Sắp đến hạn</option>
          <option value="overdue">Quá hạn</option>
        </select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={pagedTasks}
        onRowClick={(row) => navigate(`/tasks/${row.id}`)}
        emptyMessage={PAGE_COPY.tasks.empty}
        sortKey={sort.key}
        sortDirection={sort.direction}
        onSort={(key) => setSort((s) => toggleSort(s, key))}
        size="middle"
      />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        total={total}
        pageSize={pageSize}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa việc này?"
        message={
          deleteTarget
            ? `Xóa «${deleteTarget.title}»? Việc đã hoàn thành sẽ không xóa được.`
            : ''
        }
        confirmLabel="Xóa"
        variant="danger"
      />
    </div>
  );
}
