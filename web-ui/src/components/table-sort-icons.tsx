/** Ant Design-style dual caret sorter icons */

export function CaretUpOutlined({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      width="10"
      height="10"
      className={active ? 'text-primary-600' : 'text-slate-300 group-hover:text-slate-400'}
      fill="currentColor"
      aria-hidden
    >
      <path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z" />
    </svg>
  );
}

export function CaretDownOutlined({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      width="10"
      height="10"
      className={active ? 'text-primary-600' : 'text-slate-300 group-hover:text-slate-400'}
      fill="currentColor"
      aria-hidden
    >
      <path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z" />
    </svg>
  );
}
