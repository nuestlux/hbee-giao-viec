import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import AppFooter from '../components/AppFooter';
import { useWorkReminders } from '../hooks/use-work-reminders';

/**
 * Layout không top header (bỏ breadcrumb / search / chuông / profile trên header).
 * Sidebar chứa nav + thông báo + profile.
 * Spacing main cân đối theo breakpoint.
 */
export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  useWorkReminders(true);

  // Đóng drawer mobile khi đổi route
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  // Khóa scroll body khi drawer mở
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nút mở menu — chỉ mobile/tablet (không dùng top header bar) */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-[60] inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-700 shadow-md border border-gray-200 hover:bg-gray-50 active:scale-95 transition"
        aria-label="Mở menu"
      >
        <Menu size={22} />
      </button>

      {/* Overlay mobile */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[1px] transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content — 8pt rhythm, breathing room per breakpoint */}
      <div className="min-h-screen flex flex-col transition-[padding] duration-300 ease-out lg:pl-72">
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 pt-[4.5rem] pb-4 sm:px-6 sm:pt-[4.75rem] sm:pb-5 md:px-7 md:pt-7 md:pb-6 lg:px-8 lg:pt-8 lg:pb-6 xl:px-10 xl:pt-9 xl:pb-6">
          <div className="w-full min-w-0 space-y-6 animate-fade-in md:space-y-7">
            <Outlet />
          </div>
        </main>
        <AppFooter className="px-4 sm:px-6 md:px-7 lg:px-8 xl:px-10 border-t border-gray-100/80 bg-gray-50/80" />
      </div>
    </div>
  );
}
