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

export function GitHubIcon({ size = 16, className }: IconProps) {
  return <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.56A10.5 10.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>;
}
