// The support ladder and crisis words. Crisis words skip the AI and go straight to people.

export type Weather = "clear" | "clouds" | "rain" | "storm";

export interface Rung {
  step: 1 | 2 | 3 | 4;
  title: string;
  action: string;
}

export const LADDER: Record<Weather, Rung> = {
  clear: { step: 1, title: "Look after yourself", action: "Keep doing what works for you." },
  clouds: { step: 2, title: "A small step today", action: "Breathe for a minute, sleep a little earlier, or move one task." },
  rain: { step: 3, title: "Reach out", action: "Message a friend or a mentor you trust today." },
  storm: {
    step: 4,
    title: "Talk to someone trained",
    action: "Talk to your campus counsellor, or call Tele-MANAS 14416 (free, 24x7).",
  },
};

export const HELPLINES = [
  { name: "Tele-MANAS", number: "14416", note: "free, 24x7, mental health support" },
  { name: "Emergency", number: "112", note: "if you are in danger right now" },
];

// Same list as hub/server.mjs. Keep them in sync.
const CRISIS = [
  "kill myself", "suicide", "suicidal", "end my life", "want to die", "self harm", "self-harm",
  "hurt myself", "cut myself", "no reason to live", "better off without me", "end it all",
];

export function isCrisis(text: string | undefined | null): boolean {
  if (!text) return false;
  const t = text.toLowerCase().replace(/\s+/g, " ");
  return CRISIS.some((w) => t.includes(w));
}
