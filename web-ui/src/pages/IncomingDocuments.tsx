import { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  Edit2,
  Eye,
  FileDown,
  FileText,
  Plus,
  Paperclip,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  UrgencyBadge,
  SecurityBadge,
  DataTable,
  FilterBar,
  filterSelectClass,
  Modal,
  FormField,
  inputClass,
  selectClass,
  textareaClass,
  ConfirmDialog,
  Pagination,
} from '../components';
import type { IncomingDocument, UrgencyLevel, SecurityLevel } from '../types';
import { canViewSecretDocument, hasPermission } from '../utils/permissions';
import {
  DOCUMENT_SOURCE_KIND_LABELS,
  PAGE_COPY,
  SECURITY_LABELS,
  URGENCY_LABELS,
} from '../utils/ui-labels';
import { sortRows, toggleSort, type SortState } from '../utils/table-sort';
import { useClientPagination } from '../hooks/use-client-pagination';
import type { DocumentSourceKind } from '../types';

const emptyForm = (): Partial<IncomingDocument> => ({
  documentNumber: '',
  issuer: '',
  subject: '',
  documentTypeId: '',
  fieldId: '',
  issuedDate: '',
  urgency: 'THUONG',
  security: 'THUONG',
  sourceKind: null,
  sourceCitation: '',
});

export default function IncomingDocuments() {
  const {
    incomingDocuments,
    documentTypes,
    fields,
    roles,
    currentUser,
    addDocument,
    updateDocument,
    deleteDocument,
  } = useStore();

  const canView = hasPermission(currentUser, roles, 'document.view');
  const canCreate = hasPermission(currentUser, roles, 'document.create');
  const canEdit = hasPermission(currentUser, roles, 'document.edit');
  const canDelete = hasPermission(currentUser, roles, 'document.delete');
  const canSeeSecret = canViewSecretDocument(currentUser, roles);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [fieldFilter, setFieldFilter] = useState('all');
  const [sort, setSort] = useState<SortState>({ key: 'receivedDate', direction: 'desc' });

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<IncomingDocument>>(emptyForm());

  const [detailDoc, setDetailDoc] = useState<IncomingDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IncomingDocument | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'ok' | 'err' } | null>(null);

  const showToast = (message: string, variant: 'ok' | 'err' = 'ok') => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 3000);
  };

  const hasActiveFilters =
    Boolean(searchTerm) || typeFilter !== 'all' || fieldFilter !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setFieldFilter('all');
  };

  const filteredDocs = useMemo(() => {
    const q = searchTerm.toLowerCase();
    const filtered = incomingDocuments.filter((doc) => {
      const numberMatch = doc.documentNumber.toLowerCase().includes(q);
      // Do not match raw TOI_MAT subject for users without secret access.
      const subjectSearchable =
        doc.security === 'TOI_MAT' && !canSeeSecret ? '' : doc.subject.toLowerCase();
      const issuerMatch = doc.issuer?.toLowerCase().includes(q);
      const matchSearch = !q || numberMatch || subjectSearchable.includes(q) || issuerMatch;
      const matchType = typeFilter === 'all' || doc.documentTypeId === typeFilter;
      const matchField = fieldFilter === 'all' || doc.fieldId === fieldFilter;
      return matchSearch && matchType && matchField;
    });

    return sortRows(filtered, sort, {
      number: (r) => r.documentNumber,
      subject: (r) => r.subject,
      issuer: (r) => r.issuer,
      receivedDate: (r) => r.receivedDate,
      issuedDate: (r) => r.issuedDate,
      urgency: (r) => r.urgency,
    });
  }, [incomingDocuments, searchTerm, typeFilter, fieldFilter, canSeeSecret, sort]);

  const pageResetKey = `${searchTerm}|${typeFilter}|${fieldFilter}|${sort.key}|${sort.direction}`;
  const {
    page,
    setPage,
    pageSize,
    total,
    totalPages,
    pageItems: pagedDocs,
  } = useClientPagination(filteredDocs, 10, pageResetKey);

  const subjectFor = (doc: IncomingDocument) => {
    if (doc.security === 'TOI_MAT' && !canSeeSecret) {
      return '[Tối mật] — Bạn không đủ quyền xem trích yếu';
    }
    return doc.subject;
  };

  const openCreate = () => {
    if (!canCreate) return;
    setEditingId(null);
    setFormData(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (doc: IncomingDocument) => {
    if (!canEdit) return;
    setEditingId(doc.id);
    setFormData({
      documentNumber: doc.documentNumber,
      issuer: doc.issuer,
      subject: doc.subject,
      documentTypeId: doc.documentTypeId,
      fieldId: doc.fieldId,
      issuedDate: doc.issuedDate,
      urgency: doc.urgency,
      security: doc.security,
      sourceKind: doc.sourceKind ?? null,
      sourceCitation: doc.sourceCitation || '',
    });
    setDetailDoc(null);
    setFormOpen(true);
  };

  const openDetail = (doc: IncomingDocument) => {
    if (!canView) return;
    setDetailDoc(doc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.documentNumber || !formData.subject || !formData.documentTypeId) return;

    if (editingId) {
      const ok = updateDocument(editingId, formData);
      if (!ok) {
        showToast('Không có quyền sửa hoặc văn bản không tồn tại', 'err');
        return;
      }
      showToast('Cập nhật văn bản thành công');
    } else {
      const created = addDocument({
        ...formData,
        receivedDate: new Date().toISOString().split('T')[0],
      });
      if (!created) {
        showToast('Bạn không có quyền tiếp nhận văn bản', 'err');
        return;
      }
      showToast('Tiếp nhận văn bản thành công');
    }
    setFormOpen(false);
    setEditingId(null);
    setFormData(emptyForm());
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const result = deleteDocument(deleteTarget.id);
    setDeleteTarget(null);
    setDetailDoc(null);
    if (!result.ok) {
      showToast(result.error || 'Xóa thất bại', 'err');
      return;
    }
    showToast('Đã xóa văn bản');
  };

  const handleDownload = (doc: IncomingDocument) => {
    if (!canView) return;
    if (!doc.attachments?.length) {
      showToast('Chưa có tệp đính kèm', 'err');
      return;
    }
    const names = doc.attachments.map((a) => a.fileName).join(', ');
    showToast(`Tải mock: ${names}`);
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Không có quyền xem văn bản</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Tài khoản của bạn chưa được cấp quyền <code className="text-primary-700">document.view</code>.
          Liên hệ quản trị viên nếu cần truy cập module Văn bản đến.
        </p>
      </div>
    );
  }

  const columns = [
    {
      key: 'number',
      title: 'Số/Ký hiệu',
      sortable: true,
      render: (row: IncomingDocument) => (
        <div>
          <div className="font-semibold text-gray-900">{row.documentNumber}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Calendar size={12} />
            {row.issuedDate
              ? new Date(row.issuedDate).toLocaleDateString('vi-VN')
              : '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'subject',
      title: 'Trích yếu',
      sortable: true,
      render: (row: IncomingDocument) => (
        <div className="max-w-md">
          <div className="font-medium text-gray-900 line-clamp-2" title={subjectFor(row)}>
            {subjectFor(row)}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              <FileText size={12} />
              {row.documentTypeName}
            </span>
            {row.fieldName && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {row.fieldName}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'issuer',
      title: 'Nơi ban hành',
      sortable: true,
      render: (row: IncomingDocument) => (
        <div className="text-sm text-gray-900">{row.issuer}</div>
      ),
    },
    {
      key: 'badges',
      title: 'Khẩn / Mật',
      render: (row: IncomingDocument) => (
        <div className="flex flex-col gap-1 items-start">
          <UrgencyBadge urgency={row.urgency} />
          {row.security !== 'THUONG' && <SecurityBadge security={row.security} />}
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right' as const,
      render: (row: IncomingDocument) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => openDetail(row)}
            className="p-1.5 text-gray-400 hover:text-primary-600 rounded-md hover:bg-primary-50 transition-colors"
            title="Xem chi tiết"
          >
            <Eye size={16} />
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => openEdit(row)}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
              title="Sửa"
            >
              <Edit2 size={16} />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => {
                if (row.taskIds?.length) {
                  showToast('Văn bản đang gắn nhiệm vụ, không thể xóa', 'err');
                  return;
                }
                setDeleteTarget(row);
              }}
              className={`p-1.5 rounded-md transition-colors ${
                row.taskIds?.length
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
              }`}
              title={
                row.taskIds?.length
                  ? 'Đang gắn nhiệm vụ — không xóa được'
                  : 'Xóa'
              }
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDownload(row)}
            className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors"
            title="Tải file đính kèm"
          >
            <FileDown size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right ${
            toast.variant === 'err' ? 'bg-red-500' : 'bg-emerald-500'
          }`}
        >
          <Check size={16} />
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
          {PAGE_COPY.documents.title}
        </h1>
        {canCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus size={16} />
            {PAGE_COPY.documents.create}
          </button>
        )}
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm số hiệu, trích yếu, nơi ban hành..."
        total={filteredDocs.length}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
      >
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={filterSelectClass}
          aria-label="Lọc loại văn bản"
        >
          <option value="all">Loại văn bản</option>
          {documentTypes.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={fieldFilter}
          onChange={(e) => setFieldFilter(e.target.value)}
          className={filterSelectClass}
          aria-label="Lọc lĩnh vực"
        >
          <option value="all">Lĩnh vực</option>
          {fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={pagedDocs}
        emptyMessage={PAGE_COPY.documents.empty}
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

      {/* Create / Edit form */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? PAGE_COPY.documents.editModal : PAGE_COPY.documents.createModal}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Số/Ký hiệu" required>
              <input
                type="text"
                value={formData.documentNumber || ''}
                onChange={(e) =>
                  setFormData({ ...formData, documentNumber: e.target.value })
                }
                className={inputClass}
                required
              />
            </FormField>

            <FormField label="Nơi ban hành" required>
              <input
                type="text"
                value={formData.issuer || ''}
                onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                className={inputClass}
                required
              />
            </FormField>

            <FormField label="Loại văn bản" required>
              <select
                value={formData.documentTypeId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, documentTypeId: e.target.value })
                }
                className={selectClass}
                required
              >
                <option value="">-- Chọn loại VB --</option>
                {documentTypes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Ngày ban hành" required>
              <input
                type="date"
                value={formData.issuedDate || ''}
                onChange={(e) =>
                  setFormData({ ...formData, issuedDate: e.target.value })
                }
                className={inputClass}
                required
              />
            </FormField>
          </div>

          <FormField label="Trích yếu nội dung" required>
            <textarea
              value={formData.subject || ''}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className={textareaClass}
              rows={3}
              required
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Lĩnh vực">
              <select
                value={formData.fieldId || ''}
                onChange={(e) => setFormData({ ...formData, fieldId: e.target.value })}
                className={selectClass}
              >
                <option value="">-- Chọn lĩnh vực --</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Độ khẩn">
              <select
                value={formData.urgency || 'THUONG'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    urgency: e.target.value as UrgencyLevel,
                  })
                }
                className={selectClass}
              >
                <option value="THUONG">{URGENCY_LABELS.THUONG}</option>
                <option value="KHAN">{URGENCY_LABELS.KHAN}</option>
                <option value="THUONG_KHAN">{URGENCY_LABELS.THUONG_KHAN}</option>
              </select>
            </FormField>

            <FormField label="Độ mật">
              <select
                value={formData.security || 'THUONG'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    security: e.target.value as SecurityLevel,
                  })
                }
                className={selectClass}
              >
                <option value="THUONG">{SECURITY_LABELS.THUONG}</option>
                <option value="MAT">{SECURITY_LABELS.MAT}</option>
                <option value="TOI_MAT">{SECURITY_LABELS.TOI_MAT}</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Loại nguồn gốc">
              <select
                value={formData.sourceKind || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sourceKind: (e.target.value || null) as DocumentSourceKind | null,
                  })
                }
                className={selectClass}
              >
                <option value="">-- Chọn --</option>
                {(Object.keys(DOCUMENT_SOURCE_KIND_LABELS) as DocumentSourceKind[]).map((k) => (
                  <option key={k} value={k}>
                    {DOCUMENT_SOURCE_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Trích dẫn nguồn">
              <input
                type="text"
                value={formData.sourceCitation || ''}
                onChange={(e) => setFormData({ ...formData, sourceCitation: e.target.value })}
                className={inputClass}
                placeholder="Số hiệu / trích dẫn đầy đủ"
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
            >
              {editingId ? 'Lưu' : 'Lưu văn bản'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail modal */}
      <Modal
        isOpen={!!detailDoc}
        onClose={() => setDetailDoc(null)}
        title="Chi tiết văn bản đến"
        size="lg"
      >
        {detailDoc && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Số/Ký hiệu
                </p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {detailDoc.documentNumber}
                </p>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <UrgencyBadge urgency={detailDoc.urgency} />
                {detailDoc.security !== 'THUONG' && (
                  <SecurityBadge security={detailDoc.security} />
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Trích yếu
              </p>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {subjectFor(detailDoc)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Nơi ban hành</p>
                <p className="font-medium text-gray-900 mt-0.5">{detailDoc.issuer}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Loại văn bản</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {detailDoc.documentTypeName || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Lĩnh vực</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {detailDoc.fieldName || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ngày ban hành</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {detailDoc.issuedDate
                    ? new Date(detailDoc.issuedDate).toLocaleDateString('vi-VN')
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ngày tiếp nhận</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {detailDoc.receivedDate
                    ? new Date(detailDoc.receivedDate).toLocaleDateString('vi-VN')
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Nhiệm vụ liên quan</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {detailDoc.taskIds?.length
                    ? `${detailDoc.taskIds.length} nhiệm vụ`
                    : 'Chưa gắn'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Tệp đính kèm
              </p>
              {detailDoc.attachments?.length ? (
                <ul className="space-y-2">
                  {detailDoc.attachments.map((att) => (
                    <li
                      key={att.id}
                      className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"
                    >
                      <Paperclip size={14} className="text-gray-400 shrink-0" />
                      <span className="truncate flex-1">{att.fileName}</span>
                      <span className="text-xs text-gray-400">
                        {(att.fileSize / 1024).toFixed(0)} KB
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">Chưa có tệp đính kèm</p>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleDownload(detailDoc)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <FileDown size={15} />
                Tải tệp
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => openEdit(detailDoc)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
                >
                  <Edit2 size={15} />
                  Sửa
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(detailDoc)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  <Trash2 size={15} />
                  Xóa
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailDoc(null)}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa văn bản?"
        message={
          deleteTarget
            ? `Bạn có chắc muốn xóa «${deleteTarget.documentNumber}»? Hành động không thể hoàn tác. Văn bản đã gắn nhiệm vụ sẽ bị từ chối xóa.`
            : ''
        }
        confirmLabel="Xóa văn bản"
        variant="danger"
      />
    </div>
  );
}
