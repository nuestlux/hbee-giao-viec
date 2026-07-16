import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import FormField, { inputClass } from './FormField';

type Props = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function ChangePasswordForm({ onSuccess, onCancel }: Props) {
  const changePassword = useStore((s) => s.changePassword);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 200));
    const result = changePassword(current, next, confirm);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setCurrent('');
    setNext('');
    setConfirm('');
    setTimeout(() => onSuccess?.(), 800);
  };

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-8 text-center">
        <p className="text-sm font-semibold text-emerald-800">Đổi mật khẩu thành công</p>
        <p className="text-xs text-emerald-700 mt-1">Lần đăng nhập sau dùng mật khẩu mới.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1" autoComplete="off">
      <FormField label="Mật khẩu hiện tại" required>
        <div className="relative">
          <input
            type={showCurrent ? 'text' : 'password'}
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value);
              setError('');
            }}
            className={`${inputClass} pr-10`}
            required
            autoComplete="current-password"
            placeholder="Mật khẩu đang dùng"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showCurrent ? 'Ẩn' : 'Hiện'}
          >
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </FormField>

      <FormField label="Mật khẩu mới" required>
        <div className="relative">
          <input
            type={showNext ? 'text' : 'password'}
            value={next}
            onChange={(e) => {
              setNext(e.target.value);
              setError('');
            }}
            className={`${inputClass} pr-10`}
            required
            autoComplete="new-password"
            placeholder="Mật khẩu mới"
          />
          <button
            type="button"
            onClick={() => setShowNext((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showNext ? 'Ẩn' : 'Hiện'}
          >
            {showNext ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </FormField>

      <FormField label="Xác nhận mật khẩu mới" required>
        <input
          type="password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setError('');
          }}
          className={inputClass}
          required
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu mới"
        />
      </FormField>

      {error && (
        <div className="mb-3 text-sm text-danger-600 bg-danger-50 border border-danger-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang lưu...
            </>
          ) : (
            'Đổi mật khẩu'
          )}
        </button>
      </div>
    </form>
  );
}
