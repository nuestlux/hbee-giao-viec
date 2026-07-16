import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  ListTodo,
  UserCheck,
  Briefcase,
  BarChart3,
  Settings,
  Users,
  Shield,
  Building2,
  BookOpen,
  ChevronDown,
  X,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { HbeeLogo } from '../components';
import SidebarUserPanel from './SidebarUserPanel';

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const location = useLocation();
  const [isTasksOpen, setIsTasksOpen] = useState(true);
  const [isSystemOpen, setIsSystemOpen] = useState(() =>
    typeof window !== 'undefined'
      ? window.location.pathname.startsWith('/system')
      : false,
  );
  const currentUser = useStore((s) => s.currentUser);

  if (!currentUser) return null;

  const navItems = [
    { icon: LayoutDashboard, label: 'Trang chủ', path: '/' },
    { icon: FileText, label: 'Văn bản đến', path: '/documents' },
  ];

  const taskSubItems = [
    { icon: ListTodo, label: 'Tôi giao', path: '/tasks?tab=assigned-by-me' },
    { icon: UserCheck, label: 'Được giao', path: '/tasks?tab=assigned-to-me' },
  ];

  /**
   * Thứ tự giống admin ERP / phần mềm quản trị:
   * cơ cấu → người dùng → vai trò → danh mục → cài đặt (cuối).
   */
  const systemSubItems = [
    { icon: Building2, label: 'Phòng ban', path: '/system/departments' },
    { icon: Users, label: 'Người dùng', path: '/system/users' },
    { icon: Shield, label: 'Vai trò & quyền', path: '/system/roles' },
    { icon: BookOpen, label: 'Danh mục', path: '/system/catalogs' },
    { icon: Settings, label: 'Cài đặt chung', path: '/system/settings' },
  ];

  const isActive = (path: string) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path;
  };

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group min-h-11 ${
      active
        ? 'bg-sidebar-active border-l-4 border-primary-400 text-white shadow-md'
        : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
    }`;

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-50 flex w-[min(18.5rem,90vw)] sm:w-72 flex-col bg-sidebar text-white shadow-2xl transition-transform duration-300 ease-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
      aria-label="Menu chính"
    >
      <div className="px-4 py-4 sm:px-5 sm:py-5 flex items-center gap-3.5 border-b border-white/10 shrink-0">
        <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-lg shrink-0 p-1">
          <HbeeLogo variant="mark" size={34} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-lg tracking-tight truncate leading-snug">H-Bee</h1>
          <p className="text-[0.8125rem] text-primary-200/90 truncate mt-0.5 leading-snug">
            Giao việc
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-2.5 min-h-11 min-w-11 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white shrink-0 inline-flex items-center justify-center"
          aria-label="Đóng menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 sm:px-3.5 space-y-1 custom-scrollbar">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={navLinkClass(isActive(item.path))}
          >
            <item.icon
              size={20}
              className={isActive(item.path) ? 'text-primary-400' : 'text-gray-400 group-hover:text-primary-300'}
            />
            <span className="font-medium text-[0.9375rem] leading-snug">{item.label}</span>
          </Link>
        ))}

        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => setIsTasksOpen(!isTasksOpen)}
            className={`w-full flex items-center justify-between px-3 py-3 min-h-11 rounded-xl transition-all duration-200 ${
              location.pathname.startsWith('/tasks') ? 'text-white' : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckSquare
                size={20}
                className={location.pathname.startsWith('/tasks') ? 'text-primary-400' : 'text-gray-400'}
              />
              <span className="font-medium text-[0.9375rem] leading-snug">Nhiệm vụ</span>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${isTasksOpen ? 'rotate-180' : ''}`} />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              isTasksOpen ? 'max-h-80 opacity-100 mt-1' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="pl-7 sm:pl-8 pr-1 space-y-0.5">
              {taskSubItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 min-h-10 rounded-xl transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-sidebar-active/50 text-primary-300 font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-sidebar-hover/50'
                  }`}
                >
                  <item.icon size={16} />
                  <span className="text-sm leading-snug">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <Link
          to="/department-work"
          onClick={onClose}
          className={navLinkClass(isActive('/department-work'))}
        >
          <Briefcase
            size={20}
            className={isActive('/department-work') ? 'text-primary-400' : 'text-gray-400 group-hover:text-primary-300'}
          />
          <span className="font-medium text-[0.9375rem] leading-snug">Công việc phòng</span>
        </Link>

        <Link to="/reports" onClick={onClose} className={navLinkClass(isActive('/reports'))}>
          <BarChart3
            size={20}
            className={isActive('/reports') ? 'text-primary-400' : 'text-gray-400 group-hover:text-primary-300'}
          />
          <span className="font-medium text-[0.9375rem] leading-snug">Báo cáo</span>
        </Link>

        <div className="pt-3 mt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => setIsSystemOpen(!isSystemOpen)}
            className={`w-full flex items-center justify-between px-3 py-3 min-h-11 rounded-xl transition-all duration-200 ${
              location.pathname.startsWith('/system') ? 'text-white' : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings
                size={20}
                className={location.pathname.startsWith('/system') ? 'text-primary-400' : 'text-gray-400'}
              />
              <span className="font-medium text-[0.9375rem] leading-snug">Quản trị</span>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${isSystemOpen ? 'rotate-180' : ''}`} />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              isSystemOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="pl-7 sm:pl-8 pr-1 space-y-0.5">
              {systemSubItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 min-h-10 rounded-xl transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-sidebar-active/50 text-primary-300 font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-sidebar-hover/50'
                  }`}
                >
                  <item.icon size={16} />
                  <span className="text-sm leading-snug">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <SidebarUserPanel onNavigate={onClose} />
    </aside>
  );
}
