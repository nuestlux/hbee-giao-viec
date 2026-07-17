import { useState } from 'react';
import { FileText, Users, ClipboardList } from 'lucide-react';
import type {
  DocumentSourceKind,
  Field,
  Task,
  TaskCategory,
  UrgencyLevel,
  User,
  Department,
} from '../types';
import FormField, { inputClass, selectClass, textareaClass } from './FormField';
import ExpandableSection from './ExpandableSection';
import { DOCUMENT_SOURCE_KIND_LABELS, URGENCY_LABELS } from '../utils/ui-labels';
import {
  PROGRESS_LEVELS,
  snapProgressToLevel,
  type ProgressLevelValue,
} from '../utils/progress-levels';

export type TaskFormSectionKey = 'content' | 'assignment' | 'extra';

export type TaskFormFieldsProps = {
  value: Partial<Task>;
  onChange: (next: Partial<Task>) => void;
  departments: Department[];
  users: User[];
  taskCategories: TaskCategory[];
  fields: Field[];
  readOnly?: boolean;
  /** Khóa field meta; vẫn cho sửa tiến độ nếu showProgressSelect */
  metaReadOnly?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showProgressSelect?: boolean;
  /** @deprecated use sectionsDefaultOpen */
  extraDefaultOpen?: boolean;
  showExtra?: boolean;
  /** Per-section default open (all true by default) */
  sectionsDefaultOpen?: Partial<Record<TaskFormSectionKey, boolean>>;
  /** Controlled section open map */
  sectionOpen?: Partial<Record<TaskFormSectionKey, boolean>>;
  onSectionOpenChange?: (key: TaskFormSectionKey, open: boolean) => void;
  /** Show Mở tất cả / Thu tất cả */
  showExpandToolbar?: boolean;
};

const DEFAULT_SECTION_OPEN: Record<TaskFormSectionKey, boolean> = {
  content: true,
  assignment: true,
  extra: true,
};

export default function TaskFormFields({
  value,
  onChange,
  departments,
  users,
  taskCategories,
  fields,
  readOnly = false,
  metaReadOnly = false,
  showTitle = true,
  showDescription = true,
  showProgressSelect = false,
  extraDefaultOpen = false,
  showExtra = true,
  sectionsDefaultOpen,
  sectionOpen: sectionOpenProp,
  onSectionOpenChange,
  showExpandToolbar = false,
}: TaskFormFieldsProps) {
  const defaults: Record<TaskFormSectionKey, boolean> = {
    ...DEFAULT_SECTION_OPEN,
    extra: sectionsDefaultOpen?.extra ?? extraDefaultOpen,
    content: sectionsDefaultOpen?.content ?? true,
    assignment: sectionsDefaultOpen?.assignment ?? true,
  };

  const [localOpen, setLocalOpen] = useState(defaults);
  const controlled = Boolean(sectionOpenProp && onSectionOpenChange);

  const isOpen = (key: TaskFormSectionKey) =>
    controlled ? Boolean(sectionOpenProp?.[key] ?? defaults[key]) : localOpen[key];

  const setOpen = (key: TaskFormSectionKey, open: boolean) => {
    if (controlled) onSectionOpenChange?.(key, open);
    else setLocalOpen((s) => ({ ...s, [key]: open }));
  };

  const setAll = (open: boolean) => {
    (Object.keys(DEFAULT_SECTION_OPEN) as TaskFormSectionKey[]).forEach((k) => {
      if (k === 'extra' && !showExtra) return;
      if (k === 'content' && !showDescription && !showTitle) return;
      setOpen(k, open);
    });
  };

  const metaDisabled = readOnly || metaReadOnly;
  const progressDisabled = readOnly;
  const fieldCls = metaDisabled ? `${inputClass} bg-slate-50 text-slate-700` : inputClass;
  const selCls = metaDisabled ? `${selectClass} bg-slate-50 text-slate-700` : selectClass;
  const areaCls = metaDisabled ? `${textareaClass} bg-slate-50 text-slate-700` : textareaClass;
  const progressSelCls = progressDisabled
    ? `${selectClass} bg-slate-50 text-slate-700`
    : selectClass;

  const patch = (p: Partial<Task>) => onChange({ ...value, ...p });

  const setApproverFromUserId = (userId: string) => {
    if (!userId) {
      patch({
        approverUserId: null,
        approverName: '',
        approverEmail: '',
        approverPhone: '',
      });
      return;
    }
    const u = users.find((x) => x.id === userId);
    patch({
      approverUserId: u?.id || null,
      approverName: u?.fullName || '',
      approverEmail: u?.email || '',
      approverPhone: u?.phone || '',
    });
  };

  const deptName =
    departments.find((d) => d.id === value.assignedDepartmentId)?.name || '';
  const assigneeName =
    users.find((u) => u.id === value.assigneeId)?.fullName || '';
  const urgencyLabel = URGENCY_LABELS[(value.urgency || 'THUONG') as UrgencyLevel] || '';

  const contentSummary =
    (value.description || '').trim().slice(0, 80) ||
    (showTitle ? value.title || 'Chưa có mô tả' : 'Chưa có mô tả');
  const assignmentSummary = [deptName, assigneeName, urgencyLabel, value.dueDate]
    .filter(Boolean)
    .join(' · ') || 'Chưa phân công';
  const extraSummary = [
    value.chairLeaderName,
    value.sourceCitation,
    value.approverName,
  ]
    .filter(Boolean)
    .join(' · ') || 'Thông tin báo cáo';

  return (
    <div className="space-y-3">
      {showExpandToolbar && !readOnly && (
        <div className="flex justify-end gap-3 text-xs">
          <button
            type="button"
            onClick={() => setAll(true)}
            className="font-medium text-primary-600 hover:underline"
          >
            Mở hết
          </button>
          <button
            type="button"
            onClick={() => setAll(false)}
            className="font-medium text-slate-500 hover:underline"
          >
            Thu hết
          </button>
        </div>
      )}

      {(showTitle || showDescription) && (
        <ExpandableSection
          title="Nội dung"
          icon={<FileText size={16} />}
          open={isOpen('content')}
          onOpenChange={(o) => setOpen('content', o)}
          summary={contentSummary}
          compact
        >
          {showTitle && (
            <FormField label="Tên việc" required>
              <input
                type="text"
                value={value.title || ''}
                onChange={(e) => patch({ title: e.target.value })}
                className={fieldCls}
                placeholder="Việc cần làm là gì?"
                required
                disabled={metaDisabled}
              />
            </FormField>
          )}
          {showDescription && (
            <FormField label="Mô tả">
              <textarea
                value={value.description || ''}
                onChange={(e) => patch({ description: e.target.value })}
                className={areaCls}
                rows={4}
                placeholder="Chi tiết (tuỳ chọn)"
                disabled={metaDisabled}
              />
            </FormField>
          )}
        </ExpandableSection>
      )}

      <ExpandableSection
        title="Phân công"
        icon={<Users size={16} />}
        open={isOpen('assignment')}
        onOpenChange={(o) => setOpen('assignment', o)}
        summary={assignmentSummary}
        compact
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Phòng chủ trì" required>
            <select
              value={value.assignedDepartmentId || ''}
              onChange={(e) => {
                const leadId = e.target.value;
                const coord = (value.coordinatingDepartments || []).filter((id) => id !== leadId);
                patch({
                  assignedDepartmentId: leadId,
                  assigneeId: '',
                  coordinatingDepartments: coord,
                });
              }}
              className={selCls}
              required
              disabled={metaDisabled}
            >
              <option value="">Chọn phòng</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Người làm">
            <select
              value={value.assigneeId || ''}
              onChange={(e) => patch({ assigneeId: e.target.value })}
              className={selCls}
              disabled={metaDisabled}
            >
              <option value="">Chưa giao người</option>
              {users
                .filter((u) => u.departmentId === value.assignedDepartmentId && u.isActive)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
            </select>
          </FormField>

          <FormField label="Đơn vị phối hợp" className="md:col-span-2">
            <div
              className={`rounded-xl border border-gray-200 p-3 max-h-40 overflow-y-auto space-y-2 ${
                metaDisabled ? 'bg-slate-50' : 'bg-white'
              }`}
            >
              {departments
                .filter((d) => d.isActive !== false && d.id !== value.assignedDepartmentId)
                .map((d) => {
                  const selected = (value.coordinatingDepartments || []).includes(d.id);
                  return (
                    <label
                      key={d.id}
                      className={`flex items-center gap-2 text-sm ${
                        metaDisabled ? 'text-slate-600 cursor-default' : 'text-slate-800 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        checked={selected}
                        disabled={metaDisabled}
                        onChange={() => {
                          if (metaDisabled) return;
                          const cur = value.coordinatingDepartments || [];
                          const next = selected
                            ? cur.filter((id) => id !== d.id)
                            : [...cur, d.id];
                          patch({ coordinatingDepartments: next });
                        }}
                      />
                      <span>{d.name}</span>
                    </label>
                  );
                })}
              {departments.filter(
                (d) => d.isActive !== false && d.id !== value.assignedDepartmentId,
              ).length === 0 && (
                <p className="text-xs text-slate-500">Không còn phòng khác để phối hợp.</p>
              )}
            </div>
            {(value.coordinatingDepartments || []).length > 0 && (
              <p className="mt-1.5 text-xs text-slate-500">
                Đã chọn:{' '}
                {(value.coordinatingDepartments || [])
                  .map((id) => departments.find((d) => d.id === id)?.name || id)
                  .join('; ')}
              </p>
            )}
          </FormField>

          <FormField label="Loại việc" required>
            <select
              value={value.categoryId || ''}
              onChange={(e) => patch({ categoryId: e.target.value })}
              className={selCls}
              required
              disabled={metaDisabled}
            >
              <option value="">Chọn loại</option>
              {taskCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Lĩnh vực">
            <select
              value={value.fieldId || ''}
              onChange={(e) => patch({ fieldId: e.target.value })}
              className={selCls}
              disabled={metaDisabled}
            >
              <option value="">Không chọn</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Mức độ khẩn">
            <select
              value={value.urgency || 'THUONG'}
              onChange={(e) => patch({ urgency: e.target.value as UrgencyLevel })}
              className={selCls}
              disabled={metaDisabled}
            >
              <option value="THUONG">{URGENCY_LABELS.THUONG}</option>
              <option value="KHAN">{URGENCY_LABELS.KHAN}</option>
              <option value="THUONG_KHAN">{URGENCY_LABELS.THUONG_KHAN}</option>
            </select>
          </FormField>

          <FormField label="Ngày bắt đầu">
            <input
              type="date"
              value={value.startDate || ''}
              onChange={(e) => patch({ startDate: e.target.value })}
              className={fieldCls}
              disabled={metaDisabled}
            />
          </FormField>

          <FormField label="Hạn hoàn thành" required>
            <input
              type="date"
              value={value.dueDate || ''}
              onChange={(e) => patch({ dueDate: e.target.value })}
              className={fieldCls}
              required
              disabled={metaDisabled}
            />
          </FormField>

          {showProgressSelect && (
            <FormField label="Tiến độ" required>
              <select
                value={snapProgressToLevel(value.progress ?? 0)}
                onChange={(e) =>
                  patch({ progress: Number(e.target.value) as ProgressLevelValue })
                }
                className={progressSelCls}
                disabled={progressDisabled}
              >
                {PROGRESS_LEVELS.map((lv) => (
                  <option key={lv.value} value={lv.value}>
                    {lv.label}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </div>
      </ExpandableSection>

      {showExtra && (
        <ExpandableSection
          title="Thông tin báo cáo"
          icon={<ClipboardList size={16} />}
          open={isOpen('extra')}
          onOpenChange={(o) => setOpen('extra', o)}
          summary={extraSummary}
          compact
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Lãnh đạo chủ trì">
              <input
                type="text"
                value={value.chairLeaderName || ''}
                onChange={(e) => patch({ chairLeaderName: e.target.value })}
                className={fieldCls}
                placeholder="Họ tên"
                disabled={metaDisabled}
              />
            </FormField>
            <FormField label="Mã ngoài (nếu có)">
              <input
                type="text"
                value={value.externalTaskId || ''}
                onChange={(e) => patch({ externalTaskId: e.target.value })}
                className={fieldCls}
                placeholder="Mã trên hệ thống khác"
                disabled={metaDisabled}
              />
            </FormField>
          </div>
          <FormField label="Đầu mối">
            <textarea
              value={value.focalPointText || ''}
              onChange={(e) => patch({ focalPointText: e.target.value })}
              className={areaCls}
              rows={2}
              placeholder="Tổ / nhóm / người liên hệ"
              disabled={metaDisabled}
            />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nguồn việc">
              <select
                value={value.sourceKind || ''}
                onChange={(e) =>
                  patch({
                    sourceKind: (e.target.value || null) as DocumentSourceKind | null,
                  })
                }
                className={selCls}
                disabled={metaDisabled}
              >
                <option value="">Không chọn</option>
                {(Object.keys(DOCUMENT_SOURCE_KIND_LABELS) as DocumentSourceKind[]).map((k) => (
                  <option key={k} value={k}>
                    {DOCUMENT_SOURCE_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Số / trích nguồn">
              <input
                type="text"
                value={value.sourceCitation || ''}
                onChange={(e) => patch({ sourceCitation: e.target.value })}
                className={fieldCls}
                placeholder="VD: CV-1245/UBND-TB"
                disabled={metaDisabled}
              />
            </FormField>
          </div>
          <FormField label="Kết quả">
            <textarea
              value={value.executionResult || ''}
              onChange={(e) => patch({ executionResult: e.target.value })}
              className={areaCls}
              rows={2}
              placeholder="Đã làm được gì"
              disabled={metaDisabled}
            />
          </FormField>
          <FormField label="Lộ trình">
            <textarea
              value={value.roadmap || ''}
              onChange={(e) => patch({ roadmap: e.target.value })}
              className={areaCls}
              rows={2}
              placeholder="Các bước dự kiến"
              disabled={metaDisabled}
            />
          </FormField>
          <FormField label="Người duyệt">
            <select
              value={value.approverUserId || ''}
              onChange={(e) => setApproverFromUserId(e.target.value)}
              className={selCls}
              disabled={metaDisabled}
            >
              <option value="">Chưa chọn</option>
              {users
                .filter((u) => u.isActive)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} · {u.departmentName || u.position || u.email}
                  </option>
                ))}
            </select>
            {value.approverUserId && (
              <p className="mt-1.5 text-xs text-slate-500">
                {value.approverEmail || '—'}
                {value.approverPhone ? ` · ${value.approverPhone}` : ''}
              </p>
            )}
          </FormField>
        </ExpandableSection>
      )}
    </div>
  );
}
