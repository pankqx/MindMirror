// The front page (#/landing): an editorial walk through MindMirror, room by room.
// Paper and coal sections alternate; every section lives in components/landing, every word in content/landing.

import { useEffect } from "react";
import type { Go } from "../lib/nav";
import { db } from "../lib/db";
import { unlockAudio } from "../lib/hub";
import { setPrefs, usePrefs } from "../lib/prefs";
import { loadSample } from "../lib/sample";
import { useLenis } from "../components/landing/kit";
import { Nav } from "../components/landing/Nav";
import { BreathCard, DiveTile, HelpPill } from "../components/landing/Floating";
import { Hero } from "../components/landing/sections/Hero";
import { Problem } from "../components/landing/sections/Problem";
import { Experience } from "../components/landing/sections/Experience";
import { How } from "../components/landing/sections/How";
import { Showcase } from "../components/landing/sections/Showcase";
import { Privacy } from "../components/landing/sections/Privacy";
import { Faq } from "../components/landing/sections/Faq";
import { Final, Footer } from "../components/landing/sections/Closing";

export default function Landing({ go }: { go: Go }) {
  const prefs = usePrefs();
  useLenis();

  // the landing is always paper, whatever the app theme
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const before = meta?.getAttribute("content");
    meta?.setAttribute("content", "#f1eee7");
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
    <div className="lp relative min-h-screen overflow-x-clip bg-paper text-coal">
      <Nav onStart={start} />
      <DiveTile go={go} />
      <main>
        <Hero onStart={start} />
        <Problem />
        <Experience />
        <How onSample={() => void sample()} />
        <Showcase go={go} />
        <Privacy onStart={start} />
        <Faq onStart={start} />
        <Final onStart={start} />
      </main>
      <Footer go={go} />
      <BreathCard go={go} />
      <HelpPill />
    </div>
  );
}
