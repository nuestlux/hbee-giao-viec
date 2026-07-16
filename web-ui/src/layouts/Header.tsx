import React, { useEffect, useRef, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronRight, Menu, LogOut, UserCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Avatar, Modal } from '../components';
import ProfileForm from '../components/ProfileForm';
import { getRoleLabel } from '../utils/role-labels';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);
  const unreadCount = useStore((s) => s.notifications.filter((n) => !n.isRead).length);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter((p) => p);

    if (paths.length === 0) return [{ label: 'Trang chủ', path: '/' }];

    const breadcrumbs = [{ label: 'Trang chủ', path: '/' }];

    let currentPath = '';
    paths.forEach((path) => {
      currentPath += `/${path}`;
      let label = path;

      const pathMap: Record<string, string> = {
        documents: 'Văn bản đến',
        tasks: 'Nhiệm vụ',
        'department-work': 'Công việc phòng',
        reports: 'Báo cáo',
        notifications: 'Thông báo',
        system: 'Quản trị',
        users: 'Người dùng',
        roles: 'Vai trò & quyền',
        departments: 'Phòng ban',
        catalogs: 'Danh mục',
        settings: 'Cài đặt chung',
      };

      if (path.length > 20 || !isNaN(Number(path))) {
        label = 'Chi tiết';
      } else if (pathMap[path]) {
        label = pathMap[path];
      }

      breadcrumbs.push({ label, path: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (!currentUser) return null;

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 flex items-center justify-between px-6 shadow-sm transition-all">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button type="button" className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg shrink-0" aria-label="Menu">
          <Menu size={20} />
        </button>

        <nav className="hidden sm:flex items-center text-sm font-medium text-gray-500 min-w-0" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <ChevronRight size={16} className="mx-2 text-gray-400 shrink-0" />}
              {idx === breadcrumbs.length - 1 ? (
                <span className="text-gray-900 font-semibold truncate">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="hover:text-primary-600 transition-colors truncate">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4 md:gap-6 shrink-0">
        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="search"
            className="block w-64 lg:w-80 pl-10 pr-4 py-2 border border-gray-200 rounded-full leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-300 text-sm"
            placeholder="Tìm kiếm văn bản, nhiệm vụ..."
          />
        </div>

        {/* Chuông thông báo */}
        <Link
          to="/notifications"
          title="Thông báo"
          className={`relative p-2 rounded-full transition-colors ${
            location.pathname.startsWith('/notifications')
              ? 'bg-primary-50 text-primary-600'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Bell size={22} className={location.pathname.startsWith('/notifications') ? 'text-primary-600' : 'text-gray-600'} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-danger-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile user */}
        <div className="relative pl-4 border-l border-gray-200" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-gray-900 leading-tight">{currentUser.fullName}</p>
              <p className="text-xs text-gray-500 font-medium">{getRoleLabel(currentUser.role)}</p>
            </div>
            <Avatar user={currentUser} size="md" className="shadow-sm ring-2 ring-white" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-fade-in"
            >
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{currentUser.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setMenuOpen(false);
                  setProfileOpen(true);
                }}
              >
                <UserCircle size={16} className="text-gray-400" />
                Thông tin người dùng
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50"
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="Thông tin người dùng"
        size="lg"
      >
        <ProfileForm
          onCancel={() => setProfileOpen(false)}
          onSuccess={() => setProfileOpen(false)}
        />
      </Modal>
    </header>
  );
}
