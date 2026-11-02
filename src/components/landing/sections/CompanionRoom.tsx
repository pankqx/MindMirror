// Through the mirror: the companion's room. First visit, you choose Reenu or Roman;
// after that, whoever you chose is standing here, nearly as tall as the screen, ready to talk.

import { AnimatePresence, motion } from "framer-motion";
import { Choose, Stage } from "../../companion/Stage";
import { setCompanion, useCompanion } from "../../../lib/companion";
import { ease } from "../motion";

export function CompanionRoom({ onApp }: { onApp: () => void }) {
  const who = useCompanion();
  return (
    <div className="bg-neel text-white">
      <AnimatePresence mode="wait">
        <motion.div key={who ?? "choose"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease }}>
          {who
            ? <Stage who={who} onSwitch={() => setCompanion(who === "reenu" ? "roman" : "reenu")} onApp={onApp} />
            : <Choose onPick={setCompanion} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
