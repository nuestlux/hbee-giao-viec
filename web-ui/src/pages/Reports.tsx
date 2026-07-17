import { useMemo, useState } from 'react';
import { Download, Printer, FileSpreadsheet } from 'lucide-react';
import { useStore } from '../store/useStore';
import { organization } from '../data/mockData';
import { DataTable, Pagination, filterSelectClass } from '../components';
import type { Column } from '../components';
import { buildUnitInProgressReport } from '../utils/report-unit-in-progress';
import { downloadUnitInProgressXlsx } from '../utils/export-unit-in-progress-xlsx';
import { useClientPagination } from '../hooks/use-client-pagination';
import { PROGRESS_LEVEL_LABELS } from '../utils/report-progress-level';

/**
 * Chỉ các loại báo cáo đã có engine.
 * Filter phụ thuộc loại — NV đang TH đơn vị: ngày chốt + đơn vị chủ trì + mức độ.
 */
type ReportType = 'unit_in_progress';

type LevelFilter = 'all' | 'Đúng tiến độ' | 'Sắp đến hạn' | 'Quá hạn';

type ReportTableRow = {
  id: string;
  stt: number;
  title: string;
  dept: string;
  status: string;
  level: string;
  due: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Reports() {
  const tasks = useStore((s) => s.tasks);
  const departments = useStore((s) => s.departments);
  const documents = useStore((s) => s.incomingDocuments);
  const progressUpdates = useStore((s) => s.progressUpdates);
  const extensions = useStore((s) => s.extensionRequests);

  const [reportType, setReportType] = useState<ReportType>('unit_in_progress');
  /** Ngày chốt — bắt buộc cho công thức mức độ (đúng tiến độ / sắp / quá hạn) */
  const [asOf, setAsOf] = useState(todayIso);
  /** Lọc theo đơn vị chủ trì (cột 3 báo cáo khách) */
  const [departmentId, setDepartmentId] = useState('all');
  /** Lọc theo mức độ hoàn thành đã tính tại ngày chốt */
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const unitRowsAll = useMemo(() => {
    if (reportType !== 'unit_in_progress') return [];
    return buildUnitInProgressReport({
      tasks,
      departments,
      documents,
      progressUpdates,
      extensions,
      asOf,
      departmentId,
    });
  }, [
    reportType,
    tasks,
    departments,
    documents,
    progressUpdates,
    extensions,
    asOf,
    departmentId,
  ]);

  /** Sau khi build theo đơn vị + asOf, lọc mức độ (client) */
  const unitRows = useMemo(() => {
    if (levelFilter === 'all') return unitRowsAll;
    return unitRowsAll.filter((r) => r.cells[12] === levelFilter);
  }, [unitRowsAll, levelFilter]);

  const tableData = useMemo<ReportTableRow[]>(
    () =>
      unitRows.map((r, idx) => ({
        id: r.taskId,
        stt: idx + 1,
        title: r.cells[1],
        dept: r.cells[3],
        status: r.cells[10],
        level: r.cells[12],
        due: r.cells[7],
      })),
    [unitRows],
  );

  const pageResetKey = `${reportType}|${asOf}|${departmentId}|${levelFilter}|${tableData.length}`;
  const { page, setPage, pageSize, total, totalPages, pageItems } = useClientPagination(
    tableData,
    10,
    pageResetKey,
  );

  const handleExport = () => {
    if (unitRows.length === 0) {
      showToast('Không có nhiệm vụ khớp bộ lọc');
      return;
    }
    const deptLabel =
      departmentId === 'all'
        ? 'Tất cả đơn vị'
        : departments.find((d) => d.id === departmentId)?.name || '';
    void (async () => {
      // Xuất đúng tập đang lọc (đơn vị + mức độ + ngày chốt)
      const exportRows = unitRows.map((r, idx) => ({
        ...r,
        stt: idx + 1,
        cells: [String(idx + 1), ...r.cells.slice(1)],
      }));
      const result = await downloadUnitInProgressXlsx(exportRows, {
        organizationName: organization.name,
        asOf,
        departmentLabel: deptLabel,
      });
      showToast(
        result.savedToPickedFolder
          ? `Đã lưu ${exportRows.length} dòng vào thư mục đã chọn · ${result.filename}`
          : `Đã tải ${exportRows.length} dòng · ${result.filename}`,
      );
    })();
  };

  const tableColumns: Column<ReportTableRow>[] = [
    { key: 'stt', title: 'STT', width: '4rem', render: (r) => r.stt },
    { key: 'title', title: 'Tên nhiệm vụ', render: (r) => r.title },
    { key: 'dept', title: 'Đơn vị chủ trì', render: (r) => r.dept },
    { key: 'due', title: 'Hạn hoàn thành', render: (r) => r.due },
    { key: 'status', title: 'Trạng thái', render: (r) => r.status },
    { key: 'level', title: 'Mức độ', render: (r) => r.level },
  ];

  const kpiAll = unitRowsAll.length;
  const kpiOnTrack = unitRowsAll.filter((r) => r.cells[12] === 'Đúng tiến độ').length;
  const kpiNear = unitRowsAll.filter((r) => r.cells[12] === 'Sắp đến hạn').length;
  const kpiOver = unitRowsAll.filter((r) => r.cells[12] === 'Quá hạn').length;

  return (
    <div className="space-y-6 animate-fade-in relative">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl text-sm">
          {toast}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">Báo cáo</h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Printer size={18} /> In
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Download size={18} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Filter theo loại báo cáo — NV đang TH đơn vị */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại báo cáo</label>
          <select
            className={`${filterSelectClass} w-full min-w-0`}
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
          >
            <option value="unit_in_progress">Nhiệm vụ đang thực hiện theo đơn vị</option>
          </select>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Ngày chốt dữ liệu
          </label>
          <input
            type="date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            className={`${filterSelectClass} w-full min-w-0`}
          />
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Đơn vị chủ trì
          </label>
          <select
            className={`${filterSelectClass} w-full min-w-0`}
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <option value="all">Tất cả đơn vị</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Mức độ (tại ngày chốt)
          </label>
          <select
            className={`${filterSelectClass} w-full min-w-0`}
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
          >
            <option value="all">Tất cả mức độ</option>
            <option value={PROGRESS_LEVEL_LABELS.ON_TRACK}>
              {PROGRESS_LEVEL_LABELS.ON_TRACK}
            </option>
            <option value={PROGRESS_LEVEL_LABELS.NEAR_DEADLINE}>
              {PROGRESS_LEVEL_LABELS.NEAR_DEADLINE}
            </option>
            <option value={PROGRESS_LEVEL_LABELS.OVERDUE}>
              {PROGRESS_LEVEL_LABELS.OVERDUE}
            </option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors min-h-9"
        >
          <FileSpreadsheet size={18} /> Xuất Excel
        </button>
      </div>

      <p className="text-xs text-slate-500 -mt-3">
        Báo cáo chỉ gồm việc đang xử lý (đã giao / đang làm / chờ duyệt…). Ngày chốt dùng để tính
        đúng tiến độ · sắp đến hạn · quá hạn. Xuất Excel theo đúng bộ lọc hiện tại (25 cột mẫu đơn
        vị).
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Tổng đang TH</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{kpiAll}</p>
        </div>
        <button
          type="button"
          onClick={() =>
            setLevelFilter(levelFilter === 'Đúng tiến độ' ? 'all' : 'Đúng tiến độ')
          }
          className={`text-left bg-white rounded-xl border p-4 shadow-sm transition-colors ${
            levelFilter === 'Đúng tiến độ'
              ? 'border-emerald-400 ring-1 ring-emerald-200'
              : 'border-slate-200 hover:border-emerald-200'
          }`}
        >
          <p className="text-sm text-slate-500">Đúng tiến độ</p>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums mt-1">{kpiOnTrack}</p>
        </button>
        <button
          type="button"
          onClick={() =>
            setLevelFilter(levelFilter === 'Sắp đến hạn' ? 'all' : 'Sắp đến hạn')
          }
          className={`text-left bg-white rounded-xl border p-4 shadow-sm transition-colors ${
            levelFilter === 'Sắp đến hạn'
              ? 'border-amber-400 ring-1 ring-amber-200'
              : 'border-slate-200 hover:border-amber-200'
          }`}
        >
          <p className="text-sm text-slate-500">Sắp đến hạn</p>
          <p className="text-2xl font-bold text-amber-600 tabular-nums mt-1">{kpiNear}</p>
        </button>
        <button
          type="button"
          onClick={() => setLevelFilter(levelFilter === 'Quá hạn' ? 'all' : 'Quá hạn')}
          className={`text-left bg-white rounded-xl border p-4 shadow-sm transition-colors ${
            levelFilter === 'Quá hạn'
              ? 'border-red-400 ring-1 ring-red-200'
              : 'border-slate-200 hover:border-red-200'
          }`}
        >
          <p className="text-sm text-slate-500">Quá hạn</p>
          <p className="text-2xl font-bold text-red-600 tabular-nums mt-1">{kpiOver}</p>
        </button>
      </div>

      <div>
        <DataTable
          columns={tableColumns}
          data={pageItems}
          emptyMessage="Không có nhiệm vụ khớp bộ lọc"
          size="middle"
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          total={total}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
