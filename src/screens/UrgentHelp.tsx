import { motion } from "framer-motion";
import { PhoneIcon } from "../components/Icons";
import { HELPLINES } from "../lib/support";

/** Shown whenever a crisis flag is set. Red is used only here. */
export default function UrgentHelp() {
  return (
    <motion.div role="alert" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="space-y-3 rounded-3xl border-2 border-urgent bg-urgent/10 p-5">
      <p className="font-semibold text-urgent">You don't have to handle this alone.</p>
      <p className="text-sm text-ink">Please talk to someone right now. These are free and open all day and night.</p>
      <div className="flex flex-wrap gap-2">
        {HELPLINES.map((h) => (
          <a key={h.number} href={`tel:${h.number}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-urgent px-5 py-3 font-semibold text-white">
            <PhoneIcon size={18} /> Call {h.name} {h.number}
          </a>
        ))}
      </div>
    </motion.div>
  );
}
