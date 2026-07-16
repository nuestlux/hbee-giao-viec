import { useMemo } from 'react';
import { Bell, Check, CheckCircle2, AlertCircle, Clock, MessageSquare, Info, CalendarClock } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { NotificationType } from '../types';
import { useNavigate } from 'react-router-dom';
import { PAGE_COPY } from '../utils/ui-labels';

export default function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useStore();
  const navigate = useNavigate();

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'TASK_ASSIGNED': return <AlertCircle className="text-indigo-500" size={20} />;
      case 'TASK_ACCEPTED': return <CheckCircle2 className="text-cyan-500" size={20} />;
      case 'PROGRESS_UPDATE': return <Clock className="text-blue-500" size={20} />;
      case 'EXTENSION_REQUEST': return <CalendarClock className="text-amber-500" size={20} />;
      case 'APPROVAL_NEEDED': return <AlertCircle className="text-orange-500" size={20} />;
      case 'TASK_COMPLETED': return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'TASK_OVERDUE': return <AlertCircle className="text-red-500" size={20} />;
      case 'COMMENT': return <MessageSquare className="text-gray-500" size={20} />;
      case 'DEADLINE_REMINDER': return <Clock className="text-amber-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  const handleNotificationClick = (id: string, linkTo: string, isRead: boolean) => {
    if (!isRead) {
      markNotificationRead(id);
    }
    navigate(linkTo);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug flex items-center gap-2">
            <Bell className="text-primary-600 shrink-0" size={22} />
            {PAGE_COPY.notifications.title}
          </h1>
          {unreadCount > 0 && (
            <span className="text-sm font-medium text-slate-500 tabular-nums">
              {PAGE_COPY.notifications.unreadCount(unreadCount)}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={() => markAllNotificationsRead()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <Check size={16} />
            {PAGE_COPY.notifications.markAll}
          </button>
        )}
      </div>

      <div className="glass rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {sortedNotifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {sortedNotifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => handleNotificationClick(notif.id, notif.linkTo, notif.isRead)}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-4 ${!notif.isRead ? 'bg-primary-50/30' : ''}`}
              >
                <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!notif.isRead ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm mb-1 ${!notif.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                    {notif.title}
                  </h4>
                  <p className={`text-sm ${!notif.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(notif.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="flex-shrink-0 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-primary-600 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-1">{PAGE_COPY.notifications.empty}</p>
            <p className="text-sm">Không còn thông báo cần xử lý.</p>
          </div>
        )}
      </div>
    </div>
  );
}
