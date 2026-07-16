import {
  ClipboardList,
  Shield,
  Globe2,
  LineChart,
} from 'lucide-react';
import HbeeLogo from './HbeeLogo';

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Quản lý công việc',
    desc: 'Phân công và theo dõi tiến độ công việc an toàn.',
    color: 'text-sky-500',
  },
  {
    icon: Shield,
    title: 'Nhắc việc tự động',
    desc: 'Thông báo qua kênh bảo mật được mã hóa.',
    color: 'text-blue-600',
  },
  {
    icon: Globe2,
    title: 'Đăng ký công việc',
    desc: 'Cán bộ tự đăng ký nhiệm vụ liên quan.',
    color: 'text-sky-500',
  },
  {
    icon: LineChart,
    title: 'Theo dõi tiến độ',
    desc: 'Báo cáo trực quan tình trạng công việc.',
    color: 'text-blue-600',
  },
] as const;

type Props = {
  onClose?: () => void;
};

/**
 * Nội dung modal "Thông tin HBee" — layout theo product About dialog.
 */
export default function AboutHbeeContent({ onClose }: Props) {
  return (
    <div className="space-y-5 sm:space-y-6 -mt-1">
      {/* Brand */}
      <div className="flex flex-col items-center text-center pt-1 pb-1">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          {/* Prefer full lockup when asset exists; mark fallback via CSS/SVG */}
          <HbeeLogo variant="full" size={40} className="max-w-[11rem]" />
        </div>
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.06em] text-slate-400 max-w-md leading-relaxed">
          Phần mềm quản lý giao việc và nhắc việc tự động
        </p>
      </div>

      {/* Version box */}
      <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-600 space-y-0.5">
        <p>
          <span className="text-slate-500">Phiên bản</span>{' '}
          <span className="font-semibold text-slate-800">1.0.0</span>
        </p>
        <p>
          <span className="text-slate-500">Ngày phát hành:</span>{' '}
          <span className="font-medium text-slate-700">28/10/2024</span>
        </p>
      </div>

      {/* Overview */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-2">Tổng quan</h3>
        <p className="text-sm text-slate-600 leading-relaxed text-justify">
          Ứng dụng quản lý giao việc và nhắc việc tự động là giải pháp tiên tiến giúp cá nhân
          và nhóm làm việc tối ưu hóa năng suất, quản lý công việc hiệu quả và đảm bảo tiến độ
          nhờ tính năng giao việc, theo dõi và nhắc nhở thông minh. Đặc biệt, ứng dụng được xây
          dựng với các tiêu chuẩn bảo mật cao, nhằm bảo vệ toàn diện dữ liệu và thông tin cá
          nhân, đảm bảo người dùng an tâm trong quá trình sử dụng.
        </p>
      </div>

      {/* Features 2x2 */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">Chức năng</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-3 items-start">
              <div
                className={`mt-0.5 w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center shrink-0 ${f.color}`}
              >
                <f.icon size={18} strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-snug">{f.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* License + developer */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pt-1 border-t border-slate-100">
        <div className="text-xs text-slate-500 space-y-0.5">
          <p>
            <span className="text-slate-400">Mã kích hoạt:</span>{' '}
            <span className="font-mono font-semibold text-slate-700 tracking-wide">
              WJ3Q-QNDW-SSLN-3GZV-B61X
            </span>
          </p>
          <p>
            <span className="text-slate-400">Thời hạn:</span>{' '}
            <span className="font-medium text-slate-700">Vĩnh viễn</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-right">
          <span>Phát triển bởi</span>
          <span className="inline-flex items-center gap-1.5 font-bold text-sky-600">
            <span className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-500 to-blue-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
              H
            </span>
            HTI
          </span>
        </div>
      </div>

      {onClose && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[5.5rem] px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
}
