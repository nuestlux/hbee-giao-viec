import * as XLSX from 'xlsx';
import {
  UNIT_REPORT_HEADERS,
  type UnitReportRow,
} from './report-unit-in-progress';
import { formatReportDate } from './report-progress-level';
import { loadAppSettings } from '../settings/app-settings';
import { writeBlobToReportExportFolder } from '../settings/report-export-folder';

export type ExportUnitReportMeta = {
  organizationName?: string;
  asOf: string;
  departmentLabel?: string;
};

/**
 * Build workbook blob for unit in-progress report (customer-like layout).
 */
export function buildUnitInProgressWorkbook(
  rows: UnitReportRow[],
  meta: ExportUnitReportMeta,
): XLSX.WorkBook {
  const asOfLabel = formatReportDate(meta.asOf) || meta.asOf;
  const aoa: (string | number)[][] = [];

  aoa.push(['CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM']);
  aoa.push(['Độc lập - Tự do - Hạnh phúc']);
  aoa.push([]);
  aoa.push(['BÁO CÁO THỰC HIỆN NHIỆM VỤ_ĐANG THỰC HIỆN']);
  if (meta.organizationName) {
    aoa.push([meta.organizationName]);
  }
  if (meta.departmentLabel) {
    aoa.push([`Đơn vị: ${meta.departmentLabel}`]);
  }
  aoa.push([`Ngày chốt dữ liệu báo cáo: ${asOfLabel}`]);
  aoa.push([`Tổng nhiệm vụ_Đang thực hiện`, rows.length]);
  aoa.push([]);

  aoa.push([...UNIT_REPORT_HEADERS]);

  for (const row of rows) {
    aoa.push(row.cells);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = UNIT_REPORT_HEADERS.map((h, i) => {
    if (i === 1) return { wch: 48 };
    if (i === 9 || i === 11 || i === 17) return { wch: 28 };
    return { wch: Math.min(22, Math.max(10, h.length + 2)) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách nhiệm vụ đơn vị');
  return wb;
}

export type ExportUnitResult = {
  filename: string;
  savePath: string;
  /** true nếu ghi thẳng vào thư mục đã chọn bằng File System Access API */
  savedToPickedFolder: boolean;
};

export async function downloadUnitInProgressXlsx(
  rows: UnitReportRow[],
  meta: ExportUnitReportMeta,
): Promise<ExportUnitResult> {
  const settings = loadAppSettings();
  const wb = buildUnitInProgressWorkbook(rows, meta);
  const stamp = meta.asOf.replace(/[-:T]/g, '').slice(0, 12) || String(Date.now());
  const filename = `bao_cao_nhiem_vu_dang_thuc_hien_don_vi_${stamp}.xlsx`;

  // Thử ghi vào thư mục user đã chọn (Chrome/Edge)
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  const savedToPickedFolder = await writeBlobToReportExportFolder(filename, buffer);

  if (!savedToPickedFolder) {
    // Fallback: tải về Downloads
    XLSX.writeFile(wb, filename);
  }

  return {
    filename,
    savePath: settings.reportExportFolder,
    savedToPickedFolder,
  };
}
