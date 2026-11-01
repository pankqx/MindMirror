import SignalCard from "../components/SignalCard";

export default function TestSignals() {
  return (
    <div className="space-y-3 p-4">

      <SignalCard
        name="Sleep"
        icon="🌙"
        level="watch"
        proof="Your sleep average is 5.4 hours."
      />

      <SignalCard
        name="Energy"
        icon="⚡"
        level="steady"
        proof="Your energy is consistent."
      />

      <SignalCard
        name="Connection"
        icon="🤝"
        level="learning"
        proof=""
      />

    </div>
  );
}