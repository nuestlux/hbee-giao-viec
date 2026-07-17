import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  Send,
  AlertCircle,
  FileText,
  CalendarClock,
  Check,
  History,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  StatusBadge,
  UrgencyBadge,
  ProgressBar,
  Avatar,
  Modal,
  FormField,
  inputClass,
  textareaClass,
  selectClass,
  TaskFormFields,
  ExpandableSection,
  DataTable,
} from '../components';
import type { TaskStatus } from '../types';
import {
  canEditTaskMeta,
  canUpdateTaskProgress,
  hasPermission,
} from '../utils/permissions';
import { EXTENSION_STATUS_LABELS, TASK_STATUS_LABELS } from '../utils/ui-labels';
import {
  PROGRESS_LEVELS,
  getProgressLevelLabel,
  snapProgressToLevel,
  type ProgressLevelValue,
} from '../utils/progress-levels';
import {
  computeProgressLevel,
  getProgressLevelLabel as getDeadlineLevelLabel,
} from '../utils/report-progress-level';
import { emptyTaskForm, isTaskFormValid, taskToFormData } from '../utils/task-form';
import {
  buildTaskChangeHistory,
  type TaskChangeHistoryRow,
} from '../utils/task-change-history';
import type { ProgressLevelCode } from '../types';

type WorkspaceMode = 'create' | 'view' | 'edit';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isCreate = id === 'new';

  const {
    tasks,
    progressUpdates,
    taskComments,
    extensionRequests,
    auditLogs,
    departments,
    users,
    taskCategories,
    fields,
    currentUser,
    roles,
    changeTaskStatus,
    addProgressUpdate,
    addComment,
    addExtensionRequest,
    approveExtension,
    rejectExtension,
    addTask,
    updateTask,
  } = useStore();

  const task = useMemo(
    () => (isCreate ? undefined : tasks.find((t) => t.id === id)),
    [tasks, id, isCreate],
  );

  const canCreate =
    hasPermission(currentUser, roles, 'task.create') ||
    hasPermission(currentUser, roles, 'task.assign');
  /** Meta (tiêu đề, phân công…) — KHÔNG dùng task.update (đó là tiến độ). */
  const canEditMeta = canEditTaskMeta(currentUser, roles, task);
  /** Tiến độ: task.update hoặc người được giao / người giao / cùng phòng (chưa gán người). */
  const canUpdateProgress = canUpdateTaskProgress(currentUser, roles, task);
  /** Vào màn Sửa nếu sửa meta HOẶC cập nhật tiến độ. */
  const canOpenEdit = canEditMeta || canUpdateProgress;
  const canChangeStatus =
    canUpdateProgress ||
    hasPermission(currentUser, roles, 'task.accept') ||
    hasPermission(currentUser, roles, 'task.approve') ||
    hasPermission(currentUser, roles, 'task.assign');
  const canRequestExt =
    hasPermission(currentUser, roles, 'extension.request') ||
    task?.assigneeId === currentUser?.id;
  const canApproveExt = hasPermission(currentUser, roles, 'extension.approve');

  const wantEdit = searchParams.get('edit') === '1';
  const [editingLocal, setEditingLocal] = useState(false);
  const mode: WorkspaceMode = isCreate
    ? 'create'
    : editingLocal || (wantEdit && canOpenEdit)
      ? 'edit'
      : 'view';

  const [formData, setFormData] = useState(() =>
    isCreate ? emptyTaskForm() : task ? taskToFormData(task) : emptyTaskForm(),
  );
  const [progressNote, setProgressNote] = useState('');
  const [progressDifficulties, setProgressDifficulties] = useState('');
  const [progressSuggestions, setProgressSuggestions] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (isCreate) {
      setFormData(emptyTaskForm());
      setDirty(false);
      setEditingLocal(false);
      return;
    }
    // Reset when task id changes (incl. post-create navigate)
    if (task) {
      setFormData(taskToFormData(task));
      setDirty(false);
      // Only auto-edit if URL says so AND allowed
      setEditingLocal(wantEdit && canOpenEdit);
    }
  }, [task?.id, isCreate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isCreate && wantEdit) {
      if (canOpenEdit) {
        setEditingLocal(true);
        if (task) setFormData(taskToFormData(task));
      } else {
        setEditingLocal(false);
        searchParams.delete('edit');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [wantEdit, isCreate, canOpenEdit, task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const comments = taskComments
    .filter((c) => c.taskId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const extensions = extensionRequests
    .filter((e) => e.taskId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const changeHistory = useMemo(() => {
    if (!id || isCreate) return [] as TaskChangeHistoryRow[];
    return buildTaskChangeHistory({
      taskId: id,
      auditLogs,
      progressUpdates,
      extensions: extensionRequests,
      comments: taskComments,
    });
  }, [id, isCreate, auditLogs, progressUpdates, extensionRequests, taskComments]);

  const historyColumns = useMemo(
    () => [
      {
        key: 'time',
        title: 'Thời gian',
        width: '11rem',
        render: (row: TaskChangeHistoryRow) => (
          <span className="text-xs text-slate-600 whitespace-nowrap">
            {new Date(row.createdAt).toLocaleString('vi-VN')}
          </span>
        ),
      },
      {
        key: 'user',
        title: 'Người thực hiện',
        width: '9rem',
        render: (row: TaskChangeHistoryRow) => (
          <span className="text-sm font-medium text-slate-900">{row.userName}</span>
        ),
      },
      {
        key: 'kind',
        title: 'Loại',
        width: '8rem',
        render: (row: TaskChangeHistoryRow) => {
          const tone: Record<TaskChangeHistoryRow['kindTone'], string> = {
            neutral: 'bg-slate-100 text-slate-700',
            blue: 'bg-blue-50 text-blue-700',
            amber: 'bg-amber-50 text-amber-800',
            emerald: 'bg-emerald-50 text-emerald-700',
            slate: 'bg-slate-100 text-slate-600',
            violet: 'bg-violet-50 text-violet-700',
          };
          return (
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${tone[row.kindTone]}`}
            >
              {row.kind}
            </span>
          );
        },
      },
      {
        key: 'detail',
        title: 'Nội dung thay đổi',
        render: (row: TaskChangeHistoryRow) => (
          <span className="text-sm text-slate-700 whitespace-pre-wrap break-words">
            {row.detail}
          </span>
        ),
      },
    ],
    [],
  );

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isExtModalOpen, setIsExtModalOpen] = useState(false);
  const [statusData, setStatusData] = useState<{ status: TaskStatus }>({
    status: task?.status || 'IN_PROGRESS',
  });
  const [extData, setExtData] = useState({ requestedDueDate: '', reason: '' });
  const [commentText, setCommentText] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const patchForm = (next: Partial<typeof formData>) => {
    setFormData(next);
    setDirty(true);
  };

  const clearEditQuery = () => {
    if (!wantEdit) return;
    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    setSearchParams(next, { replace: true });
  };

  const resetProgressDraft = () => {
    setProgressNote('');
    setProgressDifficulties('');
    setProgressSuggestions('');
  };

  const exitEdit = () => {
    if (task) setFormData(taskToFormData(task));
    resetProgressDraft();
    setEditingLocal(false);
    setDirty(false);
    clearEditQuery();
  };

  const handleBack = () => {
    if ((mode === 'edit' || mode === 'create') && dirty) {
      if (!window.confirm('Có thay đổi chưa lưu. Rời trang?')) return;
    }
    navigate('/tasks');
  };

  const applyProgressIfNeeded = (taskId: string, previous: number, next: number) => {
    const hasNote =
      Boolean(progressNote.trim()) ||
      Boolean(progressDifficulties.trim()) ||
      Boolean(progressSuggestions.trim());
    // Allow save if mốc đổi HOẶC có ghi chú/khó khăn/đề xuất (cùng mốc vẫn cập nhật ghi nhận)
    if (next === previous && !hasNote) return false;
    addProgressUpdate({
      taskId,
      progress: next,
      content: progressNote.trim() || (next === previous ? 'Bổ sung khó khăn / đề xuất' : 'Cập nhật tiến độ'),
      difficulties: progressDifficulties.trim() || undefined,
      suggestions: progressSuggestions.trim() || undefined,
    });
    return true;
  };

  const handleSaveMeta = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (mode === 'create') {
      if (!isTaskFormValid(formData)) {
        showToast('Nhập đủ các mục bắt buộc');
        return;
      }
      if (!canCreate) {
        showToast('Không có quyền giao việc');
        return;
      }
      const created = addTask({ ...formData, status: 'ASSIGNED' });
      if (!created) {
        showToast('Không có quyền giao việc');
        return;
      }
      showToast('Đã giao việc');
      setDirty(false);
      setEditingLocal(false);
      navigate(`/tasks/${created.id}`, { replace: true });
      return;
    }

    if (!task || !canOpenEdit) {
      showToast('Không có quyền sửa');
      return;
    }

    const nextProgress = snapProgressToLevel(formData.progress ?? task.progress ?? 0);
    const prevProgress = snapProgressToLevel(task.progress);
    const progressChanged = nextProgress !== prevProgress;

    // ── Chỉ quyền tiến độ (chuyên viên / người được giao) ──
    if (canUpdateProgress && !canEditMeta) {
      const ok = applyProgressIfNeeded(task.id, prevProgress, nextProgress);
      if (!ok) {
        showToast('Đổi mốc tiến độ hoặc nhập ghi chú / khó khăn / đề xuất rồi Lưu');
        return;
      }
      showToast('Đã cập nhật tiến độ');
      resetProgressDraft();
      setEditingLocal(false);
      setDirty(false);
      clearEditQuery();
      const updated = useStore.getState().tasks.find((t) => t.id === task.id);
      if (updated) setFormData(taskToFormData(updated));
      return;
    }

    if (!canEditMeta) {
      showToast('Không có quyền sửa');
      return;
    }

    if (!isTaskFormValid(formData)) {
      showToast('Nhập đủ các mục bắt buộc');
      return;
    }

    // Tiến độ trước (previousProgress đúng), rồi meta (bỏ progress khỏi patch)
    const progressSaved =
      canUpdateProgress && applyProgressIfNeeded(task.id, prevProgress, nextProgress);

    const metaPatch: Partial<typeof formData> = { ...formData };
    delete metaPatch.progress;

    const ok = updateTask(task.id, metaPatch);
    if (!ok) {
      showToast(
        progressSaved
          ? 'Đã cập nhật tiến độ; phần thông tin khác không lưu được (thiếu quyền)'
          : 'Không sửa được — kiểm tra quyền',
      );
      if (progressSaved) {
        resetProgressDraft();
        setEditingLocal(false);
        setDirty(false);
        clearEditQuery();
      }
      return;
    }
    showToast(progressSaved ? 'Đã lưu (kèm tiến độ)' : 'Đã lưu');
    resetProgressDraft();
    setEditingLocal(false);
    setDirty(false);
    clearEditQuery();
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    const ok = changeTaskStatus(task.id, statusData.status);
    if (!ok) {
      showToast('Không có quyền đổi trạng thái');
      return;
    }
    setIsStatusModalOpen(false);
    showToast('Đã đổi trạng thái');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !commentText.trim()) return;
    addComment({ taskId: task.id, content: commentText.trim() });
    setCommentText('');
  };

  const handleExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !canRequestExt) {
      showToast('Không có quyền yêu cầu gia hạn');
      return;
    }
    if (!extData.requestedDueDate || !extData.reason.trim()) return;
    addExtensionRequest({
      taskId: task.id,
      requestedDueDate: extData.requestedDueDate,
      reason: extData.reason.trim(),
    });
    setIsExtModalOpen(false);
    setExtData({ requestedDueDate: '', reason: '' });
    showToast('Đã gửi yêu cầu gia hạn');
  };

  if (!isCreate && !task) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle size={48} className="text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy nhiệm vụ</h2>
        <button type="button" onClick={() => navigate('/tasks')} className="text-primary-600 hover:underline">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  if (isCreate && !canCreate) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle size={48} className="text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền giao việc</h2>
        <button type="button" onClick={() => navigate('/tasks')} className="text-primary-600 hover:underline">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const readOnly = mode === 'view';
  const displayTitle = mode === 'create' ? formData.title || 'Giao việc mới' : task?.title || '';
  const displayStatus = task?.status;
  const displayUrgency = mode === 'view' ? task?.urgency : formData.urgency;

  const asOfToday = new Date().toISOString().slice(0, 10);
  const deadlineLevel: ProgressLevelCode | null = task
    ? computeProgressLevel(task.dueDate, task.completedDate, task.status, asOfToday)
    : null;
  const deadlineLevelLabel = deadlineLevel ? getDeadlineLevelLabel(deadlineLevel) : '';
  const deadlineBadgeClass =
    deadlineLevel === 'OVERDUE'
      ? 'bg-red-50 text-red-700'
      : deadlineLevel === 'NEAR_DEADLINE'
        ? 'bg-amber-50 text-amber-800'
        : 'bg-emerald-50 text-emerald-700';

  const approvedExts = extensions.filter((e) => e.status === 'APPROVED');
  const extCount = approvedExts.length;
  const lastExtPreviousDue =
    approvedExts.length > 0
      ? [...approvedExts].sort(
          (a, b) =>
            new Date(b.decidedAt || b.createdAt).getTime() -
            new Date(a.decidedAt || a.createdAt).getTime(),
        )[0].currentDueDate
      : null;

  const coordinatingLabel = (ids: string[] | undefined) =>
    (ids || [])
      .map((cid) => departments.find((d) => d.id === cid)?.name || cid)
      .filter(Boolean)
      .join('; ') || '—';

  const progressValue = mode === 'edit' ? (formData.progress ?? task?.progress ?? 0) : (task?.progress ?? 0);

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-8">
      {toast && (
        <div className="fixed top-4 right-4 z-[210] bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check size={16} />
          {toast}
        </div>
      )}

      {/* Header — title + badges + actions */}
      <div className="sticky top-0 z-20 -mx-1 px-1 py-2.5 bg-[#f8fafc]/95 backdrop-blur border-b border-slate-100/80">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors shrink-0 self-start"
            aria-label="Quay lại"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0 space-y-1.5">
            {(mode === 'create' || (mode === 'edit' && canEditMeta)) ? (
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => patchForm({ ...formData, title: e.target.value })}
                className="w-full text-xl sm:text-2xl font-bold text-slate-900 tracking-tight bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-500"
                placeholder="Tên nhiệm vụ"
                required
              />
            ) : (
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                {displayTitle}
              </h1>
            )}
            {task && (
              <div className="flex flex-wrap items-center gap-2">
                {displayStatus && <StatusBadge status={displayStatus} />}
                {(displayUrgency || task.urgency) && (
                  <UrgencyBadge urgency={displayUrgency || task.urgency} />
                )}
                {deadlineLevelLabel && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${deadlineBadgeClass}`}
                  >
                    {deadlineLevelLabel}
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {task.categoryName || '—'}
                  {task.dueDate
                    ? ` · Hạn ${new Date(task.dueDate).toLocaleDateString('vi-VN')}`
                    : ''}
                  {task.assignerName ? ` · ${task.assignerName}` : ''}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {mode === 'view' && canOpenEdit && (
              <button
                type="button"
                onClick={() => {
                  if (task) setFormData(taskToFormData(task));
                  resetProgressDraft();
                  setEditingLocal(true);
                  setDirty(false);
                }}
                className="px-3 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {canEditMeta ? 'Sửa' : 'Cập nhật tiến độ'}
              </button>
            )}
            {mode === 'view' && canChangeStatus && task && (
              <button
                type="button"
                onClick={() => {
                  setStatusData({ status: task.status });
                  setIsStatusModalOpen(true);
                }}
                className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Trạng thái
              </button>
            )}
            {mode === 'view' && canRequestExt && task && (
              <button
                type="button"
                onClick={() => setIsExtModalOpen(true)}
                className="px-3 py-1.5 text-sm font-medium bg-amber-50 text-amber-800 rounded-lg hover:bg-amber-100 inline-flex items-center gap-1"
              >
                <CalendarClock size={14} />
                Gia hạn
              </button>
            )}
            {(mode === 'edit' || mode === 'create') && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (mode === 'create') handleBack();
                    else exitEdit();
                  }}
                  className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveMeta()}
                  className="px-3 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {mode === 'create' ? 'Giao việc' : 'Lưu'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main: content → progress → history → meta extras */}
        <div className="lg:col-span-2 space-y-3">
          {/* Progress first when only updating progress */}
          {!isCreate && task && mode === 'edit' && canUpdateProgress && !canEditMeta && (
            <ExpandableSection
              title="Tiến độ"
              icon={<Clock size={16} />}
              defaultOpen
              compact
              badge={
                <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                  {getProgressLevelLabel(progressValue)}
                </span>
              }
            >
              <div className="space-y-3">
                <FormField label="Mốc" required className="mb-0">
                  <select
                    value={snapProgressToLevel(progressValue)}
                    onChange={(e) => {
                      patchForm({
                        ...formData,
                        progress: Number(e.target.value) as ProgressLevelValue,
                      });
                    }}
                    className={selectClass}
                  >
                    {PROGRESS_LEVELS.map((lv) => (
                      <option key={lv.value} value={lv.value}>
                        {lv.label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Nội dung" className="mb-0">
                  <textarea
                    value={progressNote}
                    onChange={(e) => {
                      setProgressNote(e.target.value);
                      setDirty(true);
                    }}
                    className={textareaClass}
                    rows={2}
                    placeholder="Đã làm gì..."
                  />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Khó khăn" className="mb-0">
                    <textarea
                      value={progressDifficulties}
                      onChange={(e) => {
                        setProgressDifficulties(e.target.value);
                        setDirty(true);
                      }}
                      className={textareaClass}
                      rows={2}
                      placeholder="Nếu có"
                    />
                  </FormField>
                  <FormField label="Đề xuất" className="mb-0">
                    <textarea
                      value={progressSuggestions}
                      onChange={(e) => {
                        setProgressSuggestions(e.target.value);
                        setDirty(true);
                      }}
                      className={textareaClass}
                      rows={2}
                      placeholder="Nếu có"
                    />
                  </FormField>
                </div>
                <ProgressBar value={snapProgressToLevel(progressValue)} size="lg" labelMode="level" />
              </div>
            </ExpandableSection>
          )}

          {(mode === 'create' || canEditMeta || mode === 'view') && (
            <TaskFormFields
              value={formData}
              onChange={patchForm}
              departments={departments}
              users={users}
              taskCategories={taskCategories}
              fields={fields}
              readOnly={readOnly || (mode === 'edit' && !canEditMeta)}
              metaReadOnly={mode === 'edit' && !canEditMeta}
              showTitle={false}
              showDescription
              showProgressSelect={false}
              extraDefaultOpen={false}
              showExtra={canEditMeta || mode === 'view'}
              showExpandToolbar={mode === 'create' || (mode === 'edit' && canEditMeta)}
            />
          )}

          {/* Progress (view / full edit) */}
          {!isCreate && task && !(mode === 'edit' && canUpdateProgress && !canEditMeta) && (
            <ExpandableSection
              title="Tiến độ"
              icon={<Clock size={16} />}
              defaultOpen
              compact
              summary={getProgressLevelLabel(progressValue)}
              badge={
                <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                  {getProgressLevelLabel(progressValue)}
                </span>
              }
            >
              {mode === 'edit' && canUpdateProgress ? (
                <div className="space-y-3">
                  <FormField label="Mốc" required className="mb-0">
                    <select
                      value={snapProgressToLevel(progressValue)}
                      onChange={(e) => {
                        patchForm({
                          ...formData,
                          progress: Number(e.target.value) as ProgressLevelValue,
                        });
                      }}
                      className={selectClass}
                    >
                      {PROGRESS_LEVELS.map((lv) => (
                        <option key={lv.value} value={lv.value}>
                          {lv.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Nội dung" className="mb-0">
                    <textarea
                      value={progressNote}
                      onChange={(e) => {
                        setProgressNote(e.target.value);
                        setDirty(true);
                      }}
                      className={textareaClass}
                      rows={2}
                      placeholder="Đã làm gì..."
                    />
                  </FormField>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Khó khăn" className="mb-0">
                      <textarea
                        value={progressDifficulties}
                        onChange={(e) => {
                          setProgressDifficulties(e.target.value);
                          setDirty(true);
                        }}
                        className={textareaClass}
                        rows={2}
                        placeholder="Nếu có"
                      />
                    </FormField>
                    <FormField label="Đề xuất" className="mb-0">
                      <textarea
                        value={progressSuggestions}
                        onChange={(e) => {
                          setProgressSuggestions(e.target.value);
                          setDirty(true);
                        }}
                        className={textareaClass}
                        rows={2}
                        placeholder="Nếu có"
                      />
                    </FormField>
                  </div>
                  <ProgressBar value={snapProgressToLevel(progressValue)} size="lg" labelMode="level" />
                </div>
              ) : (
                <ProgressBar value={task.progress} size="lg" labelMode="level" />
              )}
            </ExpandableSection>
          )}

          {!isCreate && task && (
            <ExpandableSection
              title="Lịch sử"
              icon={<History size={16} />}
              defaultOpen={mode === 'view'}
              compact
              summary={changeHistory.length ? `${changeHistory.length} mục` : 'Trống'}
              badge={
                changeHistory.length > 0 ? (
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {changeHistory.length}
                  </span>
                ) : undefined
              }
            >
              <DataTable
                columns={historyColumns}
                data={changeHistory}
                size="middle"
                emptyMessage="Chưa có thay đổi."
              />
            </ExpandableSection>
          )}

          {!isCreate && task && (
            <ExpandableSection
              title="Thông tin khác"
              icon={<FileText size={16} />}
              defaultOpen={false}
              compact
              summary={[
                task.assigneeName || task.assignedDepartmentName,
                coordinatingLabel(task.coordinatingDepartments) !== '—'
                  ? `PH: ${coordinatingLabel(task.coordinatingDepartments)}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            >
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Phòng / người làm</dt>
                  <dd className="font-medium text-slate-900">
                    {task.assignedDepartmentName || '—'}
                    {task.assigneeName ? ` · ${task.assigneeName}` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Phối hợp</dt>
                  <dd className="font-medium text-slate-900">
                    {coordinatingLabel(task.coordinatingDepartments)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Người giao</dt>
                  <dd className="font-medium text-slate-900">{task.assignerName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">ID / mã ngoài</dt>
                  <dd className="font-medium text-slate-900 break-all">
                    {task.id}
                    {task.externalTaskId ? ` · ${task.externalTaskId}` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Cập nhật</dt>
                  <dd className="font-medium text-slate-900">
                    {task.updatedAt ? new Date(task.updatedAt).toLocaleString('vi-VN') : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Hoàn thành thực tế</dt>
                  <dd className="font-medium text-slate-900">
                    {task.completedDate
                      ? new Date(task.completedDate).toLocaleDateString('vi-VN')
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Gia hạn (đã duyệt)</dt>
                  <dd className="font-medium text-slate-900">
                    {extCount}
                    {lastExtPreviousDue
                      ? ` · mốc cũ ${new Date(lastExtPreviousDue).toLocaleDateString('vi-VN')}`
                      : ''}
                  </dd>
                </div>
              </dl>
            </ExpandableSection>
          )}

          {!isCreate && extensions.length > 0 && (
            <ExpandableSection
              title="Gia hạn"
              icon={<CalendarClock size={16} />}
              defaultOpen={false}
              compact
              summary={`${extensions.length} yêu cầu`}
              badge={
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  {extensions.length}
                </span>
              }
            >
              <div className="space-y-3">
                {extensions.map((ext) => (
                  <div
                    key={ext.id}
                    className="p-3 rounded-xl border border-gray-100 bg-white text-sm space-y-2"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-medium text-gray-900">{ext.requesterName}</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          ext.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700'
                            : ext.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {EXTENSION_STATUS_LABELS[ext.status]}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      Hạn hiện tại: {new Date(ext.currentDueDate).toLocaleDateString('vi-VN')} → đề
                      nghị: {new Date(ext.requestedDueDate).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-gray-700">{ext.reason}</p>
                    {ext.status === 'PENDING' && canApproveExt && (
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            approveExtension(ext.id, 'Đồng ý gia hạn');
                            showToast('Đã phê duyệt gia hạn');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg"
                        >
                          Duyệt
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            rejectExtension(ext.id, 'Không đồng ý');
                            showToast('Đã từ chối gia hạn');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded-lg"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ExpandableSection>
          )}
        </div>

        {/* Chat — sticky sidebar */}
        <div className="lg:sticky lg:top-20 self-start">
          <ExpandableSection
            title="Trao đổi"
            icon={<MessageSquare size={16} />}
            defaultOpen
            compact
            summary={
              isCreate
                ? 'Sau khi giao'
                : comments.length
                  ? `${comments.length} tin`
                  : 'Trống'
            }
            badge={
              !isCreate && comments.length > 0 ? (
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  {comments.length}
                </span>
              ) : undefined
            }
          >
            {isCreate ? (
              <p className="text-sm text-gray-500 text-center py-4">Giao việc xong mới chat được.</p>
            ) : (
              <div className="flex flex-col min-h-[220px] max-h-[min(480px,calc(100vh-9rem))]">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar name={comment.userName} src={comment.userAvatar} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 p-2.5 rounded-2xl rounded-tl-none border border-gray-100">
                          <div className="flex items-center justify-between mb-0.5 gap-2">
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {comment.userName}
                            </span>
                            <span className="text-[11px] text-gray-500 shrink-0">
                              {new Date(comment.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-center py-3 text-sm text-gray-500">Chưa có tin nhắn.</p>
                  )}
                </div>
                <form
                  onSubmit={handleAddComment}
                  className="mt-3 pt-3 border-t border-gray-100 relative shrink-0"
                >
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Viết tin..."
                    className="w-full pr-11 pl-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-primary-600 hover:bg-primary-50 rounded-lg disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}
          </ExpandableSection>
        </div>
      </div>

      {/* Modals — status / extension only (tiến độ trên màn Sửa) */}
      {task && (
        <>
          <Modal
            isOpen={isStatusModalOpen}
            onClose={() => setIsStatusModalOpen(false)}
            title="Thay đổi trạng thái"
          >
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <FormField label="Chuyển sang trạng thái" required>
                <select
                  value={statusData.status}
                  onChange={(e) => setStatusData({ status: e.target.value as TaskStatus })}
                  className={selectClass}
                >
                  {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {TASK_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </FormField>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </Modal>

          <Modal
            isOpen={isExtModalOpen}
            onClose={() => setIsExtModalOpen(false)}
            title="Yêu cầu gia hạn"
            size="sm"
          >
            <form onSubmit={handleExtension} className="space-y-4">
              <p className="text-sm text-gray-500">
                Hạn hiện tại:{' '}
                <strong>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '—'}
                </strong>
              </p>
              <FormField label="Xin gia hạn đến" required>
                <input
                  type="date"
                  value={extData.requestedDueDate}
                  onChange={(e) => setExtData({ ...extData, requestedDueDate: e.target.value })}
                  className={inputClass}
                  required
                  min={task.dueDate}
                />
              </FormField>
              <FormField label="Lý do" required>
                <textarea
                  value={extData.reason}
                  onChange={(e) => setExtData({ ...extData, reason: e.target.value })}
                  className={textareaClass}
                  rows={3}
                  required
                  placeholder="Vì sao cần thêm thời gian?"
                />
              </FormField>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExtModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg"
                >
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
}
