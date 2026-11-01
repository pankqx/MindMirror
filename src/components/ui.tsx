import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { BackIcon } from "./Icons";

// Kishore's base components, themed for light and dark, with soft press feedback.

export const spring = { type: "spring", stiffness: 380, damping: 30 } as const;
export const ease = [0.22, 1, 0.36, 1] as const;

// ----------------------------------
// 1. BUTTON
// ----------------------------------

type ButtonProps = {
  variant?: "primary" | "soft" | "urgent" | "ghost";
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
};

export function Button({ variant = "primary", onClick, children, className = "", disabled, type = "button" }: ButtonProps) {
  const styles = {
    primary: "bg-indigo text-indigo-ink shadow-soft",
    soft: "bg-card text-indigo border border-line",
    urgent: "bg-urgent text-white",
    ghost: "bg-transparent text-soft",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      whileHover={disabled ? undefined : { y: -1 }}
      transition={spring}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold transition-colors disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}

// ----------------------------------
// 2. CARD
// ----------------------------------

type CardProps = {
  children: React.ReactNode;
  className?: string;
} & Omit<HTMLMotionProps<"div">, "children">;

export function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <motion.div className={`rounded-3xl border border-line/70 bg-card p-5 shadow-soft ${className}`} {...rest}>
      {children}
    </motion.div>
  );
}

/** A card that is a button: lifts on hover, sinks on press. */
export function TapCard({
  children,
  className = "",
  onClick,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  onClick: () => void;
  label?: string;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={spring}
      className={`block w-full rounded-3xl border border-line/70 bg-card p-5 text-left shadow-soft ${className}`}
    >
      {children}
    </motion.button>
  );
}

// ----------------------------------
// 3. SLIDER
// ----------------------------------

type SliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  leftEmoji: string;
  rightEmoji: string;
  words?: string[];
};

export function Slider({ label, value, onChange, leftEmoji, rightEmoji, words }: SliderProps) {
  const fill = `${((value - 1) / 4) * 100}%`;
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <label className="font-bold text-ink">{label}</label>
        <motion.span
          key={value}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={spring}
          className="rounded-full bg-indigo/12 px-3 py-1 font-bold text-indigo"
        >
          {words?.[value - 1] ?? `${value}/5`}
        </motion.span>
      </div>

      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mm-range w-full"
        style={{ "--fill": fill } as React.CSSProperties}
      />

      <div className="flex justify-between text-2xl">
        <span>{leftEmoji}</span>
        <span>{rightEmoji}</span>
      </div>
    </div>
  );
}

// ----------------------------------
// 4. TOGGLE
// ----------------------------------

type ToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  yesLabel: string;
  noLabel: string;
};

export function Toggle({ value, onChange, yesLabel, noLabel }: ToggleProps) {
  return (
    <div className="relative grid grid-cols-2 gap-1 rounded-2xl bg-card-2 p-1">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`relative z-10 min-h-12 rounded-xl font-bold transition-colors ${value === v ? "text-sage-ink" : "text-soft"}`}
        >
          {value === v && (
            <motion.span layoutId="toggle-pill" transition={spring} className="absolute inset-0 -z-10 rounded-xl bg-sage/35" />
          )}
          {v ? yesLabel : noLabel}
        </button>
      ))}
    </div>
  );
}

// ----------------------------------
// 5. SCREEN
// ----------------------------------

type ScreenProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: React.ReactNode;
};

export function Screen({ title, subtitle, onBack, children }: ScreenProps) {
  return (
    <div>
      <header className="mb-6 flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} aria-label="Go back" className="grid h-11 w-11 place-items-center rounded-full bg-card text-indigo shadow-soft">
            <BackIcon />
          </button>
        )}
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-soft">{subtitle}</p>}
        </div>
      </header>
      {children}
    </div>
  );
}

// ----------------------------------
// 6. SMALL PIECES
// ----------------------------------

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "sage" | "sun" | "coral" | "indigo" }) {
  const tones = {
    neutral: "bg-card-2 text-soft",
    sage: "bg-sage/25 text-sage-ink",
    sun: "bg-sun/30 text-sun-ink",
    coral: "bg-coral/25 text-coral-ink",
    indigo: "bg-indigo/15 text-indigo",
  };
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

/** Staggered fade-up for lists of cards. */
export const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
export const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-2 flex items-end justify-between">
      <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-faint">{children}</h2>
      {action}
    </div>
  );
}
