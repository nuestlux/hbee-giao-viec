import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronUp,
  Clock,
  Info,
  KeyRound,
  LogOut,
  MessageSquare,
  Settings,
  UserCircle,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Avatar, Modal } from '../components';
import ChangePasswordForm from '../components/ChangePasswordForm';
import ProfileForm from '../components/ProfileForm';
import AboutHbeeContent from '../components/AboutHbeeContent';
import { getRoleLabel } from '../utils/role-labels';
import type { Notification, NotificationType } from '../types';

type Panel = null | 'profile' | 'notif' | 'password' | 'about' | 'edit-profile';

function notifIcon(type: NotificationType) {
  switch (type) {
    case 'TASK_ASSIGNED':
      return <AlertCircle className="text-indigo-400" size={16} />;
    case 'TASK_ACCEPTED':
      return <CheckCircle2 className="text-cyan-400" size={16} />;
    case 'PROGRESS_UPDATE':
      return <Clock className="text-blue-400" size={16} />;
    case 'EXTENSION_REQUEST':
      return <CalendarClock className="text-amber-400" size={16} />;
    case 'APPROVAL_NEEDED':
      return <AlertCircle className="text-orange-400" size={16} />;
    case 'TASK_COMPLETED':
      return <CheckCircle2 className="text-emerald-400" size={16} />;
    case 'TASK_OVERDUE':
      return <AlertCircle className="text-red-400" size={16} />;
    case 'COMMENT':
      return <MessageSquare className="text-gray-400" size={16} />;
    case 'DEADLINE_REMINDER':
      return <Clock className="text-amber-400" size={16} />;
    default:
      return <Info className="text-blue-400" size={16} />;
  }
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  return `${d} ngày trước`;
}

type Props = { onNavigate?: () => void };

export default function SidebarUserPanel({ onNavigate }: Props) {
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const notifications = useStore((s) => s.notifications);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead);
  const logout = useStore((s) => s.logout);

  const [panel, setPanel] = useState<Panel>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const recentNotifs = useMemo(() => {
    return [...notifications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [notifications]);

  useEffect(() => {
    if (!panel || panel === 'password' || panel === 'about' || panel === 'edit-profile') return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setPanel(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanel(null);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [panel]);

  if (!currentUser) return null;

  const toggle = (p: 'profile' | 'notif') => {
    setPanel((cur) => (cur === p ? null : p));
  };

  const handleLogout = () => {
    setPanel(null);
    logout();
    navigate('/login', { replace: true });
  };

  const go = (path: string) => {
    setPanel(null);
    onNavigate?.();
    navigate(path);
  };

  const openNotif = (n: Notification) => {
    if (!n.isRead) markNotificationRead(n.id);
    setPanel(null);
    onNavigate?.();
    navigate(n.linkTo || '/notifications');
  };

  return (
    <div ref={rootRef} className="relative shrink-0 border-t border-white/10 bg-slate-950/40 p-3.5 sm:p-4">
      {/* Profile menu — dark, above footer */}
      {panel === 'profile' && (
        <div
          role="menu"
          className="absolute left-3 right-3 bottom-[calc(100%+0.5rem)] z-[70] rounded-xl border border-white/10 bg-slate-800 shadow-2xl py-2 animate-fade-in"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => setPanel('edit-profile')}
            className="w-full flex items-center gap-3 px-3.5 py-3 min-h-11 text-[0.9375rem] leading-snug text-gray-200 hover:bg-white/10 transition-colors"
          >
            <UserCircle size={16} className="text-gray-400" />
            Hồ sơ
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => go('/system/settings')}
            className="w-full flex items-center gap-3 px-3.5 py-3 min-h-11 text-[0.9375rem] leading-snug text-gray-200 hover:bg-white/10 transition-colors"
          >
            <Settings size={16} className="text-gray-400" />
            Cài đặt chung
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => setPanel('password')}
            className="w-full flex items-center gap-3 px-3.5 py-3 min-h-11 text-[0.9375rem] leading-snug text-gray-200 hover:bg-white/10 transition-colors"
          >
            <KeyRound size={16} className="text-gray-400" />
            Đổi mật khẩu
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => setPanel('about')}
            className="w-full flex items-center gap-3 px-3.5 py-3 min-h-11 text-[0.9375rem] leading-snug text-gray-200 hover:bg-white/10 transition-colors"
          >
            <Info size={16} className="text-gray-400" />
            Giới thiệu
          </button>
          <div className="my-1 border-t border-white/10" />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 min-h-11 text-[0.9375rem] leading-snug text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      )}

      {/* Notification popover */}
      {panel === 'notif' && (
        <div className="absolute left-3 right-3 bottom-[calc(100%+0.5rem)] z-[70] rounded-xl border border-white/10 bg-slate-800 shadow-2xl overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10">
            <p className="text-sm font-semibold text-white">Thông báo</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsRead()}
                className="text-[11px] font-medium text-primary-300 hover:text-primary-200 inline-flex items-center gap-1"
              >
                <Check size={12} />
                Đánh dấu đã đọc
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            {recentNotifs.length === 0 ? (
              <p className="px-3.5 py-8 text-center text-xs text-gray-400">Chưa có thông báo</p>
            ) : (
              recentNotifs.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openNotif(n)}
                  className={`w-full text-left px-3 py-2.5 flex gap-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                    !n.isRead ? 'bg-primary-500/10' : ''
                  }`}
                >
                  <div className="mt-0.5 w-8 h-8 rounded-full bg-slate-700/80 flex items-center justify-center shrink-0">
                    {notifIcon(n.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs leading-snug line-clamp-2 ${
                        !n.isRead ? 'font-semibold text-white' : 'font-medium text-gray-300'
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{relativeTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-400 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
          <Link
            to="/notifications"
            onClick={() => {
              setPanel(null);
              onNavigate?.();
            }}
            className="block text-center text-xs font-semibold text-primary-300 hover:text-primary-200 py-2.5 border-t border-white/10 bg-slate-900/40"
          >
            Xem tất cả thông báo
          </Link>
        </div>
      )}

      {/* Footer bar — screenshot style */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => toggle('profile')}
          className={`flex-1 min-w-0 flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors ${
            panel === 'profile' ? 'bg-white/10' : 'hover:bg-white/5'
          }`}
          aria-expanded={panel === 'profile'}
          aria-haspopup="menu"
        >
          <div className="relative shrink-0">
            <Avatar
              user={currentUser}
              size="md"
              className="ring-2 ring-primary-500/60 border border-white/10"
            />
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-sidebar"
              title="Đang hoạt động"
            />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {currentUser.fullName}
            </p>
            <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">
              {getRoleLabel(currentUser.role)}
            </p>
          </div>
          <ChevronUp
            size={16}
            className={`text-gray-400 shrink-0 transition-transform ${
              panel === 'profile' ? '' : 'rotate-180'
            }`}
          />
        </button>

        <button
          type="button"
          onClick={() => toggle('notif')}
          className={`relative shrink-0 p-2.5 rounded-xl transition-colors ${
            panel === 'notif' ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
          }`}
          aria-label="Thông báo"
          aria-expanded={panel === 'notif'}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[1.1rem] h-[1.1rem] px-0.5 rounded-full bg-danger-500 text-[10px] font-bold text-white flex items-center justify-center border border-sidebar">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <Modal
        isOpen={panel === 'edit-profile'}
        onClose={() => setPanel(null)}
        title="Thông tin người dùng"
        size="lg"
      >
        <ProfileForm
          onCancel={() => setPanel(null)}
          onSuccess={() => setPanel(null)}
        />
      </Modal>

      <Modal
        isOpen={panel === 'password'}
        onClose={() => setPanel(null)}
        title="Thay đổi mật khẩu"
        size="sm"
      >
        <ChangePasswordForm
          onCancel={() => setPanel(null)}
          onSuccess={() => setPanel(null)}
        />
      </Modal>

      <Modal
        isOpen={panel === 'about'}
        onClose={() => setPanel(null)}
        title="Thông tin HBee"
        size="md"
      >
        <AboutHbeeContent onClose={() => setPanel(null)} />
      </Modal>
    </div>
  );
}
