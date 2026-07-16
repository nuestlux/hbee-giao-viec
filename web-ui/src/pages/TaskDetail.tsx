import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Calendar,
  CheckCircle2,
  MessageSquare,
  Send,
  AlertCircle,
  Building2,
  UserCircle2,
  FileText,
  CalendarClock,
  Check,
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
} from '../components';
import type { TaskStatus } from '../types';
import { hasPermission } from '../utils/permissions';
import { EXTENSION_STATUS_LABELS, TASK_STATUS_LABELS } from '../utils/ui-labels';
import {
  PROGRESS_LEVELS,
  getProgressLevelLabel,
  snapProgressToLevel,
  type ProgressLevelValue,
} from '../utils/progress-levels';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    tasks,
    progressUpdates,
    taskComments,
    extensionRequests,
    currentUser,
    roles,
    changeTaskStatus,
    addProgressUpdate,
    addComment,
    addExtensionRequest,
    approveExtension,
    rejectExtension,
  } = useStore();

  const task = tasks.find((t) => t.id === id);
  const updates = progressUpdates
    .filter((p) => p.taskId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const comments = taskComments
    .filter((c) => c.taskId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const extensions = extensionRequests
    .filter((e) => e.taskId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const canUpdateProgress =
    hasPermission(currentUser, roles, 'task.update') ||
    task?.assigneeId === currentUser?.id ||
    task?.assignerId === currentUser?.id;
  const canChangeStatus =
    canUpdateProgress ||
    hasPermission(currentUser, roles, 'task.accept') ||
    hasPermission(currentUser, roles, 'task.approve') ||
    hasPermission(currentUser, roles, 'task.assign');
  const canRequestExt =
    hasPermission(currentUser, roles, 'extension.request') ||
    task?.assigneeId === currentUser?.id;
  const canApproveExt = hasPermission(currentUser, roles, 'extension.approve');

  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isExtModalOpen, setIsExtModalOpen] = useState(false);
  const [progressData, setProgressData] = useState({
    progress: task?.progress || 0,
    content: '',
    difficulties: '',
    suggestions: '',
  });
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

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle size={48} className="text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy nhiệm vụ</h2>
        <button onClick={() => navigate('/tasks')} className="text-primary-600 hover:underline">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const handleUpdateProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdateProgress) {
      showToast('Không có quyền sửa tiến độ');
      return;
    }
    addProgressUpdate({
      taskId: task.id,
      progress: progressData.progress,
      content: progressData.content,
      difficulties: progressData.difficulties || undefined,
      suggestions: progressData.suggestions || undefined,
    });
    setIsProgressModalOpen(false);
    setProgressData({
      progress: progressData.progress,
      content: '',
      difficulties: '',
      suggestions: '',
    });
    showToast('Đã lưu tiến độ');
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
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
    if (!commentText.trim()) return;
    addComment({ taskId: task.id, content: commentText.trim() });
    setCommentText('');
  };

  const handleExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRequestExt) {
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-[210] bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check size={16} />
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors shrink-0 self-start"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug flex flex-wrap items-center gap-3">
            {task.title}
            <StatusBadge status={task.status} />
            <UrgencyBadge urgency={task.urgency} />
          </h1>
          <div className="text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1">
              <FileText size={14} /> {task.categoryName || '—'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} /> Hạn:{' '}
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '—'}
            </span>
            <span className="text-xs">Giao bởi: {task.assignerName || '—'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-xl p-6 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-primary-600" />
              Nội dung nhiệm vụ
            </h3>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {task.description || 'Không có mô tả chi tiết.'}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-6">
              <div>
                <span className="text-sm text-gray-500 block mb-1">Giao cho phòng ban</span>
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  <Building2 size={16} className="text-gray-400" />
                  {task.assignedDepartmentName || '—'}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500 block mb-1">Người thực hiện</span>
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  <UserCircle2 size={16} className="text-gray-400" />
                  {task.assigneeName || 'Chưa phân công'}
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={18} className="text-blue-600" />
                Tiến độ thực hiện
              </h3>
              <div className="flex flex-wrap gap-2">
                {canChangeStatus && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusData({ status: task.status });
                      setIsStatusModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Đổi trạng thái
                  </button>
                )}
                {canRequestExt && (
                  <button
                    type="button"
                    onClick={() => setIsExtModalOpen(true)}
                    className="px-3 py-1.5 text-sm font-medium bg-amber-50 text-amber-800 rounded-lg hover:bg-amber-100 inline-flex items-center gap-1"
                  >
                    <CalendarClock size={14} />
                    Gia hạn
                  </button>
                )}
                {canUpdateProgress && (
                  <button
                    type="button"
                    onClick={() => {
                      setProgressData((p) => ({
                        ...p,
                        progress: snapProgressToLevel(task.progress),
                      }));
                      setIsProgressModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Cập nhật tiến độ
                  </button>
                )}
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between text-sm mb-2 gap-2">
                <span className="font-medium text-gray-700">Tiến độ</span>
                <span className="font-bold text-primary-600">
                  {getProgressLevelLabel(task.progress)}
                </span>
              </div>
              <ProgressBar value={task.progress} size="lg" labelMode="level" />
            </div>

            <div className="space-y-4">
              {updates.map((update) => (
                <div
                  key={update.id}
                  className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={update.userName} src={update.userAvatar} size="sm" />
                      <span className="font-medium text-sm text-gray-900">{update.userName}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(update.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md mb-2">
                    Tiến độ: {getProgressLevelLabel(update.previousProgress)} →{' '}
                    {getProgressLevelLabel(update.progress)}
                  </span>
                  <p className="text-sm text-gray-700">{update.content}</p>
                  {update.difficulties && (
                    <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded-lg">
                      <strong>Khó khăn:</strong> {update.difficulties}
                    </p>
                  )}
                  {update.suggestions && (
                    <p className="text-sm text-emerald-700 mt-2 bg-emerald-50 p-2 rounded-lg">
                      <strong>Đề xuất:</strong> {update.suggestions}
                    </p>
                  )}
                </div>
              ))}
              {updates.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                  Chưa có cập nhật tiến độ nào.
                </div>
              )}
            </div>
          </div>

          {/* Extensions */}
          {extensions.length > 0 && (
            <div className="glass rounded-xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarClock size={18} className="text-amber-600" />
                Yêu cầu gia hạn
              </h3>
              <div className="space-y-3">
                {extensions.map((ext) => (
                  <div
                    key={ext.id}
                    className="p-4 rounded-xl border border-gray-100 bg-white text-sm space-y-2"
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
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass rounded-xl p-6 border border-gray-100 h-[600px] flex flex-col">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-primary-600" />
              Trao đổi & Bình luận
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar name={comment.userName} src={comment.userAvatar} size="sm" />
                  <div className="flex-1">
                    <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none border border-gray-100">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {comment.userName}
                        </span>
                        <span className="text-xs text-gray-500 shrink-0">
                          {new Date(comment.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">Chưa có bình luận nào.</div>
              )}
            </div>

            <form onSubmit={handleAddComment} className="mt-4 pt-4 border-t border-gray-100 relative">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Nhập nội dung trao đổi..."
                className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-600 hover:bg-primary-50 rounded-lg disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        title="Cập nhật tiến độ"
      >
        <form onSubmit={handleUpdateProgress} className="space-y-4">
          <FormField label="Tiến độ" required>
            <select
              value={snapProgressToLevel(progressData.progress)}
              onChange={(e) =>
                setProgressData({
                  ...progressData,
                  progress: Number(e.target.value) as ProgressLevelValue,
                })
              }
              className={selectClass}
              required
            >
              {PROGRESS_LEVELS.map((lv) => (
                <option key={lv.value} value={lv.value}>
                  {lv.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Đã làm gì" required>
            <textarea
              value={progressData.content}
              onChange={(e) => setProgressData({ ...progressData, content: e.target.value })}
              className={textareaClass}
              rows={3}
              required
              placeholder="Tóm tắt việc đã làm..."
            />
          </FormField>
          <FormField label="Khó khăn">
            <textarea
              value={progressData.difficulties}
              onChange={(e) => setProgressData({ ...progressData, difficulties: e.target.value })}
              className={textareaClass}
              rows={2}
              placeholder="Nếu có"
            />
          </FormField>
          <FormField label="Đề xuất">
            <textarea
              value={progressData.suggestions}
              onChange={(e) => setProgressData({ ...progressData, suggestions: e.target.value })}
              className={textareaClass}
              rows={2}
              placeholder="Nếu có"
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsProgressModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg"
            >
              Cập nhật
            </button>
          </div>
        </form>
      </Modal>

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
    </div>
  );
}
