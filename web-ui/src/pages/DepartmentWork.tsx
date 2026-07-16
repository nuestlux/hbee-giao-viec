import { useMemo, useState } from 'react';
import {
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Avatar, ProgressBar, UrgencyBadge, filterSelectClass } from '../components';
import { buildUnitInProgressReport } from '../utils/report-unit-in-progress';
import { downloadUnitInProgressXlsx } from '../utils/export-unit-in-progress-xlsx';
import { organization } from '../data/mockData';
import { PAGE_COPY } from '../utils/ui-labels';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DepartmentWork() {
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('kanban');
  const currentUser = useStore((s) => s.currentUser);
  const tasks = useStore((s) => s.tasks);
  const users = useStore((s) => s.users);
  const departments = useStore((s) => s.departments);
  const documents = useStore((s) => s.incomingDocuments);
  const progressUpdates = useStore((s) => s.progressUpdates);
  const extensions = useStore((s) => s.extensionRequests);

  const defaultDept = currentUser?.departmentId || 'all';
  const [departmentId, setDepartmentId] = useState(defaultDept);
  const [asOf] = useState(todayIso);
  const [toast, setToast] = useState<string | null>(null);

  const deptTasks = useMemo(() => {
    if (!departmentId || departmentId === 'all') return tasks;
    return tasks.filter((t) => t.assignedDepartmentId === departmentId);
  }, [tasks, departmentId]);

  const columns = [
    {
      id: 'todo',
      title: 'Cần làm',
      status: ['DRAFT', 'ASSIGNED'],
      color: 'border-l-gray-400',
      bg: 'bg-gray-50',
    },
    {
      id: 'in_progress',
      title: 'Đang làm',
      status: ['ACCEPTED', 'IN_PROGRESS'],
      color: 'border-l-indigo-400',
      bg: 'bg-indigo-50/30',
    },
    {
      id: 'waiting',
      title: 'Chờ phê duyệt',
      status: ['WAITING_APPROVAL'],
      color: 'border-l-amber-400',
      bg: 'bg-amber-50/30',
    },
    {
      id: 'completed',
      title: 'Hoàn thành',
      status: ['COMPLETED'],
      color: 'border-l-emerald-400',
      bg: 'bg-emerald-50/30',
    },
  ];

  const handleExport = () => {
    const rows = buildUnitInProgressReport({
      tasks,
      departments,
      documents,
      progressUpdates,
      extensions,
      asOf,
      departmentId: departmentId === 'all' ? null : departmentId,
    });
    if (!rows.length) {
      setToast('Không có NV đang thực hiện để xuất');
      setTimeout(() => setToast(null), 2500);
      return;
    }
    const deptLabel =
      departmentId === 'all'
        ? 'Tất cả phòng ban'
        : departments.find((d) => d.id === departmentId)?.name || '';
    downloadUnitInProgressXlsx(rows, {
      organizationName: organization.name,
      asOf,
      departmentLabel: deptLabel,
    });
    setToast(`Đã xuất ${rows.length} dòng`);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm">
          {toast}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
          {PAGE_COPY.departmentWork.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className={filterSelectClass}
            aria-label="Phòng ban"
          >
            <option value="all">Tất cả phòng</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-medium hover:bg-emerald-100"
          >
            <Download size={16} /> Xuất báo cáo
          </button>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded flex items-center justify-center transition-colors ${
                viewMode === 'list'
                  ? 'bg-white shadow text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Danh sách"
            >
              <List size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded flex items-center justify-center transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white shadow text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Kanban"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded flex items-center justify-center transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white shadow text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Lịch"
            >
              <CalendarIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'kanban' && (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
          {columns.map((col) => {
            const colTasks = deptTasks.filter((t) => col.status.includes(t.status));
            return (
              <div
                key={col.id}
                className={`flex-1 min-w-[300px] flex flex-col rounded-xl border border-gray-200 overflow-hidden ${col.bg}`}
              >
                <div className="p-4 border-b border-gray-200/60 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0">
                  <h3 className="font-bold text-gray-800">{col.title}</h3>
                  <span className="bg-white text-gray-600 text-xs font-bold px-2 py-1 rounded-full border border-gray-200">
                    {colTasks.length}
                  </span>
                </div>

                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  {colTasks.map((task) => {
                    const assignee = users.find((u) => u.id === task.assigneeId);
                    return (
                      <div
                        key={task.id}
                        className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${col.color} border-y border-r border-gray-200 cursor-pointer hover:shadow-md transition-shadow group relative`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <UrgencyBadge urgency={task.urgency} />
                          {task.status === 'COMPLETED' && (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
                          {task.title}
                        </h4>

                        <div className="mb-3">
                          <ProgressBar value={task.progress} className="w-full" size="sm" />
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            Hạn:{' '}
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString('vi-VN')
                              : '—'}
                          </span>
                          {assignee ? (
                            <Avatar name={assignee.fullName} src={assignee.avatar} size="sm" />
                          ) : (
                            <span className="text-gray-400">Chưa giao</span>
                          )}
                        </div>
                        {task.focalPointText && (
                          <p className="mt-2 text-[11px] text-slate-500 line-clamp-1">
                            Đầu mối: {task.focalPointText}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-8">Trống</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Tên nhiệm vụ</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Người làm</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Hạn</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Tiến độ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deptTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{t.title}</td>
                  <td className="px-4 py-3 text-slate-600">{t.assigneeName || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="px-4 py-3 w-40">
                    <ProgressBar value={t.progress} showLabel size="sm" />
                  </td>
                </tr>
              ))}
              {deptTasks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                    Không có nhiệm vụ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'calendar' && (
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
          Lịch công việc sẽ bổ sung sau. Dùng Kanban/List + Xuất báo cáo.
        </p>
      )}
    </div>
  );
}
