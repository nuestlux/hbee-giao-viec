import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  clearAllPasswordOverrides,
  clearUserPasswordOverride,
  DEMO_PASSWORD,
  isRememberEnabled,
  loadRememberedEmail,
} from '../auth/session';
import { organization } from '../data/mockData';
import { HbeeLogo, Modal } from '../components';
import AppFooter from '../components/AppFooter';

/** Tài khoản demo — luôn khớp mockData, mật khẩu mặc định DEMO_PASSWORD. */
const DEMO_ACCOUNTS = [
  { email: 'nguyenvanan@hoabinh.gov.vn', label: 'Chủ tịch', hint: 'Nguyễn Văn An' },
  { email: 'phamminhtuan@hoabinh.gov.vn', label: 'Văn thư', hint: 'Phạm Minh Tuấn' },
  { email: 'lehoangphuc@hoabinh.gov.vn', label: 'Chánh VP', hint: 'Lê Hoàng Phúc' },
  { email: 'doanhkiet@hoabinh.gov.vn', label: 'Admin', hint: 'Đỗ Anh Kiệt' },
] as const;

type HelpModal = null | 'forgot' | 'register';

const HELP_COPY: Record<Exclude<HelpModal, null>, { title: string; body: string }> = {
  forgot: {
    title: 'Quên mật khẩu',
    body: `Bản demo: mật khẩu mặc định là ${DEMO_PASSWORD}. Bấm tài khoản demo trên form để đăng nhập ngay, hoặc «Khôi phục MK demo» nếu đã đổi mật khẩu trước đó. Khi có backend: liên hệ quản trị viên.`,
  },
  register: {
    title: 'Chưa có tài khoản',
    body: 'Tài khoản do quản trị viên cấp. Liên hệ quản trị để được tạo.',
  },
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const login = useStore((s) => s.login);

  const [email, setEmail] = useState(() => loadRememberedEmail());
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() => isRememberEnabled());
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [helpModal, setHelpModal] = useState<HelpModal>(null);
  /** Mở sẵn để user dev thấy ngay tài khoản demo. */
  const [demoOpen, setDemoOpen] = useState(true);

  const from =
    (location.state as { from?: string } | null)?.from &&
    !(location.state as { from?: string }).from?.startsWith('/login')
      ? (location.state as { from: string }).from
      : '/';

  if (currentUser) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 200));
    const result = login(email, password, remember);
    setLoading(false);
    if (!result.ok) {
      setError(
        `${result.error || 'Đăng nhập thất bại'}. Demo: mật khẩu ${DEMO_PASSWORD} (hoặc bấm tài khoản bên dưới để vào ngay).`,
      );
      return;
    }
    navigate(from, { replace: true });
  };

  /** Điền form + khôi phục mật khẩu demo cho user đó. */
  const fillDemo = (demoEmail: string) => {
    const user = users.find((u) => u.email.toLowerCase() === demoEmail.toLowerCase());
    if (user) clearUserPasswordOverride(user.id);
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setShowPassword(true);
    setError('');
  };

  /** Một chạm: reset MK demo → đăng nhập ngay. */
  const loginAsDemo = async (demoEmail: string) => {
    const user = users.find((u) => u.email.toLowerCase() === demoEmail.toLowerCase());
    if (!user) {
      setError(`Không tìm thấy tài khoản demo: ${demoEmail}`);
      return;
    }
    if (!user.isActive) {
      setError('Tài khoản demo đang bị khóa.');
      return;
    }
    clearUserPasswordOverride(user.id);
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 150));
    const result = login(demoEmail, DEMO_PASSWORD, false);
    setLoading(false);
    if (!result.ok) {
      setError(result.error || 'Đăng nhập demo thất bại');
      return;
    }
    navigate(from, { replace: true });
  };

  const restoreAllDemoPasswords = () => {
    clearAllPasswordOverrides();
    setPassword(DEMO_PASSWORD);
    setShowPassword(true);
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary-900 to-primary-700 text-white">
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-400 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-blue-400/50 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-white/20 shadow-lg p-1.5">
              <HbeeLogo variant="mark" size={36} />
            </div>
            <div>
              <p className="font-bold text-lg tracking-wide">H-Bee</p>
              <p className="text-sm text-primary-100">Giao việc</p>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <h1 className="text-3xl xl:text-4xl font-extrabold leading-[1.25] tracking-tight">
              Từ văn bản đến
              <br />
              kết quả thực hiện
            </h1>
            <p className="text-primary-100 text-[1.0625rem] leading-relaxed">
              Giao việc, theo dõi tiến độ, phê duyệt và báo cáo.
            </p>
          </div>

          <p className="text-xs text-primary-200/80">
            {organization.address}
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px] animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-lg p-1">
              <HbeeLogo variant="mark" size={34} />
            </div>
            <div>
              <p className="font-bold text-gray-900">H-Bee</p>
              <p className="text-xs text-gray-500">Giao việc</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-gray-100 p-8 sm:p-10">
            <div className="mb-8">
              <div className="mb-6 flex justify-center sm:justify-start">
                <HbeeLogo variant="full" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">Đăng nhập</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="email"
                    name="username"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-12 pl-11 pr-3.5 py-3 border border-gray-200 rounded-xl text-[0.9375rem] leading-normal bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/35 focus:border-primary-500 transition-all"
                    placeholder="ten@hoabinh.gov.vn"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full min-h-12 pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-[0.9375rem] leading-normal bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/35 focus:border-primary-500 transition-all"
                    placeholder="Nhập mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 min-h-10 min-w-10 text-slate-400 hover:text-slate-600 rounded-lg inline-flex items-center justify-center"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot — standard web row */}
              <div className="flex items-center justify-between gap-3 pt-0.5">
                <label
                  htmlFor="remember"
                  className="inline-flex items-center gap-2.5 cursor-pointer select-none text-[0.9375rem] text-slate-700"
                >
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500/40 cursor-pointer"
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <button
                  type="button"
                  onClick={() => setHelpModal('forgot')}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline underline-offset-2 shrink-0"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {error && (
                <div
                  role="alert"
                  className="text-sm text-danger-600 bg-danger-50 border border-danger-100 rounded-xl px-3.5 py-2.5"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 min-h-12 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold text-[0.9375rem] shadow-md shadow-primary-600/20 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>

              <p className="text-center text-sm text-gray-500 pt-1">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setHelpModal('register')}
                  className="font-medium text-primary-600 hover:text-primary-700 hover:underline underline-offset-2"
                >
                  Liên hệ quản trị viên
                </button>
              </p>
            </form>

            <Modal
              isOpen={helpModal !== null}
              onClose={() => setHelpModal(null)}
              title={helpModal ? HELP_COPY[helpModal].title : ''}
              size="sm"
            >
              {helpModal && (
                <div className="space-y-5">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {HELP_COPY[helpModal].body}
                  </p>
                  <button
                    type="button"
                    onClick={() => setHelpModal(null)}
                    className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </Modal>

            {/* Demo accounts — mở sẵn, 1 chạm đăng nhập */}
            <div className="mt-7 pt-5 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDemoOpen((v) => !v)}
                className="w-full flex items-center justify-between text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                aria-expanded={demoOpen}
              >
                <span>Tài khoản demo (bấm để đăng nhập ngay)</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${demoOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {demoOpen && (
                <div className="mt-3 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                    <p>
                      Mật khẩu mặc định:{' '}
                      <code className="text-primary-700 font-semibold bg-primary-50 px-1.5 py-0.5 rounded">
                        {DEMO_PASSWORD}
                      </code>
                    </p>
                    <button
                      type="button"
                      onClick={restoreAllDemoPasswords}
                      className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2"
                    >
                      Khôi phục MK demo
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        disabled={loading}
                        onClick={() => void loginAsDemo(acc.email)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          fillDemo(acc.email);
                        }}
                        title="Bấm: đăng nhập ngay · Chuột phải: chỉ điền form"
                        className="text-left text-xs px-3 py-2.5 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-50"
                      >
                        <span className="font-semibold text-gray-800 block">{acc.label}</span>
                        <span className="text-gray-500 truncate block text-[10px] leading-snug">
                          {acc.hint}
                        </span>
                        <span className="text-primary-600/80 truncate block text-[10px] mt-0.5">
                          {acc.email}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    URL đúng: <code className="text-gray-600">http://localhost:5173/#/login</code>
                  </p>
                </div>
              )}
            </div>
          </div>

          <AppFooter className="mt-6" />
        </div>
      </div>
    </div>
  );
}
