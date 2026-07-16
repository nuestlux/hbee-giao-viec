/**
 * Footer app — hiển thị trên các màn hình chính và đăng nhập.
 */
export default function AppFooter({ className = '' }: { className?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer
      className={`w-full shrink-0 py-4 text-center text-xs sm:text-[0.8125rem] text-slate-400 leading-relaxed ${className}`}
    >
      <p>
        © {year} · Phát triển bởi{' '}
        <span className="font-semibold text-slate-500">HTSC</span>
      </p>
    </footer>
  );
}
