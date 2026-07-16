import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Users,
  Search,
  KeyRound,
  Layers,
  ChevronDown,
  ChevronRight,
  Copy,
  Filter,
  LayoutGrid,
  ListTree,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Modal, FormField, inputClass, textareaClass, ConfirmDialog } from '../../components';
import type { Role } from '../../types';

type ViewMode = 'detail' | 'matrix';

const ROLE_ACCENT: Record<string, { bar: string; soft: string; text: string; ring: string }> = {
  CHAIRMAN: {
    bar: 'bg-rose-500',
    soft: 'bg-rose-50 text-rose-700',
    text: 'text-rose-600',
    ring: 'ring-rose-200',
  },
  DEPT_HEAD: {
    bar: 'bg-primary-500',
    soft: 'bg-primary-50 text-primary-700',
    text: 'text-primary-600',
    ring: 'ring-primary-200',
  },
  DEPT_DEPUTY: {
    bar: 'bg-sky-500',
    soft: 'bg-sky-50 text-sky-700',
    text: 'text-sky-600',
    ring: 'ring-sky-200',
  },
  SPECIALIST: {
    bar: 'bg-emerald-500',
    soft: 'bg-emerald-50 text-emerald-700',
    text: 'text-emerald-600',
    ring: 'ring-emerald-200',
  },
  CLERK: {
    bar: 'bg-amber-500',
    soft: 'bg-amber-50 text-amber-700',
    text: 'text-amber-600',
    ring: 'ring-amber-200',
  },
  ADMIN: {
    bar: 'bg-violet-500',
    soft: 'bg-violet-50 text-violet-700',
    text: 'text-violet-600',
    ring: 'ring-violet-200',
  },
};

function roleAccent(code: string) {
  return (
    ROLE_ACCENT[code] || {
      bar: 'bg-slate-400',
      soft: 'bg-slate-100 text-slate-700',
      text: 'text-slate-600',
      ring: 'ring-slate-200',
    }
  );
}

/** Role.permissions stores permission codes (e.g. task.create), not ids. */
function roleHasPermission(role: Role, permCode: string) {
  return role.permissions.includes(permCode);
}

export default function Roles() {
  const { roles, permissions, addRole, updateRole, deleteRole } = useStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [roleQuery, setRoleQuery] = useState('');
  const [permQuery, setPermQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('detail');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    permissions: [] as string[],
  });
  const [modalPermQuery, setModalPermQuery] = useState('');

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const modules = useMemo(
    () => Array.from(new Set(permissions.map((p) => p.module))),
    [permissions],
  );

  const permsByModule = useMemo(
    () =>
      modules.map((module) => ({
        module,
        perms: permissions.filter((p) => p.module === module),
      })),
    [modules, permissions],
  );

  // Expand all modules by default
  useEffect(() => {
    setExpandedModules((prev) => {
      const next = { ...prev };
      modules.forEach((m) => {
        if (next[m] === undefined) next[m] = true;
      });
      return next;
    });
  }, [modules]);

  const filteredRoles = useMemo(() => {
    const q = roleQuery.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [roles, roleQuery]);

  // Keep selection valid
  useEffect(() => {
    if (!roles.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !roles.some((r) => r.id === selectedId)) {
      setSelectedId(roles[0].id);
    }
  }, [roles, selectedId]);

  const selectedRole = roles.find((r) => r.id === selectedId) || null;

  const filteredPermsByModule = useMemo(() => {
    const q = permQuery.trim().toLowerCase();
    return permsByModule
      .map(({ module, perms }) => ({
        module,
        perms: q
          ? perms.filter(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                p.code.toLowerCase().includes(q) ||
                module.toLowerCase().includes(q),
            )
          : perms,
      }))
      .filter((g) => g.perms.length > 0);
  }, [permsByModule, permQuery]);

  const totalUsers = roles.reduce((s, r) => s + r.userCount, 0);
  const totalPerms = permissions.length;

  const selectedCoverage = selectedRole
    ? Math.round((selectedRole.permissions.length / Math.max(totalPerms, 1)) * 100)
    : 0;

  const handleOpenModal = (role?: Role) => {
    setModalPermQuery('');
    if (role) {
      setEditingId(role.id);
      setFormData({
        name: role.name,
        code: role.code,
        description: role.description,
        permissions: [...role.permissions],
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', code: '', description: '', permissions: [] });
    }
    setIsModalOpen(true);
  };

  const handleDuplicate = (role: Role) => {
    setEditingId(null);
    setModalPermQuery('');
    setFormData({
      name: `${role.name} (bản sao)`,
      code: `${role.code}_COPY`,
      description: role.description,
      permissions: [...role.permissions],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;
    if (editingId) {
      updateRole(editingId, formData);
      showToast('Cập nhật vai trò thành công');
    } else {
      addRole(formData);
      showToast('Đã tạo vai trò mới');
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteDialog) return;
    deleteRole(deleteDialog.id);
    if (selectedId === deleteDialog.id) setSelectedId(null);
    setDeleteDialog(null);
    showToast('Đã xóa vai trò');
  };

  const togglePermission = (permCode: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permCode)
        ? prev.permissions.filter((c) => c !== permCode)
        : [...prev.permissions, permCode],
    }));
  };

  const toggleModuleAll = (modulePermCodes: string[], select: boolean) => {
    setFormData((prev) => {
      if (select) {
        const set = new Set([...prev.permissions, ...modulePermCodes]);
        return { ...prev, permissions: Array.from(set) };
      }
      return {
        ...prev,
        permissions: prev.permissions.filter((c) => !modulePermCodes.includes(c)),
      };
    });
  };

  const toggleExpand = (module: string) => {
    setExpandedModules((prev) => ({ ...prev, [module]: !prev[module] }));
  };

  const modalPermsByModule = useMemo(() => {
    const q = modalPermQuery.trim().toLowerCase();
    return permsByModule
      .map(({ module, perms }) => ({
        module,
        perms: q
          ? perms.filter(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                p.code.toLowerCase().includes(q) ||
                module.toLowerCase().includes(q),
            )
          : perms,
      }))
      .filter((g) => g.perms.length > 0);
  }, [permsByModule, modalPermQuery]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-slide-in-right text-[0.9375rem]">
          <Check size={18} className="shrink-0" />
          {toastMessage}
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
          Vai trò & quyền
        </h1>
        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-sm shadow-primary-600/20 font-semibold text-[0.9375rem] shrink-0"
        >
          <Plus size={18} />
          Tạo vai trò
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Vai trò',
            value: roles.length,
            icon: Shield,
            tone: 'bg-primary-50 text-primary-600',
          },
          {
            label: 'Quyền',
            value: totalPerms,
            icon: KeyRound,
            tone: 'bg-violet-50 text-violet-600',
          },
          {
            label: 'Module',
            value: modules.length,
            icon: Layers,
            tone: 'bg-sky-50 text-sky-600',
          },
          {
            label: 'Người dùng',
            value: totalUsers,
            icon: Users,
            tone: 'bg-emerald-50 text-emerald-600',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-sm flex items-center gap-3.5"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${kpi.tone}`}>
              <kpi.icon size={20} strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-[0.8125rem] text-slate-500 font-medium leading-snug">{kpi.label}</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight leading-none mt-1">
                {kpi.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start">
          <button
            type="button"
            onClick={() => setViewMode('detail')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors min-h-10 ${
              viewMode === 'detail'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ListTree size={16} />
            Chi tiết
          </button>
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors min-h-10 ${
              viewMode === 'matrix'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid size={16} />
            Ma trận
          </button>
        </div>
      </div>

      {viewMode === 'detail' ? (
        /* ── Master–detail (ERP standard) ── */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 min-h-[520px]">
          {/* Left: role list */}
          <aside className="xl:col-span-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Vai trò
                </h2>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md tabular-nums">
                  {filteredRoles.length}
                </span>
              </div>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="search"
                  value={roleQuery}
                  onChange={(e) => setRoleQuery(e.target.value)}
                  placeholder="Tìm vai trò..."
                  className="w-full min-h-10 pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 focus:bg-white"
                />
              </div>
            </div>

            <ul className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar max-h-[min(62vh,640px)]">
              {filteredRoles.length === 0 ? (
                <li className="px-3 py-10 text-center text-sm text-slate-400">Không tìm thấy vai trò</li>
              ) : (
                filteredRoles.map((role) => {
                  const accent = roleAccent(role.code);
                  const active = role.id === selectedId;
                  const coverage = Math.round(
                    (role.permissions.length / Math.max(totalPerms, 1)) * 100,
                  );
                  return (
                    <li key={role.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(role.id)}
                        className={`w-full text-left rounded-xl border transition-all duration-150 px-3 py-3 min-h-[4.25rem] ${
                          active
                            ? `bg-primary-50/80 border-primary-200 shadow-sm ring-1 ${accent.ring}`
                            : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-1 self-stretch rounded-full shrink-0 ${accent.bar}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p
                                className={`font-semibold text-[0.9375rem] leading-snug truncate ${
                                  active ? 'text-primary-900' : 'text-slate-900'
                                }`}
                              >
                                {role.name}
                              </p>
                            </div>
                            <p className="text-xs font-mono text-slate-500 mt-0.5">{role.code}</p>
                            <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <Users size={12} />
                                {role.userCount}
                              </span>
                              <span className="inline-flex items-center gap-1 tabular-nums">
                                <KeyRound size={12} />
                                {role.permissions.length}/{totalPerms}
                              </span>
                              <span className="ml-auto font-semibold tabular-nums text-slate-600">
                                {coverage}%
                              </span>
                            </div>
                            <div className="mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${accent.bar} transition-all`}
                                style={{ width: `${coverage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </aside>

          {/* Right: role detail */}
          <section className="xl:col-span-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[480px]">
            {!selectedRole ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10">
                <Shield size={40} className="mb-3 opacity-40" />
                <p className="text-[0.9375rem]">Chọn vai trò</p>
              </div>
            ) : (
              <>
                {/* Detail header */}
                <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${roleAccent(selectedRole.code).soft}`}
                      >
                        <Shield size={24} strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug truncate">
                          {selectedRole.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {selectedRole.code}
                          </span>
                          <span className="text-sm text-slate-500">
                            {selectedRole.userCount} người dùng · {selectedRole.permissions.length}{' '}
                            quyền
                          </span>
                        </div>
                        {selectedRole.description && (
                          <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-xl">
                            {selectedRole.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDuplicate(selectedRole)}
                        className="inline-flex items-center gap-1.5 min-h-10 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Copy size={15} />
                        Nhân bản
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(selectedRole)}
                        className="inline-flex items-center gap-1.5 min-h-10 px-3 py-2 rounded-xl border border-primary-200 bg-primary-50 text-sm font-semibold text-primary-700 hover:bg-primary-100"
                      >
                        <Pencil size={15} />
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteDialog({
                            isOpen: true,
                            id: selectedRole.id,
                            name: selectedRole.name,
                          })
                        }
                        className="inline-flex items-center gap-1.5 min-h-10 px-3 py-2 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50"
                        disabled={selectedRole.userCount > 0}
                        title={
                          selectedRole.userCount > 0
                            ? 'Vai trò đang có người dùng'
                            : 'Xóa'
                        }
                      >
                        <Trash2 size={15} />
                        Xóa
                      </button>
                    </div>
                  </div>

                  {/* Coverage bar */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-slate-600">Phủ quyền</span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {selectedCoverage}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${roleAccent(selectedRole.code).bar}`}
                        style={{ width: `${selectedCoverage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Permission modules */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <KeyRound size={15} className="text-slate-400" />
                    Quyền
                  </h3>
                  <div className="relative w-full sm:w-72">
                    <Filter
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="search"
                      value={permQuery}
                      onChange={(e) => setPermQuery(e.target.value)}
                      placeholder="Lọc quyền..."
                      className="w-full min-h-10 pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar max-h-[min(58vh,560px)]">
                  {filteredPermsByModule.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-12">Không có quyền khớp bộ lọc</p>
                  ) : (
                    filteredPermsByModule.map(({ module, perms }) => {
                      const granted = perms.filter((p) =>
                        roleHasPermission(selectedRole, p.code),
                      ).length;
                      const open = expandedModules[module] !== false;
                      return (
                        <div
                          key={module}
                          className="border border-slate-200 rounded-xl overflow-hidden bg-white"
                        >
                          <button
                            type="button"
                            onClick={() => toggleExpand(module)}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50/90 hover:bg-slate-50 text-left min-h-12"
                          >
                            {open ? (
                              <ChevronDown size={16} className="text-slate-400 shrink-0" />
                            ) : (
                              <ChevronRight size={16} className="text-slate-400 shrink-0" />
                            )}
                            <Layers size={16} className="text-primary-500 shrink-0" />
                            <span className="font-semibold text-slate-800 text-[0.9375rem]">
                              {module}
                            </span>
                            <span className="ml-auto text-xs font-semibold tabular-nums text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              {granted}/{perms.length}
                            </span>
                          </button>
                          {open && (
                            <ul className="divide-y divide-slate-100">
                              {perms.map((perm) => {
                                const has = roleHasPermission(selectedRole, perm.code);
                                return (
                                  <li
                                    key={perm.id}
                                    className="flex items-center gap-3 px-4 py-3 sm:pl-12 hover:bg-slate-50/50"
                                  >
                                    <span
                                      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${
                                        has
                                          ? 'bg-emerald-50 text-emerald-600'
                                          : 'bg-slate-100 text-slate-300'
                                      }`}
                                    >
                                      {has ? <Check size={15} strokeWidth={2.5} /> : <X size={15} />}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p
                                        className={`text-sm font-medium leading-snug ${
                                          has ? 'text-slate-900' : 'text-slate-500'
                                        }`}
                                      >
                                        {perm.name}
                                      </p>
                                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                                        {perm.code}
                                      </p>
                                    </div>
                                    <span
                                      className={`text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                                        has
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : 'bg-slate-50 text-slate-400'
                                      }`}
                                    >
                                      {has ? 'Có' : 'Không'}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      ) : (
        /* ── Comparison matrix ── */
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between bg-slate-50/50">
            <h2 className="text-base font-bold text-slate-900">Ma trận quyền</h2>
            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="search"
                value={permQuery}
                onChange={(e) => setPermQuery(e.target.value)}
                placeholder="Lọc quyền..."
                className="w-full min-h-10 pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3.5 text-left text-[0.8125rem] font-semibold text-slate-600 w-64 border-r border-slate-200">
                    Quyền / Vai trò
                  </th>
                  {roles.map((role) => {
                    const accent = roleAccent(role.code);
                    return (
                      <th
                        key={role.id}
                        className="px-3 py-3.5 text-center min-w-[7.5rem] border-l border-slate-100 bg-white"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(role.id);
                            setViewMode('detail');
                          }}
                          className="w-full group"
                          title="Xem chi tiết"
                        >
                          <div
                            className={`mx-auto w-8 h-1 rounded-full mb-2 ${accent.bar} opacity-80`}
                          />
                          <span className="block text-[0.8125rem] font-semibold text-slate-800 leading-snug group-hover:text-primary-700">
                            {role.name}
                          </span>
                          <span className="block text-[11px] font-mono text-slate-400 mt-0.5">
                            {role.code}
                          </span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredPermsByModule.map(({ module, perms }) => (
                  <FragmentModule key={module} module={module} colSpan={roles.length + 1}>
                    {perms.map((perm, rowIdx) => (
                      <tr
                        key={perm.id}
                        className={`border-b border-slate-100 hover:bg-primary-50/30 transition-colors ${
                          rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                        }`}
                      >
                        <td className="sticky left-0 z-10 bg-inherit px-4 py-3 border-r border-slate-100 shadow-[2px_0_6px_-3px_rgba(15,23,42,0.06)]">
                          <p className="text-sm font-medium text-slate-800 leading-snug">
                            {perm.name}
                          </p>
                          <p className="text-xs font-mono text-slate-400 mt-0.5">{perm.code}</p>
                        </td>
                        {roles.map((role) => {
                          const has = roleHasPermission(role, perm.code);
                          return (
                            <td
                              key={role.id}
                              className="px-3 py-3 text-center border-l border-slate-50"
                            >
                              <span
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg mx-auto ${
                                  has
                                    ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
                                    : 'bg-slate-50 text-slate-300'
                                }`}
                                title={has ? 'Được cấp' : 'Không có'}
                              >
                                {has ? (
                                  <Check size={16} strokeWidth={2.5} />
                                ) : (
                                  <X size={14} strokeWidth={2} />
                                )}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </FragmentModule>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit modal — ERP permission picker */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Sửa vai trò' : 'Tạo vai trò'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Tên vai trò" required>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
                placeholder="Trưởng phòng"
                required
              />
            </FormField>
            <FormField label="Mã vai trò (code)" required>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })
                }
                className={`${inputClass} font-mono`}
                placeholder="DEPT_HEAD"
                required
              />
            </FormField>
          </div>
          <FormField label="Mô tả">
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={textareaClass}
              rows={2}
              placeholder="Mô tả ngắn (tuỳ chọn)"
            />
          </FormField>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-bold text-slate-800">Quyền</h3>
                <span className="text-xs text-slate-500 tabular-nums">
                  <span className="font-semibold text-primary-700">
                    {formData.permissions.length}
                  </span>
                  /{totalPerms}
                </span>
              </div>
              <div className="relative w-full sm:w-56">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={modalPermQuery}
                  onChange={(e) => setModalPermQuery(e.target.value)}
                  placeholder="Tìm quyền..."
                  className="w-full min-h-9 pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="max-h-[min(42vh,380px)] overflow-y-auto custom-scrollbar">
              {modalPermsByModule.map(({ module, perms }) => {
                const codes = perms.map((p) => p.code);
                const selectedCount = codes.filter((c) => formData.permissions.includes(c)).length;
                const allSelected = selectedCount === codes.length && codes.length > 0;
                const someSelected = selectedCount > 0 && !allSelected;

                return (
                  <div key={module} className="border-b border-slate-100 last:border-0">
                    <div className="sticky top-0 z-[1] flex items-center gap-3 px-4 py-2.5 bg-slate-50/95 backdrop-blur border-b border-slate-100">
                      <label className="inline-flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected;
                          }}
                          onChange={() => toggleModuleAll(codes, !allSelected)}
                          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500/40"
                        />
                        <span className="text-sm font-bold text-slate-700 truncate">{module}</span>
                      </label>
                      <span className="text-xs font-semibold tabular-nums text-slate-500 shrink-0">
                        {selectedCount}/{codes.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:[&>*:nth-child(odd)]:border-r md:[&>*]:border-slate-100">
                      {perms.map((perm) => {
                        const checked = formData.permissions.includes(perm.code);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                              checked ? 'bg-primary-50/40' : 'hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(perm.code)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500/40"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-slate-900 leading-snug">
                                {perm.name}
                              </span>
                              <span className="block text-xs font-mono text-slate-400 mt-0.5">
                                {perm.code}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="min-h-11 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="min-h-11 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm"
            >
              {editingId ? 'Lưu' : 'Tạo'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Xóa vai trò"
        message={`Xóa vai trò "${deleteDialog?.name}"?`}
      />
    </div>
  );
}

/** Module group header row for matrix table */
function FragmentModule({
  module,
  colSpan,
  children,
}: {
  module: string;
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <>
      <tr className="bg-slate-100/90 border-y border-slate-200">
        <td
          colSpan={colSpan}
          className="sticky left-0 px-4 py-2 text-[0.75rem] font-bold uppercase tracking-wider text-slate-500"
        >
          <span className="inline-flex items-center gap-1.5">
            <Layers size={12} />
            {module}
          </span>
        </td>
      </tr>
      {children}
    </>
  );
}
