import { useMemo, useState } from 'react';
import { Download, Printer, Filter, FileSpreadsheet } from 'lucide-react';
import { useStore } from '../store/useStore';
import { organization } from '../data/mockData';
import { filterSelectClass } from '../components';
import { buildUnitInProgressReport } from '../utils/report-unit-in-progress';
import { downloadUnitInProgressXlsx } from '../utils/export-unit-in-progress-xlsx';
import { DataTable } from '../components';
import type { Column } from '../components';

type ReportType = 'unit_in_progress' | 'progress_general';

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
  const [asOf, setAsOf] = useState(todayIso);
  const [departmentId, setDepartmentId] = useState('all');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const unitRows = useMemo(() => {
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

  const previewData = useMemo(
    () =>
      unitRows.slice(0, 10).map((r) => ({
        id: r.taskId,
        stt: r.stt,
        title: r.cells[1],
        dept: r.cells[3],
        status: r.cells[10],
        level: r.cells[12],
        due: r.cells[7],
      })),
    [unitRows],
  );

  const handleExport = () => {
    if (reportType !== 'unit_in_progress') {
      showToast('Chọn loại “NV đang thực hiện theo đơn vị” để xuất Excel');
      return;
    }
    if (unitRows.length === 0) {
      showToast('Không có nhiệm vụ khớp bộ lọc');
      return;
    }
    const deptLabel =
      departmentId === 'all'
        ? 'Tất cả phòng ban'
        : departments.find((d) => d.id === departmentId)?.name || '';
    void (async () => {
      const result = await downloadUnitInProgressXlsx(unitRows, {
        organizationName: organization.name,
        asOf,
        departmentLabel: deptLabel,
      });
      showToast(
        result.savedToPickedFolder
          ? `Đã lưu ${unitRows.length} dòng vào thư mục đã chọn · ${result.filename}`
          : `Đã tải ${unitRows.length} dòng · ${result.filename} · Cấu hình: ${result.savePath}`,
      );
    })();
  };

  const previewColumns: Column<(typeof previewData)[0]>[] = [
    { key: 'stt', title: 'STT', width: '4rem', render: (r) => r.stt },
    { key: 'title', title: 'Tên nhiệm vụ', render: (r) => r.title },
    { key: 'dept', title: 'Đơn vị chủ trì', render: (r) => r.dept },
    { key: 'due', title: 'Hạn KH', render: (r) => r.due },
    { key: 'status', title: 'Trạng thái', render: (r) => r.status },
    { key: 'level', title: 'Mức độ', render: (r) => r.level },
  ];

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

      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại báo cáo</label>
          <select
            className={`${filterSelectClass} w-full min-w-0`}
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
          >
            <option value="unit_in_progress">NV đang thực hiện theo đơn vị</option>
            <option value="progress_general">Báo cáo tiến độ chung (sắp có)</option>
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày chốt</label>
          <input
            type="date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            className={`${filterSelectClass} w-full min-w-0`}
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phòng ban</label>
          <select
            className={`${filterSelectClass} w-full min-w-0`}
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <option value="all">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors min-h-9"
        >
          <FileSpreadsheet size={18} /> Lập &amp; xuất
        </button>
      </div>

      {reportType === 'unit_in_progress' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-sm text-slate-500">Tổng đang TH</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{unitRows.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-sm text-slate-500">Đúng tiến độ</p>
              <p className="text-2xl font-bold text-emerald-600 tabular-nums mt-1">
                {unitRows.filter((r) => r.cells[12] === 'Đúng tiến độ').length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-sm text-slate-500">Sắp đến hạn</p>
              <p className="text-2xl font-bold text-amber-600 tabular-nums mt-1">
                {unitRows.filter((r) => r.cells[12] === 'Sắp đến hạn').length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-sm text-slate-500">Quá hạn</p>
              <p className="text-2xl font-bold text-red-600 tabular-nums mt-1">
                {unitRows.filter((r) => r.cells[12] === 'Quá hạn').length}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">Xem trước (tối đa 10 dòng)</h2>
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Filter size={14} /> 25 cột khi xuất Excel
              </span>
            </div>
            <DataTable
              columns={previewColumns}
              data={previewData}
              emptyMessage="Không có nhiệm vụ đang thực hiện khớp bộ lọc"
              size="middle"
            />
          </div>
        </>
      )}

      {reportType === 'progress_general' && (
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-6">
          Loại báo cáo này sẽ bổ sung sau. Dùng “NV đang thực hiện theo đơn vị” để xuất file khớp mẫu khách.
        </p>
      )}
    </div>
  );
}
