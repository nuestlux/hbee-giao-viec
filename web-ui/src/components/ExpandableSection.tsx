import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export type ExpandableSectionProps = {
  title: string;
  icon?: ReactNode;
  /** Uncontrolled default when `open` not provided */
  defaultOpen?: boolean;
  /** Controlled open */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hint when collapsed */
  summary?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  compact?: boolean;
};

/**
 * Card section with expand / collapse. Pass `open` + `onOpenChange` for controlled
 * multi-section expand-all; otherwise uses `defaultOpen`.
 */
export default function ExpandableSection({
  title,
  icon,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  summary,
  badge,
  children,
  className = '',
  compact = false,
}: ExpandableSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? Boolean(openProp) : internalOpen;

  const toggle = () => {
    const next = !open;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <section
      className={`glass rounded-xl border border-gray-100 overflow-hidden ${className}`.trim()}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={`w-full flex items-center gap-2 text-left hover:bg-slate-50/80 transition-colors ${
          compact ? 'px-3 py-2.5' : 'px-4 py-3'
        }`}
      >
        {icon && <span className="shrink-0 text-primary-600">{icon}</span>}
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{title}</span>
            {badge}
          </span>
          {!open && summary != null && summary !== '' && (
            <span className="block text-xs text-slate-500 mt-0.5 truncate">{summary}</span>
          )}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && (
        <div
          className={`border-t border-gray-100 ${compact ? 'px-3 py-3' : 'px-4 py-4'} space-y-3`}
        >
          {children}
        </div>
      )}
    </section>
  );
}
