import { X } from 'lucide-react';
import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/** Full-screen centered popup (portaled to body, above sidebar). */
export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }[size];

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative ${sizeClass} w-full bg-white rounded-2xl shadow-2xl animate-scale-in max-h-[min(90vh,880px)] flex flex-col`}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 sm:px-7 sm:py-5 border-b border-gray-100 shrink-0">
          <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug pr-2">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 min-h-11 min-w-11 rounded-xl hover:bg-gray-100 transition-colors text-slate-400 hover:text-slate-600 inline-flex items-center justify-center shrink-0"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 sm:p-7 flex-1 min-h-0 text-[0.9375rem] leading-relaxed text-slate-700">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
