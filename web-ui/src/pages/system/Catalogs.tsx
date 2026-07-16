import { useMemo, useState } from 'react';
import { FileText, CheckSquare, Layers, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  Modal,
  FormField,
  inputClass,
  ConfirmDialog,
  FilterBar,
  DataTable,
  Pagination,
} from '../../components';
import type { Column } from '../../components';
import { sortRows, toggleSort, type SortState } from '../../utils/table-sort';
import { useClientPagination } from '../../hooks/use-client-pagination';

type CatalogRow = { id: string; name: string; code: string; isActive: boolean };

export default function Catalogs() {
  const [activeTab, setActiveTab] = useState<'docs' | 'tasks' | 'fields'>('docs');
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'code', direction: 'asc' });
  
  // State from store
  const { 
    documentTypes, addDocumentType, updateDocumentType, deleteDocumentType,
    taskCategories, addTaskCategory, updateTaskCategory, deleteTaskCategory,
    fields, addField, updateField, deleteField
  } = useStore();

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', isActive: true });

  // Delete Confirm State
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const tableData = useMemo(() => {
    let data: CatalogRow[] = [];
    switch (activeTab) {
      case 'docs':
        data = documentTypes;
        break;
      case 'tasks':
        data = taskCategories;
        break;
      case 'fields':
        data = fields;
        break;
    }
    const q = searchTerm.toLowerCase();
    const filtered = data.filter(
      (item) =>
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q),
    );
    return sortRows(filtered, sort, {
      code: (r) => r.code,
      name: (r) => r.name,
      status: (r) => (r.isActive ? 1 : 0),
    });
  }, [activeTab, documentTypes, taskCategories, fields, searchTerm, sort]);

  const pageResetKey = `${activeTab}|${searchTerm}|${sort.key}|${sort.direction}`;
  const {
    page,
    setPage,
    pageSize,
    total,
    totalPages,
    pageItems: pagedCatalog,
  } = useClientPagination(tableData, 10, pageResetKey);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ name: item.name, code: item.code, isActive: item.isActive });
    } else {
      setEditingId(null);
      setFormData({ name: '', code: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    if (activeTab === 'docs') {
      if (editingId) updateDocumentType(editingId, formData);
      else addDocumentType(formData);
    } else if (activeTab === 'tasks') {
      if (editingId) updateTaskCategory(editingId, formData);
      else addTaskCategory(formData);
    } else if (activeTab === 'fields') {
      if (editingId) updateField(editingId, formData);
      else addField(formData);
    }

    setIsModalOpen(false);
    showToast(editingId ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
  };

  const handleDelete = () => {
    if (!deleteDialog) return;
    
    if (activeTab === 'docs') deleteDocumentType(deleteDialog.id);
    else if (activeTab === 'tasks') deleteTaskCategory(deleteDialog.id);
    else if (activeTab === 'fields') deleteField(deleteDialog.id);

    setDeleteDialog(null);
    showToast('Xóa thành công!');
  };

  const handleToggleActive = (item: any) => {
    const changes = { isActive: !item.isActive };
    if (activeTab === 'docs') updateDocumentType(item.id, changes);
    else if (activeTab === 'tasks') updateTaskCategory(item.id, changes);
    else if (activeTab === 'fields') updateField(item.id, changes);
  };

  const tabs = [
    { id: 'docs', label: 'Loại văn bản', icon: FileText },
    { id: 'tasks', label: 'Nhóm nhiệm vụ', icon: CheckSquare },
    { id: 'fields', label: 'Lĩnh vực', icon: Layers },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right">
          <Check size={16} />
          {toastMessage}
        </div>
      )}

      <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
        Danh mục
      </h1>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex p-1 bg-gray-100 rounded-xl">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          Thêm mới
        </button>
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm mã, tên..."
        total={tableData.length}
        hasActiveFilters={Boolean(searchTerm)}
        onReset={() => setSearchTerm('')}
      />

      <DataTable
        size="middle"
        emptyMessage="Không có danh mục"
        sortKey={sort.key}
        sortDirection={sort.direction}
        onSort={(key) => setSort((s) => toggleSort(s, key))}
        data={pagedCatalog}
        columns={
          [
            {
              key: 'code',
              title: 'Mã',
              sortable: true,
              width: '8rem',
              render: (item) => (
                <span className="font-mono text-sm font-medium text-gray-900">{item.code}</span>
              ),
            },
            {
              key: 'name',
              title: 'Tên danh mục',
              sortable: true,
              render: (item) => <span className="text-sm text-gray-700">{item.name}</span>,
            },
            {
              key: 'status',
              title: 'Trạng thái',
              sortable: true,
              width: '9rem',
              render: (item) => (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleActive(item);
                  }}
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    item.isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {item.isActive ? 'Đang dùng' : 'Tạm ẩn'}
                </button>
              ),
            },
            {
              key: 'actions',
              title: 'Thao tác',
              align: 'right',
              width: '7rem',
              render: (item) => (
                <div
                  className="flex items-center justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenModal(item)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 rounded-md hover:bg-primary-50 transition-colors"
                    title="Sửa"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteDialog({ isOpen: true, id: item.id, name: item.name })
                    }
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ),
            },
          ] as Column<CatalogRow>[]
        }
      />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        total={total}
        pageSize={pageSize}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? `Sửa ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}` : `Thêm ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Mã danh mục" required>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className={inputClass}
              placeholder="VD: QD"
              required
            />
          </FormField>
          
          <FormField label="Tên danh mục" required>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              placeholder="VD: Quyết định"
              required
            />
          </FormField>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Trạng thái kích hoạt</span>
          </label>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        message={`Xóa "${deleteDialog?.name}"?`}
      />
    </div>
  );
}
