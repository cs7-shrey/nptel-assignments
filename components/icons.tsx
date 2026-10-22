type IconProps = { size?: number; className?: string };

// Small line icons shared by the AI summary and settings screens.
const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export function SparklesIcon({ size = 16, className }: IconProps) {
  return <svg {...base(size)} className={className}>
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z" />
    <path d="M19 3v3M17.5 4.5h3M5 17v2.5M3.8 18.2h2.5" />
  </svg>;
}

export function MaximizeIcon({ size = 16, className }: IconProps) {
  return <svg {...base(size)} className={className}>
    <path d="M9 4H4v5M15 4h5v5M20 15v5h-5M4 15v5h5" />
  </svg>;
}

export function CloseIcon({ size = 16, className }: IconProps) {
  return <svg {...base(size)} className={className}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>;
}

export function ChevronDownIcon({ size = 16, className }: IconProps) {
  return <svg {...base(size)} className={className}><path d="m6 9 6 6 6-6" /></svg>;
}

export function SlidersIcon({ size = 16, className }: IconProps) {
  return <svg {...base(size)} className={className}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" />
  </svg>;
}

export function ArrowLeftIcon({ size = 16, className }: IconProps) {
  return <svg {...base(size)} className={className}><path d="M19 12H5M11 18l-6-6 6-6" /></svg>;
}

export function ExternalLinkIcon({ size = 16, className }: IconProps) {
  return <svg {...base(size)} className={className}>
    <path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
  </svg>;
}

export function RefreshIcon({ size = 16, className }: IconProps) {
  return <svg {...base(size)} className={className}>
    <path d="M20 7v5h-5M4 17v-5h5" />
    <path d="M6.1 8.2A7 7 0 0 1 19.3 12M4.7 12a7 7 0 0 0 13.2 3.8" />
  </svg>;
}

export function KeyIcon({ size = 16, className }: IconProps) {
  return <svg {...base(size)} className={className}>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 8-8M16.5 6.5 19 9M14 9l2 2" />
  </svg>;
}

export function EyeIcon({ size = 16, className }: IconProps) {
  return <svg {...base(size)} className={className}>
    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>;
}

export function EyeOffIcon({ size = 16, className }: IconProps) {
  return <svg {...base(size)} className={className}>
    <path d="M4 4l16 16M9.9 5.2A10.9 10.9 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.2 3M6.3 6.4A17.7 17.7 0 0 0 2.5 12s3.5 7 9.5 7a10 10 0 0 0 4-.8" />
    <path d="M10.3 10.4a2.5 2.5 0 0 0 3.4 3.4" />
  </svg>;
}

export function CheckIcon({ size = 16, className }: IconProps) {
  return <svg {...base(size)} className={className} strokeWidth={2.4}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
}

export function TrashIcon({ size = 16, className }: IconProps) {
  return <svg {...base(size)} className={className}>
    <path d="M4 7h16M9 7V4h6v3M6.5 7l.8 13h9.4l.8-13M10 11v5M14 11v5" />
  </svg>;
}

export function StopIcon({ size = 16, className }: IconProps) {
  return <svg {...base(size)} className={className}><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" /></svg>;
}

export function GearIcon({ size = 16, className }: IconProps) {
  return <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
  </svg>;
}
