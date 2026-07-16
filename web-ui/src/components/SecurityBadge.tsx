import type { SecurityLevel } from '../types';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { SECURITY_LABELS } from '../utils/ui-labels';

const securityConfig: Record<SecurityLevel, { className: string; icon: React.ReactNode }> = {
  THUONG: { className: 'bg-gray-100 text-gray-600', icon: <ShieldCheck size={12} /> },
  MAT: { className: 'bg-yellow-100 text-yellow-700', icon: <Shield size={12} /> },
  TOI_MAT: { className: 'bg-red-100 text-red-700', icon: <ShieldAlert size={12} /> },
};

interface SecurityBadgeProps {
  security: SecurityLevel;
}

export default function SecurityBadge({ security }: SecurityBadgeProps) {
  const config = securityConfig[security] || securityConfig.THUONG;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${config.className}`}>
      {config.icon}
      {SECURITY_LABELS[security] || security}
    </span>
  );
}
