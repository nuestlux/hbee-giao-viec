type HbeeLogoProps = {
  /** mark = hexagon icon only; full = icon + wordmark image */
  variant?: 'mark' | 'full';
  /** size of mark / height of full logo */
  size?: number;
  className?: string;
  /** For mark on dark backgrounds */
  inverted?: boolean;
};

/**
 * H-Bee brand logo from product identity.
 * - mark: geometric H inside hexagon (SVG, scalable)
 * - full: official lockup PNG (hexagon + H-Bee wordmark)
 */
export default function HbeeLogo({
  variant = 'mark',
  size = 40,
  className = '',
  inverted = false,
}: HbeeLogoProps) {
  if (variant === 'full') {
    return (
      <img
        src="/hbee-logo.png"
        alt="H-Bee"
        height={size}
        className={`object-contain object-left ${className}`}
        style={{ height: size, width: 'auto' }}
        draggable={false}
      />
    );
  }

  const stroke = inverted ? '#FFFFFF' : '#1A1A1A';
  const hFill = '#E89B18';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      fill="none"
      aria-hidden="true"
      role="img"
    >
      <title>H-Bee</title>
      <path
        d="M50 6 L88.97 28.5 V71.5 L50 94 L11.03 71.5 V28.5 Z"
        stroke={stroke}
        strokeWidth="5.5"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        fill={hFill}
        d="M30 28h12.5v16.5h15V28H70v44H57.5V55.5h-15V72H30V28z"
      />
    </svg>
  );
}
