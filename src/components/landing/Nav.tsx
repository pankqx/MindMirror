// The floating dark bar at the top of the landing: the mark, five mono links, the way in,
// and a slow status ticker underneath. On phones it folds into "Menu".

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { NAV, TICKER } from "../../content/landing";
import { ease, Mark, Ping, scrollToId } from "./kit";

function useActive(ids: readonly string[]) {
  const [active, setActive] = useState<string>("top");
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
    }, { rootMargin: "-45% 0px -50% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}

export function Nav({ onStart }: { onStart: () => void }) {
  const active = useActive(NAV.map((n) => n.id));
  const [open, setOpen] = useState(false);
  const go = (id: string) => { setOpen(false); scrollToId(id); };
  const tick = TICKER.join("  ·  ") + "  ·  ";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-start p-4 lg:justify-center lg:p-6">
        <motion.nav aria-label="Landing" className="pointer-events-auto overflow-hidden rounded-[4px] bg-coal text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
          initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9, ease, delay: 0.2 }}>
          <div className="flex h-11 items-center gap-1 pl-1.5 pr-1.5">
            <button onClick={() => go("top")} aria-label="MindMirror, back to top" className="grid size-8 place-items-center rounded-[3px] bg-white/[0.06] hover:bg-white/10">
              <Mark size={18} />
            </button>
            <span className="t-caption ml-2 mr-1 text-white lg:hidden">MindMirror</span>
            <ul className="hidden items-center lg:flex">
              {NAV.slice(1).map((n) => (
                <li key={n.id}>
                  <button onClick={() => go(n.id)} aria-current={active === n.id ? "true" : undefined}
                    className={`t-caption-sm relative px-3 py-2 transition-colors hover:text-white ${active === n.id ? "text-white" : "text-white/55"}`}>
                    {active === n.id && <motion.span layoutId="lp-nav-dot" className="absolute left-1/2 top-0.5 size-1 -translate-x-1/2 rounded-full bg-glow" />}
                    {n.label}
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={onStart} className="t-caption-sm ml-1 hidden h-8 items-center rounded-[3px] bg-paper px-3 text-coal transition-colors hover:bg-glow lg:flex">
              Get started
            </button>
            <button onClick={() => setOpen(true)} className="t-caption-sm ml-2 flex h-8 items-center px-2 text-white lg:hidden" aria-expanded={open} aria-controls="lp-menu">
              Menu
            </button>
          </div>
          {/* status ticker */}
          <div className="relative hidden h-6 w-0 min-w-full items-center overflow-hidden border-t border-white/10 lg:flex" aria-hidden="true">
            <span className="absolute left-2 z-10 flex items-center bg-coal pr-2"><Ping /></span>
            <div className="lp-ticker t-caption-sm flex w-max whitespace-nowrap pl-6 text-[10.5px] text-white/45">
              <span>{tick}</span><span>{tick}</span>
            </div>
          </div>
        </motion.nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div id="lp-menu" role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[60] flex flex-col bg-coal px-4 pb-8 pt-4 text-white"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex h-11 items-center justify-between">
              <span className="flex items-center gap-2"><Mark size={18} /><span className="t-caption">MindMirror</span></span>
              <button onClick={() => setOpen(false)} className="t-caption-sm h-10 px-2" autoFocus>Close</button>
            </div>
            <ul className="mt-14 flex flex-col">
              {NAV.map((n, i) => (
                <motion.li key={n.id} className="border-b border-white/12" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.5, ease }}>
                  <button onClick={() => go(n.id)} className="flex w-full items-baseline justify-between py-4 text-left">
                    <span className="t-headline">{n.label}</span>
                    <span className="t-caption-sm text-white/40">0{i + 1}</span>
                  </button>
                </motion.li>
              ))}
            </ul>
            <button onClick={() => { setOpen(false); onStart(); }} className="t-caption mt-auto flex h-12 items-center justify-center rounded-[3px] bg-paper text-coal">
              Get started
            </button>
            <a href="tel:14416" className="t-caption-sm mt-4 text-center text-white/55">Not okay right now? Tele-MANAS 14416, free, 24x7</a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
