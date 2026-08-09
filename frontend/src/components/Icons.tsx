import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 22, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" aria-hidden="true">
      <rect x="6" y="6" width="20" height="20" rx="5.5" transform="rotate(45 16 16)" stroke="currentColor" strokeWidth="2" />
      <path d="m11.5 11.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return <Icon {...props}><path d="m3.5 10.5 8.5-7 8.5 7" /><path d="M5.5 9.5v10.2h13V9.5M9.5 19.7v-6h5v6" /></Icon>;
}

export function UserIcon(props: IconProps) {
  return <Icon {...props}><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c.8-3.4 3.3-5.2 7.5-5.2s6.7 1.8 7.5 5.2" /></Icon>;
}

export function ExerciseIcon(props: IconProps) {
  return <Icon {...props}><circle cx="12" cy="4.7" r="2" /><path d="m12 7 0 6.3m0-4-4.5 1.6m4.5-1.6 4.5 1.6M8.5 10 6 15.7m9.5-5.7 2.5 5.7M9.5 20l2.5-6.7L14.5 20" /></Icon>;
}

export function CameraIcon(props: IconProps) {
  return <Icon {...props}><path d="M4.5 8.5h3l1.4-2h6.2l1.4 2h3a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18v-8.0a1.5 1.5 0 0 1 1.5-1.5Z" /><circle cx="12" cy="14" r="3.2" /></Icon>;
}

export function LockIcon(props: IconProps) {
  return <Icon {...props}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7.8a4 4 0 0 1 8 0V10" /></Icon>;
}

export function LogoutIcon(props: IconProps) {
  return <Icon {...props}><path d="M14.5 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19h7.7" /><path d="M12 12h8m-3.2-3.2L20 12l-3.2 3.2" /></Icon>;
}

export function ArrowIcon(props: IconProps) {
  return <Icon {...props}><path d="M4 12h15m-5.2-5.2L19 12l-5.2 5.2" /></Icon>;
}

export function BackIcon(props: IconProps) {
  return <Icon {...props}><path d="M19 12H5m5.5-5.5L5 12l5.5 5.5" /></Icon>;
}

export function ChevronIcon(props: IconProps) {
  return <Icon {...props}><path d="m9 5 7 7-7 7" /></Icon>;
}

export function UploadIcon(props: IconProps) {
  return <Icon {...props}><path d="M12 16V4m-4.5 4.5L12 4l4.5 4.5M5 14.5v3.8A1.7 1.7 0 0 0 6.7 20h10.6a1.7 1.7 0 0 0 1.7-1.7v-3.8" /></Icon>;
}

export function SaveIcon(props: IconProps) {
  return <Icon {...props}><path d="M5 4.5h11.5L19 7v12.5H5z" /><path d="M8 4.5v5h7v-5M8.5 19.5v-5h7v5" /></Icon>;
}

export function CheckIcon(props: IconProps) {
  return <Icon {...props}><path d="m5 12.5 4.2 4.2L19 7" /></Icon>;
}

export function AlertIcon(props: IconProps) {
  return <Icon {...props}><path d="m12 4 8 15H4z" /><path d="M12 9v4m0 3.2v.1" /></Icon>;
}

export function InfoIcon(props: IconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="8.5" /><path d="M12 10.8v5m0-8v.1" /></Icon>;
}

export function PlayIcon(props: IconProps) {
  return <Icon {...props}><rect x="4" y="4" width="16" height="16" rx="4" /><path d="m10 8.8 5 3.2-5 3.2z" /></Icon>;
}

export function BookIcon(props: IconProps) {
  return <Icon {...props}><path d="M5 5.5a2 2 0 0 1 2-2h5v16H7a2 2 0 0 0-2 2zm14 0a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2z" /></Icon>;
}

export function ClipboardIcon(props: IconProps) {
  return <Icon {...props}><rect x="5" y="4.5" width="14" height="16" rx="2" /><path d="M9 4.5V3h6v1.5M8.5 10h7m-7 4h7m-7 4h4" /></Icon>;
}

export function SunIcon(props: IconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="3.5" /><path d="M12 2.8v2m0 14.4v2M21.2 12h-2M4.8 12h-2m15.1-6.5-1.4 1.4M7.5 16.5l-1.4 1.4m0-12.4 1.4 1.4m9.9 9.6 1.4 1.4" /></Icon>;
}

export function MessageIcon(props: IconProps) {
  return <Icon {...props}><path d="M5 5.5h14v10H9l-4 3v-13z" /></Icon>;
}

export function RepeatIcon(props: IconProps) {
  return <Icon {...props}><path d="M17 7h3V4m0 3-3-3M7 17H4v3m0-3 3 3M20 7h-9a4 4 0 0 0-4 4m-3 6h9a4 4 0 0 0 4-4" /></Icon>;
}

export function ArrowUpIcon(props: IconProps) {
  return <Icon {...props}><path d="M12 19V5m-5 5 5-5 5 5" /></Icon>;
}

export function ArrowDownIcon(props: IconProps) {
  return <Icon {...props}><path d="M12 5v14m-5-5 5 5 5-5" /></Icon>;
}

export function SettingsIcon(props: IconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1-1.6 2.8-.2-.1a2.4 2.4 0 0 0-2.5 0l-.2.1-1.6-2.8.1-.1a2.4 2.4 0 0 0 0-2.9l-.1-.1 1.6-2.8.2.1a2.4 2.4 0 0 0 2.5 0l.2-.1 1.6 2.8-.1.1a2.4 2.4 0 0 0 0 2.9Z" /></Icon>;
}
