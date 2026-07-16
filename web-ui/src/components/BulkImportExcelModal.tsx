/**
 * Modal nhập hàng loạt từ Excel — UX kiểu HR/ERP (mẫu → tải lên → kết quả).
 */
import { useCallback, useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ListChecks,
} from 'lucide-react';
import Modal from './Modal';
import {
  type BulkImportColumn,
  type BulkImportResult,
  type ParsedSheet,
  downloadExcelTemplate,
  parseExcelFile,
  emptyBulkResult,
} from '../utils/excel-bulk-import';

type Phase = 'upload' | 'importing' | 'result';

export type BulkImportExcelModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Tiêu đề modal, vd. "Nhập phòng ban từ Excel" */
  title: string;
  /** Mô tả ngắn phạm vi dữ liệu */
  description?: string;
  columns: BulkImportColumn[];
  templateFilename: string;
  /** Gợi ý thêm (vai trò hợp lệ, mã phòng…) */
  hints?: string[];
  /**
   * Xử lý từng dòng đã parse — trả về kết quả tổng.
   * Caller validate + ghi store.
   */
  onImport: (rows: ParsedSheet[]) => BulkImportResult | Promise<BulkImportResult>;
};

export default function BulkImportExcelModal({
  isOpen,
  onClose,
  title,
  description,
  columns,
  templateFilename,
  hints = [],
  onImport,
}: BulkImportExcelModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const reset = useCallback(() => {
    setPhase('upload');
    setFile(null);
    setDragOver(false);
    setParseError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickFile = (f: File | null | undefined) => {
    setParseError(null);
    if (!f) {
      setFile(null);
      return;
    }
    const name = f.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      setParseError('Chỉ hỗ trợ file .xlsx, .xls hoặc .csv');
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(templateFilename, columns);
  };

  const handleStartImport = async () => {
    if (!file) {
      setParseError('Vui lòng chọn file Excel');
      return;
    }
    setPhase('importing');
    setParseError(null);

    const parsed = await parseExcelFile(file, columns);
    if (parsed.error || !parsed.rows.length) {
      setPhase('upload');
      setParseError(parsed.error || 'Không có dữ liệu để nhập');
      return;
    }

    try {
      const res = await onImport(parsed.rows);
      setResult(res ?? emptyBulkResult());
      setPhase('result');
    } catch {
      setPhase('upload');
      setParseError('Có lỗi khi nhập dữ liệu. Thử lại sau.');
    }
  };

  const requiredHeaders = columns.filter((c) => c.required).map((c) => c.header);
  const optionalHeaders = columns.filter((c) => !c.required).map((c) => c.header);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      {phase === 'result' && result ? (
        <ImportResultView result={result} onClose={handleClose} onImportMore={reset} />
      ) : (
        <div className="space-y-5">
          {description && (
            <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
          )}

          {/* Bước 1: file mẫu */}
          <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 text-sm font-bold">
                1
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-semibold text-slate-900">Tải file mẫu</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Dùng đúng cột trong mẫu để hệ thống nhận diện. Xóa dòng ví dụ trước khi nhập.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Download size={16} className="text-primary-600" />
                  Tải file mẫu
                </button>
              </div>
            </div>
            <div className="pl-11 space-y-1.5 text-xs text-slate-500">
              <p>
                <span className="font-semibold text-slate-600">Cột bắt buộc:</span>{' '}
                {requiredHeaders.join(', ')}
              </p>
              {optionalHeaders.length > 0 && (
                <p>
                  <span className="font-semibold text-slate-600">Cột tùy chọn:</span>{' '}
                  {optionalHeaders.join(', ')}
                </p>
              )}
              {hints.map((h) => (
                <p key={h} className="leading-relaxed">
                  {h}
                </p>
              ))}
            </div>
          </section>

          {/* Bước 2: upload */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 text-sm font-bold">
                2
              </span>
              <p className="text-sm font-semibold text-slate-900">Chọn file để nhập</p>
            </div>

            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
              }}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              className={`rounded-xl border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-primary-400 bg-primary-50/60'
                  : 'border-slate-200 bg-white hover:border-primary-300 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet size={32} className="text-emerald-600" />
                  <p className="text-sm font-semibold text-slate-800 break-all px-2">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB · Bấm để chọn file khác
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload size={32} className="text-slate-400" />
                  <p className="text-sm font-medium text-slate-700">
                    Kéo thả file vào đây hoặc bấm để chọn
                  </p>
                  <p className="text-xs text-slate-500">.xlsx, .xls, .csv · tối đa khuyến nghị 5.000 dòng</p>
                </div>
              )}
            </div>

            {parseError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                <XCircle size={18} className="shrink-0 mt-0.5" />
                <span>{parseError}</span>
              </div>
            )}
          </section>

          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!file || phase === 'importing'}
              onClick={() => void handleStartImport()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-semibold transition-colors"
            >
              {phase === 'importing' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang nhập…
                </>
              ) : (
                <>
                  <ListChecks size={16} />
                  Bắt đầu nhập
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ImportResultView({
  result,
  onClose,
  onImportMore,
}: {
  result: BulkImportResult;
  onClose: () => void;
  onImportMore: () => void;
}) {
  const allOk = result.failed === 0 && result.skipped === 0 && result.success > 0;
  const hasIssue = result.failed > 0 || result.skipped > 0;

  return (
    <div className="space-y-5">
      <div
        className={`rounded-xl border px-4 py-4 ${
          allOk
            ? 'border-emerald-100 bg-emerald-50/80'
            : result.success === 0
              ? 'border-red-100 bg-red-50/80'
              : 'border-amber-100 bg-amber-50/80'
        }`}
      >
        <div className="flex items-start gap-3">
          {allOk ? (
            <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={22} />
          ) : result.success === 0 ? (
            <XCircle className="text-red-600 shrink-0 mt-0.5" size={22} />
          ) : (
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={22} />
          )}
          <div>
            <p className="text-sm font-bold text-slate-900">Kết quả nhập dữ liệu</p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {result.total} dòng trong file · {result.success} thêm mới
              {result.skipped > 0 ? ` · ${result.skipped} bỏ qua` : ''}
              {result.failed > 0 ? ` · ${result.failed} lỗi` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatCard label="Tổng dòng" value={result.total} tone="slate" />
        <StatCard label="Thành công" value={result.success} tone="emerald" />
        <StatCard label="Bỏ qua" value={result.skipped} tone="amber" />
        <StatCard label="Lỗi" value={result.failed} tone="red" />
      </div>

      {result.successLabels.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Đã thêm ({Math.min(result.successLabels.length, 8)}
            {result.successLabels.length > 8 ? `/${result.successLabels.length}` : ''})
          </p>
          <ul className="text-sm text-slate-700 space-y-1 max-h-28 overflow-y-auto">
            {result.successLabels.slice(0, 8).map((label) => (
              <li key={label} className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span className="truncate">{label}</span>
              </li>
            ))}
            {result.successLabels.length > 8 && (
              <li className="text-xs text-slate-400 pl-6">
                … và {result.successLabels.length - 8} mục khác
              </li>
            )}
          </ul>
        </div>
      )}

      {hasIssue && result.errors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Chi tiết dòng có vấn đề
          </p>
          <div className="max-h-48 overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-3 py-2 font-semibold w-20">Dòng</th>
                  <th className="px-3 py-2 font-semibold">Mô tả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.errors.map((err, i) => (
                  <tr key={`${err.row}-${i}`} className="text-slate-700">
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">{err.row}</td>
                    <td className="px-3 py-2 text-xs leading-relaxed">{err.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 pt-1 border-t border-slate-100">
        {result.success > 0 && result.failed > 0 && (
          <button
            type="button"
            onClick={onImportMore}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors"
          >
            Nhập file khác
          </button>
        )}
        {result.success === 0 && (
          <button
            type="button"
            onClick={onImportMore}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors"
          >
            Thử lại
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'slate' | 'emerald' | 'amber' | 'red';
}) {
  const tones = {
    slate: 'bg-slate-50 text-slate-800 border-slate-100',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    amber: 'bg-amber-50 text-amber-800 border-amber-100',
    red: 'bg-red-50 text-red-800 border-red-100',
  };
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${tones[tone]}`}>
      <p className="text-[11px] font-medium opacity-80">{label}</p>
      <p className="text-lg font-bold tabular-nums leading-tight mt-0.5">{value}</p>
    </div>
  );
}
