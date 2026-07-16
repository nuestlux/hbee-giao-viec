/**
 * Nhập hàng loạt từ Excel — parse, chuẩn hóa header, validate.
 * Dùng chung cho Phòng ban / Người dùng / Danh mục.
 */
import * as XLSX from 'xlsx';
import type { UserRole } from '../types';
import { ROLE_LABELS } from './role-labels';

export type BulkImportRowError = {
  /** Số dòng Excel (1-based, gồm header → dòng dữ liệu bắt đầu từ 2) */
  row: number;
  message: string;
};

export type BulkImportResult = {
  total: number;
  success: number;
  skipped: number;
  failed: number;
  errors: BulkImportRowError[];
  /** Nhãn ngắn các bản ghi tạo thành công (để hiển thị tóm tắt) */
  successLabels: string[];
};

export type BulkImportColumn = {
  /** Key nội bộ */
  key: string;
  /** Header hiển thị trong file mẫu */
  header: string;
  /** Alias header người dùng có thể dùng (không dấu, viết thường) */
  aliases?: string[];
  required?: boolean;
  example?: string;
};

function stripDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function normalizeHeader(h: string): string {
  return stripDiacritics(String(h || ''))
    .toLowerCase()
    .replace(/[*：:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cellStr(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'number' && !Number.isNaN(v)) return String(v).trim();
  return String(v).trim();
}

export function parseActiveFlag(raw: string, defaultActive = true): boolean {
  const s = stripDiacritics(raw).toLowerCase().trim();
  if (!s) return defaultActive;
  if (['0', 'false', 'no', 'n', 'khong', 'khoa', 'an', 'inactive', 'ngung'].includes(s)) {
    return false;
  }
  if (['1', 'true', 'yes', 'y', 'co', 'hoat dong', 'active', 'mo'].includes(s)) {
    return true;
  }
  return defaultActive;
}

/** Map vai trò từ mã hoặc nhãn VN */
export function parseUserRole(raw: string): UserRole | null {
  const s = raw.trim();
  if (!s) return null;
  const upper = s.toUpperCase().replace(/\s+/g, '_');
  const codes: UserRole[] = [
    'CHAIRMAN',
    'VICE_CHAIRMAN',
    'DEPT_HEAD',
    'DEPT_DEPUTY',
    'SPECIALIST',
    'CLERK',
    'ADMIN',
  ];
  if (codes.includes(upper as UserRole)) return upper as UserRole;

  const n = stripDiacritics(s).toLowerCase();
  const byLabel: Record<string, UserRole> = {
    'chu tich': 'CHAIRMAN',
    'pho chu tich': 'VICE_CHAIRMAN',
    'truong phong': 'DEPT_HEAD',
    'pho phong': 'DEPT_DEPUTY',
    'chuyen vien': 'SPECIALIST',
    'van thu': 'CLERK',
    'quan tri': 'ADMIN',
    'quan tri he thong': 'ADMIN',
    admin: 'ADMIN',
  };
  return byLabel[n] ?? null;
}

export function downloadExcelTemplate(
  filename: string,
  columns: BulkImportColumn[],
  sheetName = 'Mau_nhap',
): void {
  const headers = columns.map((c) => c.header);
  const example = columns.map((c) => c.example ?? '');
  const note = columns.map((c) =>
    c.required ? 'Bắt buộc' : 'Tùy chọn',
  );

  const aoa = [headers, example, note];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = headers.map((h) => ({ wch: Math.min(36, Math.max(14, h.length + 4)) }));

  // Hướng dẫn dòng 4
  XLSX.utils.sheet_add_aoa(
    ws,
    [
      [],
      [
        'Hướng dẫn: Xóa dòng ví dụ (dòng 2) và dòng ghi chú (dòng 3) trước khi nhập. Chỉ giữ header + dữ liệu.',
      ],
    ],
    { origin: -1 },
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export type ParsedSheet = {
  /** Dòng Excel gốc (1-based) */
  excelRow: number;
  cells: Record<string, string>;
};

/**
 * Đọc sheet đầu, map cột theo header/alias.
 * Bỏ qua dòng trống và dòng ghi chú mẫu.
 */
export async function parseExcelFile(
  file: File,
  columns: BulkImportColumn[],
): Promise<{ rows: ParsedSheet[]; error?: string }> {
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return { rows: [], error: 'File Excel không có sheet nào' };

    const sheet = wb.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as unknown[][];

    if (!matrix.length) return { rows: [], error: 'File Excel trống' };

    const headerRow = (matrix[0] || []).map((h) => cellStr(h));
    const keyByCol: (string | null)[] = headerRow.map((h) => {
      const nh = normalizeHeader(h);
      if (!nh) return null;
      for (const col of columns) {
        const candidates = [
          normalizeHeader(col.header),
          normalizeHeader(col.key),
          ...(col.aliases || []).map(normalizeHeader),
        ];
        if (candidates.includes(nh)) return col.key;
      }
      return null;
    });

    const mappedKeys = keyByCol.filter(Boolean);
    if (mappedKeys.length === 0) {
      return {
        rows: [],
        error: `Không nhận diện được cột. Cần header: ${columns.map((c) => c.header).join(', ')}`,
      };
    }

    const requiredMissing = columns
      .filter((c) => c.required)
      .filter((c) => !keyByCol.includes(c.key));
    if (requiredMissing.length) {
      return {
        rows: [],
        error: `Thiếu cột bắt buộc: ${requiredMissing.map((c) => c.header).join(', ')}`,
      };
    }

    const rows: ParsedSheet[] = [];
    for (let i = 1; i < matrix.length; i++) {
      const line = matrix[i] || [];
      const cells: Record<string, string> = {};
      let any = false;
      keyByCol.forEach((key, colIdx) => {
        if (!key) return;
        const val = cellStr(line[colIdx]);
        cells[key] = val;
        if (val) any = true;
      });
      if (!any) continue;

      // Bỏ dòng hướng dẫn / ghi chú mẫu
      const joined = Object.values(cells).join(' ').toLowerCase();
      if (
        joined.includes('bắt buộc') ||
        joined.includes('bat buoc') ||
        joined.includes('hướng dẫn') ||
        joined.includes('huong dan') ||
        joined.includes('tùy chọn') ||
        joined.includes('tuy chon')
      ) {
        continue;
      }

      rows.push({ excelRow: i + 1, cells });
    }

    if (!rows.length) {
      return { rows: [], error: 'Không có dòng dữ liệu hợp lệ (chỉ thấy header hoặc dòng trống)' };
    }

    return { rows };
  } catch {
    return { rows: [], error: 'Không đọc được file. Hãy dùng định dạng .xlsx hoặc .xls' };
  }
}

// ── Column presets ─────────────────────────────────────────

export const DEPT_IMPORT_COLUMNS: BulkImportColumn[] = [
  {
    key: 'code',
    header: 'Mã phòng ban',
    aliases: ['ma', 'ma phong ban', 'code', 'ma pb'],
    required: true,
    example: 'KT-XH',
  },
  {
    key: 'name',
    header: 'Tên phòng ban',
    aliases: ['ten', 'ten phong ban', 'name', 'ten pb'],
    required: true,
    example: 'Kinh tế - Xã hội',
  },
  {
    key: 'parentCode',
    header: 'Mã phòng cha',
    aliases: ['ma phong cha', 'parent', 'phong cha'],
    required: false,
    example: '',
  },
  {
    key: 'isActive',
    header: 'Trạng thái',
    aliases: ['status', 'hoat dong', 'active'],
    required: false,
    example: 'Hoạt động',
  },
];

export const USER_IMPORT_COLUMNS: BulkImportColumn[] = [
  {
    key: 'fullName',
    header: 'Họ và tên',
    aliases: ['ho ten', 'ten', 'full name', 'hoten'],
    required: true,
    example: 'Nguyễn Văn Bình',
  },
  {
    key: 'email',
    header: 'Email',
    aliases: ['mail', 'e-mail'],
    required: true,
    example: 'nguyenvanbinh@hoabinh.gov.vn',
  },
  {
    key: 'phone',
    header: 'Số điện thoại',
    aliases: ['sdt', 'dien thoai', 'phone', 'mobile'],
    required: false,
    example: '0901 234 999',
  },
  {
    key: 'departmentCode',
    header: 'Mã phòng ban',
    aliases: ['ma phong ban', 'phong ban', 'dept', 'department'],
    required: true,
    example: 'VP-UBND',
  },
  {
    key: 'role',
    header: 'Vai trò',
    aliases: ['role', 'chuc danh vai tro'],
    required: true,
    example: 'Chuyên viên',
  },
  {
    key: 'position',
    header: 'Chức vụ',
    aliases: ['chuc vu', 'position', 'title'],
    required: false,
    example: 'Chuyên viên',
  },
  {
    key: 'isActive',
    header: 'Trạng thái',
    aliases: ['status', 'hoat dong', 'active'],
    required: false,
    example: 'Hoạt động',
  },
];

export const CATALOG_IMPORT_COLUMNS: BulkImportColumn[] = [
  {
    key: 'code',
    header: 'Mã',
    aliases: ['ma', 'code', 'ma danh muc'],
    required: true,
    example: 'CV-MOI',
  },
  {
    key: 'name',
    header: 'Tên',
    aliases: ['ten', 'name', 'ten danh muc'],
    required: true,
    example: 'Công văn mới',
  },
  {
    key: 'isActive',
    header: 'Trạng thái',
    aliases: ['status', 'hoat dong', 'active'],
    required: false,
    example: 'Hoạt động',
  },
];

export function roleImportHint(): string {
  return Object.entries(ROLE_LABELS)
    .map(([code, label]) => `${label} (${code})`)
    .join(', ');
}

export function emptyBulkResult(): BulkImportResult {
  return {
    total: 0,
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    successLabels: [],
  };
}
