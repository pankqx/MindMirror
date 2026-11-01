import { HELPLINES } from "../lib/support";

/** Shown whenever a crisis flag is set. Red is used only here. */
export default function UrgentHelp() {
  return (
    <div role="alert" className="rounded-2xl border-2 border-red-600 bg-red-50 p-5 space-y-3">
      <p className="font-bold text-red-700">You don't have to handle this alone.</p>
      <p className="text-sm">Please talk to someone right now. These are free and open all day and night.</p>
      <div className="flex flex-wrap gap-2">
        {HELPLINES.map((h) => (
          <a key={h.number} href={`tel:${h.number}`}
            className="rounded-full bg-red-600 px-5 py-3 font-semibold text-white min-h-11">
            Call {h.name} {h.number}
          </a>
        ))}
      </div>
    </div>
  );
}
