import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}

export default function FormField({ label, required, error, children, className = '' }: FormFieldProps) {
  return (
    <div className={`mb-5 ${className}`}>
      <label className="block text-sm font-semibold text-slate-700 mb-2 leading-snug">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600 mt-1.5 leading-snug" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Min height ~44px touch targets; 15–16px type for readability
export const inputClass =
  'w-full min-h-11 px-3.5 py-2.5 border border-gray-300 rounded-xl text-[0.9375rem] leading-normal text-slate-900 focus:ring-2 focus:ring-primary-500/35 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400';

export const selectClass =
  'w-full min-h-11 px-3.5 py-2.5 border border-gray-300 rounded-xl text-[0.9375rem] leading-normal text-slate-900 bg-white focus:ring-2 focus:ring-primary-500/35 focus:border-primary-500 outline-none transition-all';

export const textareaClass =
  'w-full min-h-[6.5rem] px-3.5 py-2.5 border border-gray-300 rounded-xl text-[0.9375rem] leading-relaxed text-slate-900 focus:ring-2 focus:ring-primary-500/35 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 resize-y';
