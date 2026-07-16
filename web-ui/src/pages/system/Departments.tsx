import React, { useState } from 'react';
import { Building2, Plus, Edit2, Trash2, Check, Users, ShieldAlert, Key, FileSpreadsheet } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  Modal,
  FormField,
  inputClass,
  selectClass,
  ConfirmDialog,
  BulkImportExcelModal,
} from '../../components';
import {
  DEPT_IMPORT_COLUMNS,
  parseActiveFlag,
  type BulkImportResult,
  type ParsedSheet,
} from '../../utils/excel-bulk-import';

export default function Departments() {
  const { departments, users, addDepartment, updateDepartment, deleteDepartment } = useStore();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', code: '', parentId: '', headId: '', deputyHeadId: '', isActive: true 
  });

  // Delete Confirm
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenModal = (dept?: any) => {
    if (dept) {
      setEditingId(dept.id);
      setFormData({ 
        name: dept.name, code: dept.code, 
        parentId: dept.parentId || '', 
        headId: dept.headId || '', 
        deputyHeadId: dept.deputyHeadId || '', 
        isActive: dept.isActive 
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', code: '', parentId: '', headId: '', deputyHeadId: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;
    
    const payload = {
      ...formData,
      parentId: formData.parentId || null,
      headId: formData.headId || null,
      deputyHeadId: formData.deputyHeadId || null,
      memberCount: editingId ? departments.find(d => d.id === editingId)?.memberCount || 0 : 0
    };

    if (editingId) updateDepartment(editingId, payload);
    else addDepartment(payload);

    setIsModalOpen(false);
    showToast(editingId ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
  };

  const handleDelete = () => {
    if (!deleteDialog) return;
    deleteDepartment(deleteDialog.id);
    setDeleteDialog(null);
    showToast('Xóa thành công!');
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    updateDepartment(id, { isActive: !isActive });
    showToast('Đã cập nhật trạng thái!');
  };

  const getHeadName = (id: string | null) => users.find(u => u.id === id)?.fullName || 'Chưa phân công';

  const handleBulkImport = (rows: ParsedSheet[]): BulkImportResult => {
    const result: BulkImportResult = {
      total: rows.length,
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      successLabels: [],
    };
    // Snapshot codes — gồm cả mã vừa tạo trong lượt này
    const knownCodes = new Map(
      useStore.getState().departments.map((d) => [d.code.toLowerCase(), d.id]),
    );

    for (const row of rows) {
      const code = row.cells.code?.trim() || '';
      const name = row.cells.name?.trim() || '';
      if (!code) {
        result.failed += 1;
        result.errors.push({ row: row.excelRow, message: 'Thiếu mã phòng ban' });
        continue;
      }
      if (!name) {
        result.failed += 1;
        result.errors.push({ row: row.excelRow, message: 'Thiếu tên phòng ban' });
        continue;
      }
      if (knownCodes.has(code.toLowerCase())) {
        result.skipped += 1;
        result.errors.push({
          row: row.excelRow,
          message: `Bỏ qua — mã "${code}" đã tồn tại`,
        });
        continue;
      }

      let parentId: string | null = null;
      const parentCode = row.cells.parentCode?.trim();
      if (parentCode) {
        const pid = knownCodes.get(parentCode.toLowerCase());
        if (!pid) {
          result.failed += 1;
          result.errors.push({
            row: row.excelRow,
            message: `Không tìm thấy mã phòng cha "${parentCode}"`,
          });
          continue;
        }
        parentId = pid;
      }

      const created = addDepartment({
        code,
        name,
        parentId,
        isActive: parseActiveFlag(row.cells.isActive || '', true),
      });
      knownCodes.set(code.toLowerCase(), created.id);
      result.success += 1;
      result.successLabels.push(`${code} — ${name}`);
    }

    return result;
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right">
          <Check size={16} />
          {toastMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
          Phòng ban
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            Nhập Excel
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus size={16} />
            Thêm
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {departments.map(dept => (
          <div key={dept.id} className={`glass rounded-xl shadow-sm border border-gray-100 p-5 relative group transition-all hover:shadow-md ${!dept.isActive ? 'opacity-70 grayscale-[50%]' : ''}`}>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-white/90 p-1 rounded-lg shadow-sm">
              <button onClick={() => handleOpenModal(dept)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md" title="Sửa"><Edit2 size={16} /></button>
              <button onClick={() => setDeleteDialog({ isOpen: true, id: dept.id, name: dept.name })} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md" title="Xóa"><Trash2 size={16} /></button>
            </div>
            
            <div className="flex items-center gap-4 mb-5">
              <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{dept.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{dept.code}</span>
                  {!dept.isActive && <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded font-medium">Đã ẩn</span>}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-500 flex items-center gap-2">
                  <Key size={16} className="text-gray-400" />
                  Trưởng phòng
                </div>
                <div className="font-medium text-gray-900">{getHeadName(dept.headId)}</div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-500 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-gray-400" />
                  Phó phòng
                </div>
                <div className="font-medium text-gray-900">{getHeadName(dept.deputyHeadId)}</div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-50">
                <div className="flex items-center gap-2 text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg font-medium text-sm">
                  <Users size={16} />
                  {dept.memberCount} nhân sự
                </div>
                
                <button 
                  onClick={() => handleToggleActive(dept.id, dept.isActive)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    dept.isActive ? 'text-gray-500 bg-gray-100 hover:bg-gray-200' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  {dept.isActive ? 'Tạm ẩn' : 'Kích hoạt'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Sửa phòng ban' : 'Thêm phòng ban'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tên phòng ban" required>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} required />
            </FormField>
            <FormField label="Mã (Code)" required>
              <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className={inputClass} required />
            </FormField>
          </div>
          
          <FormField label="Phòng ban cấp trên">
            <select value={formData.parentId} onChange={e => setFormData({...formData, parentId: e.target.value})} className={selectClass}>
              <option value="">-- Không có (Trực thuộc UBND) --</option>
              {departments.filter(d => d.id !== editingId).map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Trưởng phòng">
              <select value={formData.headId} onChange={e => setFormData({...formData, headId: e.target.value})} className={selectClass}>
                <option value="">-- Chọn trưởng phòng --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </FormField>
            
            <FormField label="Phó phòng">
              <select value={formData.deputyHeadId} onChange={e => setFormData({...formData, deputyHeadId: e.target.value})} className={selectClass}>
                <option value="">-- Chọn phó phòng --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </FormField>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-4">
            <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="rounded text-primary-600" />
            <span className="text-sm font-medium text-gray-700">Trạng thái kích hoạt</span>
          </label>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Hủy</button>
            <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg">Lưu thay đổi</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteDialog} onClose={() => setDeleteDialog(null)} onConfirm={handleDelete} title="Xóa phòng ban" message={`Xóa "${deleteDialog?.name}"?`} />
    </div>
  );
}
