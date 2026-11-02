// Screens and their titles. Navigation is the URL hash (#/insights), so the browser back button works.

export type Screen = "landing" | "dive" | "voice" | "face" | "home" | "checkin" | "insights" | "companion" | "support" | "play" | "breathe" | "planner";
export type Go = (s: Screen) => void;

export const TITLES: Record<Screen, string> = {
  landing: "MindMirror", dive: "The dive", voice: "Voice mode", face: "Face to face",
  home: "MindMirror", checkin: "Check in", insights: "Insights", companion: "Companion",
  support: "Support", play: "Play room", breathe: "Breathe", planner: "Planner",
};

/** Full-screen rooms that draw their own world (no side rail, no tab bar).
 *  "landing" is the editorial front page; "dive" is the particle-field intro it links to. */
export const IMMERSIVE: Screen[] = ["landing", "dive", "voice", "face"];
