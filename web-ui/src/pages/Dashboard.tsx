import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckSquare,
  Activity,
  Clock,
  PieChart as PieChartIcon,
  Users,
  Building2,
  Briefcase,
  TrendingUp,
  CalendarRange,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { Avatar, ProgressBar, StatusBadge } from '../components';
import { useStore } from '../store/useStore';
import {
  deriveDashboardStats,
  deriveUserRoleChart,
  deriveUserActiveStatusChart,
  deriveDeptWorkChart,
  deriveTaskTrend,
  pickNearDeadlineTasks,
  pickRecentActivities,
  auditActionLabel,
  auditEntityLabel,
  type ActivityScope,
} from '../utils/dashboard-stats';
import { hasPermission } from '../utils/permissions';
import {
  TIME_PRESET_OPTIONS,
  defaultCustomFromTo,
  formatTimeRangeLabel,
  isInTimeRange,
  resolveTimeRange,
  taskInTimeRange,
  type TimePreset,
} from '../utils/dashboard-time-range';

/** Số tháng biểu đồ xu hướng theo preset (giống analytics: zoom theo kỳ). */
function trendMonthCount(preset: TimePreset, rangeStart: Date | null, rangeEnd: Date | null): number {
  if (preset === 'year') return 12;
  if (preset === 'all') return 6;
  if (preset === 'quarter') return 3;
  if (preset === 'today' || preset === '7d') return 3;
  if (rangeStart && rangeEnd) {
    const months =
      (rangeEnd.getFullYear() - rangeStart.getFullYear()) * 12 +
      (rangeEnd.getMonth() - rangeStart.getMonth()) +
      1;
    return Math.max(3, Math.min(12, months));
  }
  return 6;
}

type FeatureCard = {
  id: string;
  title: string;
  value: number;
  subtitle: string;
  icon: typeof FileText;
  color: string;
  bg: string;
  link: string;
};

const chartTooltipStyle = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  fontSize: '13px',
  lineHeight: '1.45',
  fontFamily: 'Be Vietnam Pro, system-ui, sans-serif',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const roles = useStore((s) => s.roles);
  const departments = useStore((s) => s.departments);
  const tasks = useStore((s) => s.tasks);
  const documents = useStore((s) => s.incomingDocuments);
  const extensions = useStore((s) => s.extensionRequests);
  const notifications = useStore((s) => s.notifications);
  const auditLogs = useStore((s) => s.auditLogs);

  /** Mặc định 30 ngày — pattern phổ biến GA / Jira / Monday. */
  const [timePreset, setTimePreset] = useState<TimePreset>('30d');
  const defaults = useMemo(() => defaultCustomFromTo(), []);
  const [customFrom, setCustomFrom] = useState(defaults.from);
  const [customTo, setCustomTo] = useState(defaults.to);

  const timeRange = useMemo(
    () => resolveTimeRange(timePreset, customFrom, customTo),
    [timePreset, customFrom, customTo],
  );
  const timeRangeLabel = useMemo(() => formatTimeRangeLabel(timeRange), [timeRange]);

  /** Dữ liệu nghiệp vụ lọc theo kỳ; user/phòng ban giữ snapshot hiện tại. */
  const filteredTasks = useMemo(
    () => tasks.filter((t) => taskInTimeRange(t, timeRange)),
    [tasks, timeRange],
  );
  const filteredDocuments = useMemo(
    () =>
      documents.filter(
        (d) => isInTimeRange(d.receivedDate || d.createdAt, timeRange),
      ),
    [documents, timeRange],
  );
  const filteredExtensions = useMemo(
    () => extensions.filter((e) => isInTimeRange(e.createdAt, timeRange)),
    [extensions, timeRange],
  );
  const filteredNotifications = useMemo(
    () => notifications.filter((n) => isInTimeRange(n.createdAt, timeRange)),
    [notifications, timeRange],
  );
  const filteredAuditLogs = useMemo(
    () => auditLogs.filter((l) => isInTimeRange(l.createdAt, timeRange)),
    [auditLogs, timeRange],
  );

  const today = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const stats = useMemo(
    () =>
      deriveDashboardStats({
        documents: filteredDocuments,
        tasks: filteredTasks,
        extensions: filteredExtensions,
        notifications: filteredNotifications,
        users,
        departments,
      }),
    [filteredDocuments, filteredTasks, filteredExtensions, filteredNotifications, users, departments]
  );

  const isLeader =
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'CHAIRMAN' ||
    currentUser?.role === 'VICE_CHAIRMAN';

  const isDeptLead =
    currentUser?.role === 'DEPT_HEAD' || currentUser?.role === 'DEPT_DEPUTY';

  /** Card + chart người dùng: user.manage hoặc lãnh đạo/admin. */
  const canSeeUsersAnalytics =
    hasPermission(currentUser, roles, 'user.manage') || isLeader;

  /** Card phòng ban: department.manage hoặc lãnh đạo. */
  const canSeeDepartmentsCard =
    hasPermission(currentUser, roles, 'department.manage') || isLeader;

  /**
   * Biểu đồ công việc phòng:
   * - Lãnh đạo / task.view_all: toàn đơn vị
   * - Trưởng/phó phòng: chỉ phòng mình
   * - Chuyên viên / văn thư: chỉ phòng mình (phạm vi hẹp)
   */
  const canSeeDeptWorkChart = Boolean(currentUser);
  const deptWorkScopeAll =
    hasPermission(currentUser, roles, 'task.view_all') || isLeader;
  const deptScopeId = deptWorkScopeAll ? null : currentUser?.departmentId || null;

  /** Xu hướng NV: ai có report.view hoặc xem NV (mặc định hầu hết role). */
  const canSeeTaskTrend =
    hasPermission(currentUser, roles, 'report.view') ||
    hasPermission(currentUser, roles, 'task.view_all') ||
    hasPermission(currentUser, roles, 'task.update') ||
    isLeader ||
    isDeptLead;

  const nearDeadlineTasks = useMemo(
    () => pickNearDeadlineTasks(filteredTasks, 5),
    [filteredTasks],
  );

  /**
   * Phạm vi hoạt động gần đây — cùng logic card/chart dashboard:
   * all = lãnh đạo / audit.view / task.view_all
   * department = trưởng-phó phòng (hoặc user có phòng, không full view)
   * self = còn lại
   */
  const activityScope: ActivityScope = useMemo(() => {
    if (
      isLeader ||
      hasPermission(currentUser, roles, 'audit.view') ||
      hasPermission(currentUser, roles, 'task.view_all')
    ) {
      return 'all';
    }
    if (isDeptLead || currentUser?.departmentId) {
      return isDeptLead ? 'department' : 'self';
    }
    return 'self';
  }, [isLeader, isDeptLead, currentUser, roles]);

  const canSeeSensitiveActivity =
    hasPermission(currentUser, roles, 'audit.view') || isLeader;

  const recentLogs = useMemo(
    () =>
      pickRecentActivities(
        filteredAuditLogs,
        users,
        {
          currentUserId: currentUser?.id ?? null,
          departmentId: currentUser?.departmentId ?? null,
          scope: activityScope,
          includeUserAdmin: canSeeUsersAnalytics,
          includeSensitive: canSeeSensitiveActivity,
        },
        5,
      ),
    [
      filteredAuditLogs,
      users,
      currentUser?.id,
      currentUser?.departmentId,
      activityScope,
      canSeeUsersAnalytics,
      canSeeSensitiveActivity,
    ]
  );

  const activityScopeHint =
    activityScope === 'all'
      ? 'Toàn đơn vị'
      : activityScope === 'department'
        ? 'Theo phòng ban'
        : 'Của bạn';

  const userActiveChart = useMemo(
    () => (canSeeUsersAnalytics ? deriveUserActiveStatusChart(users) : []),
    [canSeeUsersAnalytics, users]
  );

  const userRoleChart = useMemo(
    () => (canSeeUsersAnalytics ? deriveUserRoleChart(users) : []),
    [canSeeUsersAnalytics, users]
  );

  const deptWorkData = useMemo(
    () =>
      canSeeDeptWorkChart
        ? deriveDeptWorkChart(
            filteredTasks,
            departments,
            deptScopeId,
            deptWorkScopeAll ? 8 : 1,
          )
        : [],
    [canSeeDeptWorkChart, filteredTasks, departments, deptScopeId, deptWorkScopeAll]
  );

  const taskTrendData = useMemo(() => {
    if (!canSeeTaskTrend) return [];
    const months = trendMonthCount(timePreset, timeRange.start, timeRange.end);
    return deriveTaskTrend(filteredTasks, months, timeRange.end);
  }, [canSeeTaskTrend, filteredTasks, timePreset, timeRange.start, timeRange.end]);

  const featureCards = useMemo(() => {
    const cards: FeatureCard[] = [
      {
        id: 'docs',
        title: 'Văn bản đến',
        value: stats.docsTotal,
        subtitle: `${stats.docsUnassigned} chưa gắn nhiệm vụ`,
        icon: FileText,
        color: 'text-sky-600',
        bg: 'bg-sky-50',
        link: '/documents',
      },
      {
        id: 'tasks',
        title: 'Nhiệm vụ',
        value: stats.tasksOpen,
        subtitle: `${stats.tasksInProgress} đang làm · ${stats.tasksWaitingApproval} chờ duyệt`,
        icon: CheckSquare,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        link: '/tasks',
      },
    ];

    if (canSeeUsersAnalytics) {
      const locked = stats.usersTotal - stats.usersActive;
      cards.push({
        id: 'users',
        title: 'Người dùng',
        value: stats.usersTotal,
        subtitle: `${stats.usersActive} hoạt động · ${locked} đã khóa`,
        icon: Users,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        link: '/system/users',
      });
    }

    if (canSeeDepartmentsCard) {
      cards.push({
        id: 'departments',
        title: 'Phòng ban',
        value: stats.departmentsTotal,
        subtitle: `${stats.departmentsActive} đang hoạt động`,
        icon: Building2,
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
        link: '/system/departments',
      });
    }

    return cards;
  }, [stats, canSeeUsersAnalytics, canSeeDepartmentsCard]);

  const chartCount =
    (canSeeUsersAnalytics ? 1 : 0) +
    (canSeeDeptWorkChart ? 1 : 0) +
    (canSeeTaskTrend ? 1 : 0);

  const chartGridClass =
    chartCount >= 3
      ? 'grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6'
      : chartCount === 2
        ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6'
        : 'grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6';

  const trendMonthsLabel = trendMonthCount(timePreset, timeRange.start, timeRange.end);

  return (
    <div className="space-y-6 sm:space-y-7 lg:space-y-8">
      {/* Welcome + time range filter (GA / Jira style) */}
      <div className="glass p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-gray-100 bg-gradient-to-r from-white to-primary-50/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight leading-snug">
              Xin chào,{' '}
              <span className="bg-gradient-to-r from-primary-600 to-indigo-600 text-transparent bg-clip-text">
                {currentUser?.fullName || 'bạn'}
              </span>
            </h2>
            <p className="text-slate-500 mt-2 capitalize font-medium text-[0.9375rem] sm:text-base leading-relaxed">
              {today}
            </p>
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
              <label className="relative inline-flex items-center gap-1.5">
                <CalendarRange size={15} className="text-primary-600 shrink-0" aria-hidden />
                <span className="sr-only">Kỳ dữ liệu</span>
                <select
                  value={timePreset}
                  onChange={(e) => setTimePreset(e.target.value as TimePreset)}
                  className="appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-8 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-w-[8.5rem]"
                  aria-label="Kỳ dữ liệu"
                >
                  {TIME_PRESET_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                  ▾
                </span>
              </label>

              {timePreset === 'custom' && (
                <>
                  <input
                    type="date"
                    value={customFrom}
                    max={customTo}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    aria-label="Từ ngày"
                    className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  />
                  <span className="text-slate-400 text-xs">–</span>
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom}
                    onChange={(e) => setCustomTo(e.target.value)}
                    aria-label="Đến ngày"
                    className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  />
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium self-start sm:self-end">
              {timeRangeLabel}
            </p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div
        className={`grid gap-4 sm:gap-5 ${
          featureCards.length <= 2
            ? 'grid-cols-2'
            : featureCards.length === 3
              ? 'grid-cols-2 sm:grid-cols-3'
              : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {featureCards.map((card, idx) => (
          <button
            key={card.id}
            type="button"
            onClick={() => navigate(card.link)}
            className="text-left glass p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-250 cursor-pointer hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/35"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full ${card.bg} ${card.color} flex items-center justify-center mb-3 sm:mb-3.5 ring-1 ring-black/5`}
            >
              <card.icon size={20} strokeWidth={1.75} />
            </div>
            <p className="text-slate-500 text-[0.8125rem] font-semibold tracking-wide mb-1.5 leading-snug">
              {card.title}
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 tabular-nums tracking-tight leading-none">
              {card.value}
            </h3>
            <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
              {card.subtitle}
            </p>
          </button>
        ))}
      </div>

      {/* Charts row — theo quyền */}
      {chartCount > 0 && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-600 tracking-wide px-0.5">
            Biểu đồ
          </h3>
          <div className={chartGridClass}>
            {/* 1. Người dùng theo vai trò */}
            {canSeeUsersAnalytics && (
              <div className="glass p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[280px]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Users className="text-violet-500 shrink-0" size={18} />
                    Người dùng (active / khóa)
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate('/system/users')}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 shrink-0"
                  >
                    Quản lý
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  Live theo `isActive` · {stats.usersActive} hoạt động · {stats.usersTotal - stats.usersActive} đã khóa
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-h-[200px]">
                  <div className="min-h-[180px]">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase text-center mb-1">Trạng thái</p>
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Pie
                          data={userActiveChart}
                          cx="50%"
                          cy="50%"
                          innerRadius={36}
                          outerRadius={58}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {userActiveChart.map((entry, index) => (
                            <Cell key={`ua-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="min-h-[180px]">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase text-center mb-1">Vai trò (chỉ active)</p>
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Pie
                          data={userRoleChart}
                          cx="50%"
                          cy="50%"
                          innerRadius={36}
                          outerRadius={58}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {userRoleChart.map((entry, index) => (
                            <Cell key={`ur-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Công việc phòng */}
            {canSeeDeptWorkChart && (
              <div className="glass p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[280px]">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Briefcase className="text-cyan-600 shrink-0" size={18} />
                    {deptWorkScopeAll ? 'Công việc theo phòng ban' : 'Công việc phòng tôi'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate('/department-work')}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 shrink-0"
                  >
                    Chi tiết
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  {deptWorkScopeAll
                    ? 'Toàn đơn vị — mở / hoàn thành / quá hạn'
                    : 'Phạm vi phòng của bạn — mở / hoàn thành / quá hạn'}
                </p>
                <div className="flex-1 min-h-[200px]">
                  {deptWorkData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400">
                      Chưa có dữ liệu phòng
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={deptWorkData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          allowDecimals={false}
                        />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="open" name="Đang mở" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={28} />
                        <Bar dataKey="completed" name="Hoàn thành" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={28} />
                        <Bar dataKey="overdue" name="Quá hạn" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* 3. Xu hướng nhiệm vụ */}
            {canSeeTaskTrend && (
              <div className="glass p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[280px]">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="text-indigo-500 shrink-0" size={18} />
                    Xu hướng nhiệm vụ
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate('/reports')}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 shrink-0"
                  >
                    Báo cáo
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  {trendMonthsLabel} tháng gần nhất trong kỳ — tạo mới / hoàn thành / quá hạn
                </p>
                <div className="flex-1 min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={taskTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        allowDecimals={false}
                      />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line
                        type="monotone"
                        dataKey="created"
                        name="Tạo mới"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        name="Hoàn thành"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="overdue"
                        name="Quá hạn"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Status pie (tất cả) + near deadline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        <div className="glass p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <PieChartIcon className="text-primary-500" size={20} /> Phân bổ nhiệm vụ
          </h3>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pie}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stats.pie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ fontWeight: 'bold' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4 gap-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
              <Clock className="text-orange-500" size={20} /> Nhiệm vụ sắp đến hạn
            </h3>
            <button
              type="button"
              onClick={() => navigate('/tasks?tab=near-deadline')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium shrink-0"
            >
              Xem tất cả
            </button>
          </div>
          <div className="overflow-x-auto flex-1 -mx-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 text-gray-500">
                <tr>
                  <th className="px-3 sm:px-4 py-3 font-semibold rounded-l-lg">Tiêu đề</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Đầu mối</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Hạn xử lý</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Tiến độ</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold rounded-r-lg">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {nearDeadlineTasks.map((task) => {
                  const assignee = users.find((u) => u.id === task.assigneeId);
                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <td className="px-3 sm:px-4 py-3 font-medium text-gray-800 truncate max-w-[12rem] sm:max-w-xs">
                        {task.title}
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        {assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar user={assignee} size="sm" />
                            <span className="text-gray-600 text-xs">{assignee.fullName}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-orange-600 font-medium text-xs">
                        {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-3 sm:px-4 py-3 min-w-[6rem]">
                        <ProgressBar value={task.progress} />
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <StatusBadge status={task.status as never} />
                      </td>
                    </tr>
                  );
                })}
                {nearDeadlineTasks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      Không có nhiệm vụ sắp đến hạn.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hoạt động gần đây — table list, 5 dòng, RBAC dashboard */}
      <div className="glass p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-emerald-500" size={20} />
            Hoạt động gần đây
          </h3>
          <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
            {activityScopeHint} · {timeRangeLabel} · 5 mới nhất
          </span>
        </div>

        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-500">
              <tr>
                <th className="px-3 sm:px-4 py-3 font-semibold rounded-l-lg whitespace-nowrap">Thời gian</th>
                <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Người thực hiện</th>
                <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Hành động</th>
                <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Đối tượng</th>
                <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Mã</th>
                <th className="px-3 sm:px-4 py-3 font-semibold min-w-[12rem]">Chi tiết</th>
                {canSeeSensitiveActivity && (
                  <th className="px-3 sm:px-4 py-3 font-semibold rounded-r-lg whitespace-nowrap">IP</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentLogs.map((log) => {
                const actor = users.find((u) => u.id === log.userId);
                const dept = actor
                  ? departments.find((d) => d.id === actor.departmentId)
                  : undefined;
                const canOpenTask = log.entityType === 'Task' && Boolean(log.entityId);

                return (
                  <tr
                    key={log.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      canOpenTask ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => {
                      if (canOpenTask) navigate(`/tasks/${log.entityId}`);
                    }}
                  >
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                      <time dateTime={log.createdAt}>
                        {new Date(log.createdAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {actor ? (
                          <Avatar user={actor} size="sm" />
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <Activity size={12} className="text-slate-400" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-xs truncate">
                            {actor?.fullName || log.userName || 'Hệ thống'}
                          </p>
                          {dept && (
                            <p className="text-[11px] text-gray-400 truncate">{dept.name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {auditActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs text-gray-700 font-medium">
                      {auditEntityLabel(log.entityType)}
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <code className="text-[11px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        {log.entityId}
                      </code>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs text-gray-600 max-w-[16rem] sm:max-w-md">
                      <span className="line-clamp-2" title={log.changes}>
                        {log.changes}
                      </span>
                    </td>
                    {canSeeSensitiveActivity && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-[11px] font-mono text-gray-500">
                        {log.ipAddress || '—'}
                      </td>
                    )}
                  </tr>
                );
              })}
              {recentLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={canSeeSensitiveActivity ? 7 : 6}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Không có hoạt động trong phạm vi của bạn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
