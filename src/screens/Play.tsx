import { useState } from "react";
import { copy } from "../content/copy";
import BubbleWrap from "../games/BubbleWrap";
import WorryShredder from "../games/WorryShredder";
import Ripples from "../games/Ripples";

type GameName = "bubbleWrap" | "worryShredder" | "ripples";

export default function Play() {
  const [activeGame, setActiveGame] = useState<GameName | null>(null);

  const games = [
    { id: "bubbleWrap" as const, component: <BubbleWrap /> },
    { id: "worryShredder" as const, component: <WorryShredder /> },
    { id: "ripples" as const, component: <Ripples /> },
  ];

  if (activeGame) {
    const selected = games.find((game) => game.id === activeGame);

    return (
      <main className="mx-auto min-h-screen w-full max-w-[480px] p-5">
        <button
          onClick={() => setActiveGame(null)}
          className="mb-6 rounded-full bg-[#FBF7F0] px-5 py-3 text-sm font-semibold text-[#34365F]"
        >
          ← Back to Play room
        </button>
        {selected?.component}
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[480px] p-5">
      <h1 className="mb-2 text-3xl font-bold text-[#34365F]">
        Play room
      </h1>

      <p className="mb-7 text-sm text-gray-600">
        No scores. No timers. No way to lose.
      </p>

      <div className="space-y-4">
        {games.map((game) => {
          const details = copy.games[game.id];

          return (
            <button
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className="flex w-full items-center gap-4 rounded-3xl bg-[#FBF7F0] p-5 text-left shadow-sm transition hover:shadow-md"
            >
              <span className="text-4xl">{details.emoji}</span>

              <span>
                <span className="block font-bold text-[#34365F]">
                  {details.title}
                </span>
                <span className="mt-1 block text-sm text-gray-600">
                  {details.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </main>
  );
}