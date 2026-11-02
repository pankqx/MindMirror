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
    primary: "bg-ink text-bg hover:bg-indigo hover:text-indigo-ink",
    soft: "bg-transparent text-ink border border-ink/20 hover:border-ink hover:bg-card",
    urgent: "bg-urgent text-white",
    ghost: "bg-transparent text-soft hover:text-ink",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={spring}
      className={`t-caption inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[4px] px-6 py-3 transition-colors disabled:opacity-35 ${styles[variant]} ${className}`}
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
    <motion.div className={`rounded-3xl border border-line bg-card p-5 ${className}`} {...rest}>
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
      whileTap={{ scale: 0.98 }}
      transition={spring}
      className={`block w-full rounded-3xl border border-line bg-card p-5 text-left transition-colors hover:border-ink/25 ${className}`}
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
        <label className="font-medium text-soft">{label}</label>
        <motion.span
          key={value}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={spring}
          className="font-display text-3xl text-ink"
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

      <div className="flex justify-between text-[13px] text-faint">
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
    <div className="relative grid grid-cols-2 gap-1 rounded-[6px] bg-card-2 p-1">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`t-caption relative z-10 min-h-12 rounded-[4px] transition-colors ${value === v ? "text-bg" : "text-soft"}`}
        >
          {value === v && (
            <motion.span layoutId="toggle-pill" transition={spring} className="absolute inset-0 -z-10 rounded-[4px] bg-ink" />
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
    <div className="lg:max-w-[680px]">
      {onBack && (
        <button onClick={onBack} aria-label="Go back" className="mb-4 grid h-10 w-10 place-items-center rounded-[4px] border border-line text-ink">
          <BackIcon />
        </button>
      )}
      <PageHeader title={title} lede={subtitle} />
      {children}
    </div>
  );
}

/** Editorial page header: a mono eyebrow on a thread, a Geist title whose <em> words turn to serif italic, one line of lede. */
export function PageHeader({ eyebrow, title, lede, right }: { eyebrow?: string; title: React.ReactNode; lede?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <motion.header className="mb-8 mt-2 flex items-end justify-between gap-4 lg:mb-10" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="t-caption-sm mb-4 flex items-center gap-3 text-soft">
            <span className="stitch-x inline-block h-[2px] w-8 text-indigo" aria-hidden="true" />{eyebrow}
          </p>
        )}
        <h1 className="text-[2.4rem] font-medium leading-[1.02] tracking-[-0.03em] text-ink lg:text-[3.3rem] [&_em]:font-display [&_em]:text-[1.1em] [&_em]:font-normal [&_em]:italic [&_em]:tracking-[-0.01em] [&_em]:text-indigo">{title}</h1>
        {lede && <p className="mt-4 max-w-[38ch] text-[15px] leading-relaxed text-soft">{lede}</p>}
      </div>
      {right}
    </motion.header>
  );
}

// ----------------------------------
// 6. SMALL PIECES
// ----------------------------------

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "sage" | "sun" | "coral" | "indigo" }) {
  const tones = {
    neutral: "text-faint",
    sage: "text-sage-ink",
    sun: "text-sun-ink",
    coral: "text-coral-ink",
    indigo: "text-indigo",
  };
  return <span className={`t-caption-sm inline-flex items-center gap-1.5 whitespace-nowrap ${tones[tone]}`}>{children}</span>;
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
    <div className="relative mb-3 mt-4 flex items-end justify-between pb-2.5">
      <span className="stitch-x absolute inset-x-0 bottom-0 h-[2px] text-line" aria-hidden="true" />
      <h2 className="t-caption-sm text-soft">{children}</h2>
      {action}
    </div>
  );
}
