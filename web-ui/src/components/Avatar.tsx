interface AvatarProps {
  name?: string;
  src?: string;
  user?: { fullName: string; avatar?: string };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function getInitials(name: string) {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase() || '?';
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];

function hashColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const SIZE_CLASS = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-xl',
} as const;

export function Avatar({ name, src, user, size = 'md', className = '' }: AvatarProps) {
  const actualName = user?.fullName || name || 'Unknown';
  const actualSrc = (user?.avatar || src || '').trim();
  const sizeClass = SIZE_CLASS[size];
  const initials = getInitials(actualName);
  const bgColor = hashColor(actualName);

  if (actualSrc) {
    return (
      <img
        src={actualSrc}
        alt={actualName}
        className={`rounded-full object-cover shadow-sm ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center
      text-white font-semibold ring-2 ring-white shadow-sm ${className}`}
      title={actualName}
    >
      {initials}
    </div>
  );
}

interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: 'sm' | 'md';
}

export function AvatarGroup({ names, max = 3, size = 'sm' }: AvatarGroupProps) {
  const shown = names.slice(0, max);
  const remaining = names.length - max;

  return (
    <div className="flex -space-x-2">
      {shown.map((name, i) => (
        <Avatar key={i} name={name} size={size} />
      ))}
      {remaining > 0 && (
        <div className={`${size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'}
          rounded-full bg-gray-200 text-gray-600 flex items-center justify-center
          font-semibold ring-2 ring-white`}>
          +{remaining}
        </div>
      )}
    </div>
  );
}
