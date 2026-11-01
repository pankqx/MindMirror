import { useState } from "react";
import { copy } from "../content/copy";

type Props = {
  current: 0 | 1 | 2 | 3;
};

export default function Support({ current }: Props) {
  const [showCounsellor, setShowCounsellor] = useState(false);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[480px] p-5">
      <h1 className="mb-2 text-3xl font-bold text-[#34365F]">
        Support
      </h1>

      <p className="mb-7 text-sm text-gray-600">
        There's no one right way to feel better. Take things one step at a time.
      </p>

      <ol className="space-y-4">
        {copy.ladder.map((step, index) => (
          <li
            key={step.title}
            className={`rounded-3xl p-5 ${
              current === index
                ? "bg-[#8FB9A8] text-[#263D35]"
                : "bg-[#FBF7F0] text-[#34365F]"
            }`}
          >
            {current === index && (
              <p className="mb-2 text-xs font-bold uppercase">
                You are here
              </p>
            )}

            {index === current + 1 && (
              <p className="mb-2 text-xs font-bold">
                A gentle next step
              </p>
            )}

            <h2 className="font-bold">{step.title}</h2>
            <p className="mt-1 text-sm">{step.line}</p>
          </li>
        ))}
      </ol>

      <div className="mt-7 space-y-3">
        <a
          href="tel:14416"
          className="block rounded-full bg-[#E8836B] px-5 py-4 text-center font-bold text-white"
        >
          Call Tele-MANAS 14416
        </a>

        <a
          href="tel:112"
          className="block rounded-full bg-red-600 px-5 py-4 text-center font-bold text-white"
        >
          Emergency 112
        </a>

        <button
          onClick={() => setShowCounsellor((value) => !value)}
          className="w-full rounded-full bg-[#FBF7F0] px-5 py-4 font-semibold text-[#34365F]"
        >
          Campus counsellor
        </button>

        {showCounsellor && (
          <div className="rounded-2xl bg-[#FBF7F0] p-4 text-sm text-gray-600">
            Add your college counsellor's number here.
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-gray-500">
        {copy.disclaimer}
      </p>
    </main>
  );
}