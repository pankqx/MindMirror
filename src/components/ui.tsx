
import React from "react";

// ----------------------------------
// 1. BUTTON
// ----------------------------------

type ButtonProps = {
  variant?: "primary" | "soft" | "urgent";
  onClick?: () => void;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  onClick,
  children,
}: ButtonProps) {
  const styles = {
    primary: "bg-indigo text-white hover:opacity-90",
    soft: "bg-white text-indigo border border-indigo/20 hover:bg-indigo/5",
    urgent: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      onClick={onClick}
      className={`min-h-11 px-5 py-3 rounded-2xl font-bold transition ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

// ----------------------------------
// 2. CARD
// ----------------------------------

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
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
};

export function Slider({
  label,
  value,
  onChange,
  leftEmoji,
  rightEmoji,
}: SliderProps) {
  return (
    <div className="w-full space-y-4">

      <div className="flex justify-between items-center">
        <label className="font-bold text-ink">
          {label}
        </label>

        <span className="bg-indigo/10 text-indigo px-3 py-1 rounded-full font-bold">
          {value}/5
        </span>
      </div>

      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) =>
          onChange(Number(e.target.value))
        }
        className="w-full accent-indigo"
      />

      <div className="flex justify-between text-sm text-gray-500">
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

export function Toggle({
  value,
  onChange,
  yesLabel,
  noLabel,
}: ToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-3">

      <button
        type="button"
        onClick={() => onChange(true)}
        className={`min-h-11 p-3 rounded-2xl font-bold border ${
          value
            ? "bg-sage text-white border-sage"
            : "bg-white text-ink border-gray-200"
        }`}
      >
        {yesLabel}
      </button>

      <button
        type="button"
        onClick={() => onChange(false)}
        className={`min-h-11 p-3 rounded-2xl font-bold border ${
          !value
            ? "bg-sage text-white border-sage"
            : "bg-white text-ink border-gray-200"
        }`}
      >
        {noLabel}
      </button>

    </div>
  );
}

// ----------------------------------
// 5. SCREEN
// ----------------------------------

type ScreenProps = {
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
};

export function Screen({
  title,
  onBack,
  children,
}: ScreenProps) {
  return (
    <main className="min-h-screen bg-cream px-4 py-6">

      <div className="max-w-[480px] mx-auto">

        <header className="flex items-center gap-3 mb-6">

          {onBack && (
            <button
              onClick={onBack}
              aria-label="Go back"
              className="w-11 h-11 rounded-full bg-white shadow-sm text-indigo text-xl"
            >
              ←
            </button>
          )}

          <h1 className="text-2xl font-extrabold text-ink">
            {title}
          </h1>

        </header>

        {children}

      </div>

    </main>
  );
}
