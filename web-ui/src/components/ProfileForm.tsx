import { useRef, useState, type FormEvent } from 'react';
import { Camera, ImagePlus, Loader2, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Avatar } from './Avatar';
import FormField, { inputClass } from './FormField';
import { getRoleLabel } from '../utils/role-labels';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_EDGE = 320;

type Props = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không đọc được file ảnh'));
    reader.onload = () => {
      const src = String(reader.result || '');
      const img = new Image();
      img.onerror = () => reject(new Error('File không phải ảnh hợp lệ'));
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          resolve(src);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * User tự sửa hồ sơ: avatar + thông tin cơ bản (không đổi role / phòng ban / isActive).
 */
export default function ProfileForm({ onSuccess, onCancel }: Props) {
  const currentUser = useStore((s) => s.currentUser);
  const updateUser = useStore((s) => s.updateUser);
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [position, setPosition] = useState(currentUser?.position || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [error, setError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!currentUser) {
    return <p className="text-sm text-gray-500">Chưa đăng nhập.</p>;
  }

  const handleAvatar = async (file: File | undefined) => {
    if (!file) return;
    setAvatarError('');
    if (!file.type.startsWith('image/')) {
      setAvatarError('Chỉ chấp nhận file ảnh');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Ảnh tối đa 5MB');
      return;
    }
    setAvatarBusy(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setAvatar(dataUrl);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Không xử lý được ảnh');
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ tên');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Email không hợp lệ');
      return;
    }
    setLoading(true);
    updateUser(currentUser.id, {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      position: position.trim(),
      avatar: avatar.trim(),
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => onSuccess?.(), 600);
  };

  if (success) {
    return (
      <div className="py-6 text-center space-y-2">
        <p className="text-sm font-semibold text-emerald-600">Đã cập nhật hồ sơ</p>
        <p className="text-xs text-gray-500">Avatar và thông tin hiển thị đã được lưu.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Avatar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/80">
        <button
          type="button"
          onClick={() => !avatarBusy && fileRef.current?.click()}
          className="relative group shrink-0"
          title="Đổi ảnh đại diện"
        >
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover ring-2 ring-white shadow"
            />
          ) : (
            <Avatar name={fullName || currentUser.fullName} size="xl" />
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shadow group-hover:bg-primary-700">
            <Camera size={14} />
          </span>
        </button>
        <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Ảnh đại diện</p>
          <p className="text-xs text-gray-500">JPG, PNG, WEBP — tối đa 5MB, tự nén.</p>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <button
              type="button"
              disabled={avatarBusy}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {avatarBusy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
              {avatar ? 'Đổi ảnh' : 'Tải ảnh'}
            </button>
            {avatar && (
              <button
                type="button"
                onClick={() => {
                  setAvatar('');
                  if (fileRef.current) fileRef.current.value = '';
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
              >
                <X size={14} />
                Gỡ ảnh
              </button>
            )}
          </div>
          {avatarError && <p className="text-xs text-red-600">{avatarError}</p>}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleAvatar(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Họ và tên" required>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            required
          />
        </FormField>
        <FormField label="Email" required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
        </FormField>
        <FormField label="Số điện thoại">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField label="Chức vụ">
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </div>

      {/* Read-only org context */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-500 space-y-1">
        <p>
          <span className="font-medium text-gray-600">Vai trò:</span> {getRoleLabel(currentUser.role)}
        </p>
        <p>
          <span className="font-medium text-gray-600">Phòng ban:</span> {currentUser.departmentName || '—'}
        </p>
        <p className="text-[11px] text-gray-400">Vai trò & phòng ban do quản trị viên gán — không tự sửa.</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={loading || avatarBusy}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-60"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Lưu hồ sơ
        </button>
      </div>
    </form>
  );
}
