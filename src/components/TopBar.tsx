import { AnimatePresence, motion } from "framer-motion";
import { TITLES, type Go, type Screen } from "../lib/nav";
import { useHubOnline, useSpeaking, useThinking } from "../lib/hub";
import { resolvedTheme, toggleTheme, usePrefs } from "../lib/prefs";
import { BackIcon, GearIcon, MoonIcon, SpeakerIcon, SunIcon } from "./Icons";
import { spring } from "./ui";

// These screens draw their own big title, so the bar stays quiet.
const OWN_TITLE: Screen[] = ["checkin", "breathe", "play", "support"];

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="var(--indigo)" />
      <circle cx="32" cy="30" r="15" fill="none" stroke="var(--bg)" strokeWidth="4" />
      <path d="M32 45v10" stroke="var(--bg)" strokeWidth="4" strokeLinecap="round" />
      <path d="M26 31c3-6 9-7 12-6-1 4-4 9-12 6z" fill="var(--sage)" />
    </svg>
  );
}

function HubChip({ go }: { go: Go }) {
  const online = useHubOnline();
  const thinking = useThinking();
  const speaking = useSpeaking();
  const label = speaking ? "Speaking" : thinking ? "Thinking" : online ? "Hub live" : online === false ? "Offline" : "…";
  const color = speaking || thinking ? "var(--indigo)" : online ? "var(--sage)" : "var(--faint)";
  return (
    <button onClick={() => go("companion")} title={online ? "The laptop hub is running" : "Start the hub: cd hub && npm start"}
      className="flex h-10 items-center gap-2 rounded-full border border-line/80 bg-card/70 px-3 text-xs font-bold text-soft backdrop-blur">
      <span className="relative flex h-2.5 w-2.5">
        {(online || thinking) && (
          <motion.span className="absolute inset-0 rounded-full" style={{ background: color }}
            animate={{ scale: [1, 2.4], opacity: [0.6, 0] }} transition={{ duration: thinking ? 0.9 : 2, repeat: Infinity }} />
        )}
        <span className="relative h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      </span>
      {speaking && <SpeakerIcon size={14} />}
      <AnimatePresence mode="wait">
        <motion.span key={label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
          {label}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function TopBar({ screen, onBack, onSettings, go }: { screen: Screen; onBack?: () => void; onSettings: () => void; go: Go }) {
  usePrefs();
  const dark = resolvedTheme() === "dark";
  return (
    <header className="sticky top-0 z-20 -mx-5 mb-4 flex items-center justify-between gap-2 bg-bg/70 px-5 py-3 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {onBack ? (
            <motion.button key="back" onClick={onBack} aria-label="Back" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              whileTap={{ scale: 0.9 }} className="grid h-10 w-10 place-items-center rounded-full border border-line/80 bg-card text-ink">
              <BackIcon size={20} />
            </motion.button>
          ) : (
            <motion.button key="logo" onClick={() => go("home")} aria-label="Home" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
              <Logo />
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.span key={screen} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
            className="truncate font-display text-lg font-semibold text-ink">
            {OWN_TITLE.includes(screen) ? "" : TITLES[screen]}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1.5">
        <HubChip go={go} />
        <motion.button onClick={toggleTheme} whileTap={{ scale: 0.85, rotate: -20 }} transition={spring}
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-line/80 bg-card/70 text-ink backdrop-blur">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={dark ? "moon" : "sun"} initial={{ y: 18, opacity: 0, rotate: -40 }} animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: -18, opacity: 0, rotate: 40 }} transition={{ duration: 0.3 }}>
              {dark ? <MoonIcon size={19} /> : <SunIcon size={19} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
        <motion.button onClick={onSettings} whileTap={{ scale: 0.88, rotate: 45 }} aria-label="Settings"
          className="grid h-10 w-10 place-items-center rounded-full border border-line/80 bg-card/70 text-ink backdrop-blur">
          <GearIcon size={19} />
        </motion.button>
      </div>
    </header>
  );
}
