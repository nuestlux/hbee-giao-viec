import { useMemo, useState } from 'react';
import {
  UserPlus, Shield, Mail, Building2, Check, Pencil, Trash2, KeyRound, Copy, Dices,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  Avatar,
  Modal,
  FormField,
  inputClass,
  selectClass,
  ConfirmDialog,
  FilterBar,
  filterSelectClass,
  DataTable,
  Pagination,
} from '../../components';
import type { Column } from '../../components';
import type { User, UserRole } from '../../types';
import { hasPermission } from '../../utils/permissions';
import { sortRows, toggleSort, type SortState } from '../../utils/table-sort';
import { useClientPagination } from '../../hooks/use-client-pagination';

/** Mật khẩu tạm dễ đọc — admin copy gửi user. */
function generateTempPassword(): string {
  const part = Math.random().toString(36).slice(2, 8).toUpperCase();
  const num = String(Math.floor(100 + Math.random() * 900));
  return `HB${part}${num}`;
}

export default function Users() {
  const users = useStore((s) => s.users);
  const departments = useStore((s) => s.departments);
  const roles = useStore((s) => s.roles);
  const currentUser = useStore((s) => s.currentUser);
  const addUser = useStore((s) => s.addUser);
  const updateUser = useStore((s) => s.updateUser);
  const deleteUser = useStore((s) => s.deleteUser);
  const toggleUserActive = useStore((s) => s.toggleUserActive);
  const adminResetPassword = useStore((s) => s.adminResetPassword);

  const canManage =
    hasPermission(currentUser, roles, 'user.manage') ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'CHAIRMAN' ||
    currentUser?.role === 'VICE_CHAIRMAN';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'SPECIALIST' as UserRole,
    departmentId: '',
    position: '',
    isActive: true,
  });

  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null);
  const [toggleDialog, setToggleDialog] = useState<{
    id: string;
    name: string;
    nextActive: boolean;
  } | null>(null);
  const [resetDialog, setResetDialog] = useState<{
    id: string;
    name: string;
    email: string;
    password: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const activeCount = users.filter((u) => u.isActive).length;
  const lockedCount = users.length - activeCount;

  const [sort, setSort] = useState<SortState>({ key: 'fullName', direction: 'asc' });

  const hasActiveFilters =
    Boolean(searchTerm) || selectedDept !== 'all' || selectedStatus !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDept('all');
    setSelectedStatus('all');
  };

  const roleLabels: Record<string, string> = {
    CHAIRMAN: 'Chủ tịch',
    VICE_CHAIRMAN: 'Phó Chủ tịch',
    DEPT_HEAD: 'Trưởng phòng',
    DEPT_DEPUTY: 'Phó phòng',
    SPECIALIST: 'Chuyên viên',
    CLERK: 'Văn thư',
    ADMIN: 'Quản trị hệ thống',
  };

  const filteredUsers = useMemo(() => {
    const filtered = users.filter((user) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        user.fullName.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.position?.toLowerCase().includes(q);
      const matchesDept = selectedDept === 'all' || user.departmentId === selectedDept;
      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && user.isActive) ||
        (selectedStatus === 'inactive' && !user.isActive);
      return matchesSearch && matchesDept && matchesStatus;
    });
    return sortRows(filtered, sort, {
      fullName: (r) => r.fullName,
      department: (r) => r.departmentName,
      role: (r) => roleLabels[r.role] || r.role,
      status: (r) => (r.isActive ? 1 : 0),
    });
  }, [users, searchTerm, selectedDept, selectedStatus, sort]);

  const pageResetKey = `${searchTerm}|${selectedDept}|${selectedStatus}|${sort.key}|${sort.direction}`;
  const {
    page,
    setPage,
    pageSize,
    total,
    totalPages,
    pageItems: pagedUsers,
  } = useClientPagination(filteredUsers, 10, pageResetKey);

  const handleOpenModal = (user?: User) => {
    if (!canManage) {
      showToast('Bạn không có quyền quản lý người dùng');
      return;
    }
    if (user) {
      setEditingId(user.id);
      setFormData({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        departmentId: user.departmentId,
        position: user.position,
        isActive: user.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        role: 'SPECIALIST',
        departmentId: '',
        position: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    if (!formData.fullName || !formData.email) return;

    if (editingId) updateUser(editingId, formData);
    else addUser(formData);

    setIsModalOpen(false);
    showToast(editingId ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
  };

  const handleDelete = () => {
    if (!deleteDialog || !canManage) return;
    deleteUser(deleteDialog.id);
    setDeleteDialog(null);
    showToast('Xóa thành công!');
  };

  const requestToggle = (user: User) => {
    if (!canManage) {
      showToast('Bạn không có quyền khóa/mở tài khoản');
      return;
    }
    setToggleDialog({
      id: user.id,
      name: user.fullName,
      nextActive: !user.isActive,
    });
  };

  const confirmToggle = () => {
    if (!toggleDialog || !canManage) return;
    const { id, nextActive, name } = toggleDialog;
    toggleUserActive(id);
    setToggleDialog(null);
    showToast(nextActive ? `Đã mở khóa: ${name}` : `Đã khóa: ${name} — không đăng nhập được`);
  };

  const requestResetPassword = (user: User) => {
    if (!canManage) {
      showToast('Bạn không có quyền đặt lại mật khẩu');
      return;
    }
    setResetDialog({
      id: user.id,
      name: user.fullName,
      email: user.email,
      password: generateTempPassword(),
    });
  };

  const randomizeResetPassword = () => {
    setResetDialog((prev) =>
      prev ? { ...prev, password: generateTempPassword() } : prev
    );
  };

  const copyResetPassword = async () => {
    if (!resetDialog?.password?.trim()) {
      showToast('Chưa có mật khẩu để sao chép');
      return;
    }
    try {
      await navigator.clipboard.writeText(resetDialog.password.trim());
      showToast('Đã sao chép mật khẩu');
    } catch {
      showToast('Không sao chép được — hãy chọn và copy thủ công');
    }
  };

  const confirmResetPassword = () => {
    if (!resetDialog || !canManage) return;
    const pwd = resetDialog.password.trim();
    if (pwd.length < 4) {
      showToast('Mật khẩu cần ít nhất 4 ký tự');
      return;
    }
    const result = adminResetPassword(resetDialog.id, { newPassword: pwd });
    if (!result.ok) {
      showToast(result.error);
      return;
    }
    setResetDialog(null);
    showToast(`Đã đặt lại mật khẩu cho ${resetDialog.name}`);
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
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
            Người dùng
          </h1>
          <span className="text-sm text-slate-500 tabular-nums">
            {activeCount} hoạt động · {lockedCount} khóa
            {!canManage && <span className="text-amber-600"> · Chỉ xem</span>}
          </span>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <UserPlus size={16} />
            Thêm
          </button>
        )}
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm tên, email, chức vụ..."
        total={filteredUsers.length}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
      >
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className={filterSelectClass}
          aria-label="Lọc phòng ban"
        >
          <option value="all">Phòng ban</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className={filterSelectClass}
          aria-label="Lọc trạng thái"
        >
          <option value="all">Trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Đã khóa</option>
        </select>
      </FilterBar>

      <DataTable
        size="middle"
        emptyMessage="Không có người dùng"
        sortKey={sort.key}
        sortDirection={sort.direction}
        onSort={(key) => setSort((s) => toggleSort(s, key))}
        data={pagedUsers}
        columns={
          [
            {
              key: 'fullName',
              title: 'Người dùng',
              sortable: true,
              render: (user) => (
                <div className={`flex items-center gap-3 ${!user.isActive ? 'opacity-70' : ''}`}>
                  <Avatar name={user.fullName} src={user.avatar} size="md" />
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{user.fullName}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                      <Mail size={12} className="text-gray-400 shrink-0" />
                      {user.email}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'department',
              title: 'Phòng ban',
              sortable: true,
              render: (user) => (
                <div>
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                    <Building2 size={14} className="text-gray-400 shrink-0" />
                    {user.departmentName}
                  </div>
                  <div className="text-sm text-gray-500">{user.position}</div>
                </div>
              ),
            },
            {
              key: 'role',
              title: 'Vai trò',
              sortable: true,
              render: (user) => (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200">
                  <Shield size={12} className="text-slate-500" />
                  {roleLabels[user.role] || user.role}
                </div>
              ),
            },
            {
              key: 'status',
              title: 'Trạng thái',
              sortable: true,
              render: (user) => (
                <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                  {canManage ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={user.isActive}
                      aria-label={user.isActive ? `Khóa ${user.fullName}` : `Bật ${user.fullName}`}
                      onClick={() => requestToggle(user)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                        user.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          user.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  ) : (
                    <span
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent opacity-60 ${
                        user.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                      aria-hidden
                    >
                      <span
                        className={`inline-block h-5 w-5 rounded-full bg-white shadow ${
                          user.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </span>
                  )}
                  <span
                    className={`text-xs font-medium ${
                      user.isActive ? 'text-emerald-700' : 'text-gray-500'
                    }`}
                  >
                    {user.isActive ? 'Hoạt động' : 'Khóa'}
                  </span>
                </div>
              ),
            },
            {
              key: 'actions',
              title: 'Thao tác',
              align: 'right',
              render: (user) => (
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  {canManage ? (
                    <>
                      <button
                        type="button"
                        onClick={() => requestResetPassword(user)}
                        className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Đặt lại mật khẩu"
                      >
                        <KeyRound size={16} strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(user)}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <Pencil size={16} strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteDialog({ id: user.id, name: user.fullName })}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={16} strokeWidth={1.75} />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 pr-1">Chỉ xem</span>
                  )}
                </div>
              ),
            },
          ] as Column<User>[]
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
        title={editingId ? 'Sửa người dùng' : 'Thêm người dùng'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Họ và tên" required>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={inputClass}
                required
              />
            </FormField>
            <FormField label="Email" required>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClass}
                required
              />
            </FormField>
            <FormField label="Số điện thoại">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={inputClass}
              />
            </FormField>
            <FormField label="Vai trò" required>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className={selectClass}
                required
              >
                {Object.entries(roleLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Phòng ban" required>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className={selectClass}
                required
              >
                <option value="">-- Chọn phòng ban --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Chức vụ">
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className={inputClass}
              />
            </FormField>
          </div>

          {/* Active / Inactive — cùng pattern switch admin web */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/80">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Trạng thái</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formData.isActive ? 'Đang hoạt động' : 'Đã khóa'}
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                role="switch"
                aria-checked={formData.isActive}
                aria-label={formData.isActive ? 'Đặt Inactive' : 'Đặt Active'}
                onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                  formData.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span
                className={`text-xs font-semibold min-w-[4.5rem] ${
                  formData.isActive ? 'text-emerald-700' : 'text-gray-500'
                }`}
              >
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
            >
              Lưu
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Xóa người dùng"
        message={`Xóa tài khoản "${deleteDialog?.name}"?`}
      />

      <ConfirmDialog
        isOpen={!!toggleDialog}
        onClose={() => setToggleDialog(null)}
        onConfirm={confirmToggle}
        title={toggleDialog?.nextActive ? 'Bật tài khoản' : 'Khóa tài khoản'}
        message={
          toggleDialog?.nextActive
            ? `Bật "${toggleDialog?.name}"? User có thể đăng nhập lại. Dashboard cập nhật theo isActive.`
            : `Tắt "${toggleDialog?.name}"? User không đăng nhập được. Dashboard cập nhật theo isActive.`
        }
        confirmLabel={toggleDialog?.nextActive ? 'Bật Active' : 'Tắt Inactive'}
        variant={toggleDialog?.nextActive ? 'warning' : 'danger'}
      />

      <Modal
        isOpen={!!resetDialog}
        onClose={() => setResetDialog(null)}
        title="Đặt lại mật khẩu"
        size="sm"
      >
        {resetDialog && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{resetDialog.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{resetDialog.email}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="reset-password" className="block text-sm font-semibold text-slate-800">
                Mật khẩu tạm
              </label>
              <input
                id="reset-password"
                type="text"
                value={resetDialog.password}
                onChange={(e) =>
                  setResetDialog((prev) =>
                    prev ? { ...prev, password: e.target.value } : prev
                  )
                }
                className={`${inputClass} font-mono text-[0.9375rem] font-semibold tracking-wide`}
                autoComplete="off"
                spellCheck={false}
                placeholder="Tạo hoặc nhập mật khẩu tạm"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={randomizeResetPassword}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  <Dices size={16} />
                  Tạo ngẫu nhiên
                </button>
                <button
                  type="button"
                  onClick={() => void copyResetPassword()}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  <Copy size={16} />
                  Sao chép
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sao chép mật khẩu và gửi cho người dùng. Họ nên đổi mật khẩu sau khi đăng nhập.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetDialog(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmResetPassword}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
              >
                <KeyRound size={15} />
                Xác nhận
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
