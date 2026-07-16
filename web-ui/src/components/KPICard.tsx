import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: string;
  trend?: number;
  onClick?: () => void;
}

export default function KPICard({ title, value, icon, color, trend, onClick }: KPICardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 transition-all duration-300
        hover:shadow-lg hover:-translate-y-0.5
        ${onClick ? 'cursor-pointer' : ''}
        bg-white border border-gray-100`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 -mr-8 -mt-8 ${color}`} />

      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="min-w-0">
          <p className="text-sm text-slate-500 font-medium mb-1.5 leading-snug">{title}</p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums tracking-tight leading-none">{value}</p>
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1.5 mt-3 text-sm font-medium leading-snug
              ${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-slate-500'}`}
            >
              {trend > 0 ? <TrendingUp size={15} /> : trend < 0 ? <TrendingDown size={15} /> : <Minus size={15} />}
              <span>
                {trend > 0 ? '+' : ''}
                {trend}% so với tháng trước
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} text-white shadow-md shrink-0`}>{icon}</div>
      </div>
    </div>
  );
}
