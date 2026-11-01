import { AnimatePresence, motion } from "framer-motion";
import { TITLES, type Go, type Screen } from "../lib/nav";
import { useHubOnline, useSpeaking, useThinking } from "../lib/hub";
import { resolvedTheme, toggleTheme, usePrefs } from "../lib/prefs";
import { BackIcon, GearIcon, MoonIcon, SpeakerIcon, SunIcon } from "./Icons";
import { spring } from "./ui";

// These screens draw their own big title, so the bar stays quiet.
const OWN_TITLE: Screen[] = ["home", "checkin", "breathe", "play", "support", "insights", "companion", "planner"];

/** The mark: a mirror (ring) holding its reflection (the filled half). */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill="none" stroke="var(--ink)" strokeWidth="1.8" />
      <path d="M16 6.5a9.5 9.5 0 0 1 0 19z" fill="var(--indigo)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <Logo />
      <span className="font-display text-[22px] leading-none text-ink">MindMirror</span>
    </span>
  );
}

export function HubStatus({ go, wide = false }: { go: Go; wide?: boolean }) {
  const online = useHubOnline();
  const thinking = useThinking();
  const speaking = useSpeaking();
  const label = speaking ? "Speaking" : thinking ? "Listening" : online ? "Hub connected" : online === false ? "Hub offline" : "Connecting";
  const short = speaking ? "Speaking" : thinking ? "Listening" : online ? "Live" : online === false ? "Offline" : "…";
  const color = speaking || thinking ? "var(--indigo)" : online ? "var(--sage)" : "var(--faint)";
  return (
    <button onClick={() => go("companion")} title={online ? "The laptop hub is running" : "Start the hub: cd hub, npm start"}
      className="flex h-9 items-center gap-2 rounded-full px-2.5 text-[13px] font-medium text-soft hover:text-ink">
      <span className="relative flex h-2 w-2">
        {(online || thinking) && (
          <motion.span className="absolute inset-0 rounded-full" style={{ background: color }}
            animate={{ scale: [1, 2.6], opacity: [0.5, 0] }} transition={{ duration: thinking ? 0.9 : 2.4, repeat: Infinity }} />
        )}
        <span className="relative h-2 w-2 rounded-full" style={{ background: color }} />
      </span>
      {speaking && <SpeakerIcon size={14} />}
      <AnimatePresence mode="wait">
        <motion.span key={label} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.18 }}>
          {wide ? label : short}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function ThemeButton() {
  usePrefs();
  const dark = resolvedTheme() === "dark";
  return (
    <motion.button onClick={toggleTheme} whileTap={{ scale: 0.85, rotate: -20 }} transition={spring}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="grid h-9 w-9 place-items-center overflow-hidden rounded-full text-soft hover:bg-card-2 hover:text-ink">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={dark ? "moon" : "sun"} initial={{ y: 16, opacity: 0, rotate: -40 }} animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -16, opacity: 0, rotate: 40 }} transition={{ duration: 0.28 }}>
          {dark ? <MoonIcon size={18} /> : <SunIcon size={18} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

export function TopBar({ screen, onBack, onSettings, go }: { screen: Screen; onBack?: () => void; onSettings: () => void; go: Go }) {
  return (
    <header className="sticky top-0 z-20 -mx-5 mb-2 flex h-16 items-center justify-between gap-2 border-b border-transparent bg-bg/85 px-5 backdrop-blur-xl lg:static lg:mx-0 lg:mb-0 lg:h-20 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
      <div className="flex min-w-0 items-center gap-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {onBack ? (
            <motion.button key="back" onClick={onBack} aria-label="Back" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              whileTap={{ scale: 0.9 }} className="-ml-2 flex h-10 items-center gap-1 rounded-full pl-1.5 pr-3 text-sm font-medium text-soft hover:text-ink">
              <BackIcon size={20} /> Back
            </motion.button>
          ) : (
            <motion.button key="logo" onClick={() => go("home")} aria-label="Home" className="lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Wordmark />
            </motion.button>
          )}
        </AnimatePresence>
        {!OWN_TITLE.includes(screen) && <span className="truncate font-display text-xl text-ink">{TITLES[screen]}</span>}
      </div>

      <div className="flex items-center gap-0.5 lg:hidden">
        <HubStatus go={go} />
        <ThemeButton />
        <motion.button onClick={onSettings} whileTap={{ scale: 0.88, rotate: 45 }} aria-label="Settings"
          className="grid h-9 w-9 place-items-center rounded-full text-soft hover:bg-card-2 hover:text-ink">
          <GearIcon size={18} />
        </motion.button>
      </div>
    </header>
  );
}
