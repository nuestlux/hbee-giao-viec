import type { ReactNode } from 'react';

interface TimelineItem {
  id: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  time: string;
  color?: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

export default function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={item.id} className="relative flex gap-4 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
            {/* Dot */}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs
              ${item.color || 'bg-primary-500'} shadow-sm flex-shrink-0`}>
              {item.icon || <div className="w-2 h-2 bg-white rounded-full" />}
            </div>

            {/* Content */}
            <div className="flex-1 pb-2 min-w-0">
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              {item.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
