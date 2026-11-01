
type SignalLevel =
  | "steady"
  | "watch"
  | "needs care"
  | "learning";

type SignalCardProps = {
  name: string;
  icon: string;
  level: SignalLevel;
  proof: string;
};

const levelStyles: Record<
  SignalLevel,
  string
> = {
  steady: "bg-sage/20 text-green-800",
  watch: "bg-amber-100 text-amber-800",
  "needs care": "bg-coral/20 text-red-800",
  learning: "bg-gray-100 text-gray-600",
};

export default function SignalCard({
  name,
  icon,
  level,
  proof,
}: SignalCardProps) {

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">

      <div className="flex justify-between items-center gap-3">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-cream flex items-center justify-center text-2xl">
            {icon}
          </div>

          <h3 className="font-bold text-ink">
            {name}
          </h3>

        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${levelStyles[level]}`}
        >
          {level}
        </span>

      </div>

      <p className="text-sm text-gray-500 mt-3 leading-relaxed">
        {level === "learning"
          ? "Learning your normal. More check-ins will help us understand your patterns."
          : proof}
      </p>

    </div>
  );
}
