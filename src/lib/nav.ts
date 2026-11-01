// Screens and their titles. Navigation is the URL hash (#/insights), so the browser back button works.

export type Screen = "home" | "checkin" | "insights" | "companion" | "support" | "play" | "breathe" | "planner";
export type Go = (s: Screen) => void;

export const TITLES: Record<Screen, string> = {
  home: "MindMirror", checkin: "Check in", insights: "Insights", companion: "Companion",
  support: "Support", play: "Play room", breathe: "Breathe", planner: "Planner",
};
