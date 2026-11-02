// The front page (#/landing): an editorial walk through MindMirror, room by room.
// Khadi and neel rooms alternate and stack; every section lives in components/landing, every word in content/landing.

import { useEffect } from "react";
import type { Go } from "../lib/nav";
import { db } from "../lib/db";
import { unlockAudio } from "../lib/hub";
import { setPrefs, usePrefs } from "../lib/prefs";
import { loadSample } from "../lib/sample";
import { useLenis } from "../components/landing/motion";
import { Nav } from "../components/landing/Nav";
import { BreathCard, DiveTile, HelpPill } from "../components/landing/Floating";
import { Hero } from "../components/landing/sections/Hero";
import { Problem } from "../components/landing/sections/Problem";
import { Experience } from "../components/landing/sections/Experience";
import { CompanionRoom } from "../components/landing/sections/CompanionRoom";
import { Normal } from "../components/landing/sections/Normal";
import { Room } from "../components/landing/Room";
import { How } from "../components/landing/sections/How";
import { Showcase } from "../components/landing/sections/Showcase";
import { Privacy } from "../components/landing/sections/Privacy";
import { Faq } from "../components/landing/sections/Faq";
import { Final, Footer } from "../components/landing/sections/Closing";

export default function Landing({ go }: { go: Go }) {
  const prefs = usePrefs();
  useLenis();

  // the landing is always khadi, whatever the app theme
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const before = meta?.getAttribute("content");
    meta?.setAttribute("content", "#f1ebdf");
    return () => { if (before) meta?.setAttribute("content", before); };
  }, []);

  /** Into the app. First-timers meet the welcome screen there (name, sample or fresh). */
  const start = () => {
    unlockAudio();
    go("home");
  };

  /** Straight into the sample: three weeks of Asha. Never overwrites real check-ins. */
  const sample = async () => {
    unlockAudio();
    if ((await db.checkins.count()) === 0) await loadSample();
    if (!prefs.welcomed) setPrefs({ welcomed: true, name: prefs.name || "Asha" });
    go("home");
  };

  return (
    <div className="lp relative min-h-screen bg-neel-deep text-neel">
      <Nav onStart={start} />
      <DiveTile go={go} />
      <main>
        <Room id="top" sink={false}><Hero onStart={start} /></Room>
        <Room id="companion"><CompanionRoom onApp={start} /></Room>
        <Room id="signals"><Problem /></Room>
        <Room id="normal"><Normal /></Room>
        <Room id="how"><How onSample={() => void sample()} /></Room>
        <Room id="features"><Experience /></Room>
        <Room id="insights"><Showcase go={go} /></Room>
        <Room id="about"><Privacy onStart={start} /></Room>
        <Room id="faq"><Faq onStart={start} /></Room>
        <Room id="end"><Final onStart={start} /></Room>
      </main>
      <Footer go={go} />
      <BreathCard go={go} />
      <HelpPill />
    </div>
  );
}
