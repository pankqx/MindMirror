
import { useState } from "react";

import CheckIn from "./screens/CheckIn";
import Breathe from "./screens/Breathe";

import Weather from "./components/Weather";
import SignalCard from "./components/SignalCard";
import Chat from "./components/Chat";

import type { Message } from "./components/Chat";

type Page =
  | "home"
  | "checkin"
  | "breathe"
  | "chat";

export default function App() {

  const [page, setPage] = useState<Page>("home");

  const [messages, setMessages] = useState<Message[]>([
    {
      from: "mindmirror",
      text: "Hello! How are you feeling today?",
    },
  ]);

  function handleCheckIn(data: {
    mood: number;
    stress: number;
    energy: number;
    sleepHours: number;
    connected: boolean;
    note: string;
  }) {
    console.log("Check-in data:", data);
    setPage("home");
  }

  function handleSend(text: string) {

    setMessages((previous) => [
      ...previous,
      {
        from: "me",
        text,
        via: "web",
      },
    ]);

    // AI response integration will be added later.
  }

  if (page === "checkin") {
    return (
      <CheckIn onSave={handleCheckIn} />
    );
  }

  if (page === "breathe") {
    return <Breathe />;
  }

  if (page === "chat") {
    return (
      <div className="max-w-[480px] mx-auto p-4">
        <Chat
          messages={messages}
          onSend={handleSend}
          onHoldStart={() => console.log("Voice started")}
          onHoldEnd={() => console.log("Voice stopped")}
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream p-5">

      <div className="max-w-[480px] mx-auto space-y-5">

        <h1 className="text-3xl font-extrabold text-ink">
          Good morning 🌿
        </h1>

        <p className="text-gray-500">
          Take a moment to check in with yourself.
        </p>

        <Weather
          kind="clouds"
          title="Passing clouds"
          message="A little time for yourself can make a difference."
        />

        <h2 className="font-bold text-xl">
          Your signals
        </h2>

        <SignalCard
          name="Sleep"
          icon="🌙"
          level="watch"
          proof="Your recent sleep average is 5.4 hours."
        />

        <SignalCard
          name="Energy"
          icon="⚡"
          level="steady"
          proof="Your energy is consistent."
        />

        <div className="grid grid-cols-2 gap-3">

          <button
            onClick={() => setPage("checkin")}
            className="bg-indigo text-white rounded-2xl p-4 font-bold"
          >
            Daily check-in
          </button>

          <button
            onClick={() => setPage("breathe")}
            className="bg-sage text-ink rounded-2xl p-4 font-bold"
          >
            Breathe
          </button>

        </div>

        <button
          onClick={() => setPage("chat")}
          className="w-full bg-white text-indigo rounded-2xl p-4 font-bold"
        >
          Talk to MindMirror
        </button>

      </div>

    </main>
  );
}
