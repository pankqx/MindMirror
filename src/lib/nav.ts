// Screens and their titles. Navigation is the URL hash (#/insights), so the browser back button works.

export type Screen = "landing" | "voice" | "face" | "home" | "checkin" | "insights" | "companion" | "support" | "play" | "breathe" | "planner";
export type Go = (s: Screen) => void;

export const TITLES: Record<Screen, string> = {
  landing: "MindMirror", voice: "Voice mode", face: "Face to face",
  home: "MindMirror", checkin: "Check in", insights: "Insights", companion: "Companion",
  support: "Support", play: "Play room", breathe: "Breathe", planner: "Planner",
};

/** Full-screen rooms that draw their own world (no side rail, no tab bar). */
export const IMMERSIVE: Screen[] = ["landing", "voice", "face"];
