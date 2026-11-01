// Minimal line icons (24px grid, 1.8 stroke), so the UI stays calm and consistent.

import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 22, children, ...rest }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export const HomeIcon = (p: P) => <Svg {...p}><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" /></Svg>;
export const ChartIcon = (p: P) => <Svg {...p}><path d="M4 19h16" /><path d="M6 15l4-5 3 3 5-6" /><circle cx="18" cy="7" r="1.2" fill="currentColor" /></Svg>;
export const ChatIcon = (p: P) => <Svg {...p}><path d="M5 18.5V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8.5z" /><path d="M9 10h6M9 13h3.5" /></Svg>;
export const PlayIcon = (p: P) => <Svg {...p}><circle cx="8.5" cy="9" r="3.5" /><circle cx="15.5" cy="15" r="3.5" /><circle cx="16.5" cy="7" r="1.5" /><circle cx="7" cy="16.5" r="1.5" /></Svg>;
export const HeartIcon = (p: P) => <Svg {...p}><path d="M12 19.5s-7-4.3-7-9.5a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.2-7 9.5-7 9.5z" /></Svg>;
export const SunIcon = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></Svg>;
export const MoonIcon = (p: P) => <Svg {...p}><path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" /></Svg>;
export const MicIcon = (p: P) => <Svg {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></Svg>;
export const BackIcon = (p: P) => <Svg {...p}><path d="M15 5l-7 7 7 7" /></Svg>;
export const ArrowIcon = (p: P) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const GearIcon = (p: P) => <Svg {...p}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></Svg>;
export const LeafIcon = (p: P) => <Svg {...p}><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z" /><path d="M5 19l7-7" /></Svg>;
export const WindIcon = (p: P) => <Svg {...p}><path d="M3 9h11a3 3 0 1 0-3-3" /><path d="M3 15h15a3 3 0 1 1-3 3" /><path d="M3 12h7" /></Svg>;
export const CheckIcon = (p: P) => <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;
export const PhoneIcon = (p: P) => <Svg {...p}><path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z" /></Svg>;
export const SendIcon = (p: P) => <Svg {...p}><path d="M4.5 12 20 4.5 15.5 20l-3-6.5z" /><path d="M12.5 13.5 20 4.5" /></Svg>;
export const SparkIcon = (p: P) => <Svg {...p}><path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z" /></Svg>;
export const NecklaceIcon = (p: P) => <Svg {...p}><path d="M5 4c0 6 3 9 7 10 4-1 7-4 7-10" /><circle cx="12" cy="17" r="3" /></Svg>;
export const CalendarIcon = (p: P) => <Svg {...p}><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></Svg>;
export const PlusIcon = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const MinusIcon = (p: P) => <Svg {...p}><path d="M5 12h14" /></Svg>;
export const CloseIcon = (p: P) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const SpeakerIcon = (p: P) => <Svg {...p}><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></Svg>;
export const TrashIcon = (p: P) => <Svg {...p}><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5" /></Svg>;
