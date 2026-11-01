
import {
  useEffect,
  useRef,
  useState,
} from "react";

export type Message = {
  from: "me" | "mindmirror";
  text: string;
  via?: "necklace" | "web";
};

type ChatProps = {
  messages: Message[];
  onSend: (text: string) => void;
  onHoldStart: () => void;
  onHoldEnd: () => void;
};

export default function Chat({
  messages,
  onSend,
  onHoldStart,
  onHoldEnd,
}: ChatProps) {

  const [input, setInput] = useState("");
  const [holding, setHolding] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to latest message

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // Send text message

  function handleSend() {
    const text = input.trim();

    if (!text) return;

    onSend(text);

    setInput("");
  }

  // Start voice recording

  function handleHoldStart() {
    if (holding) return;

    setHolding(true);
    onHoldStart();
  }

  // Stop voice recording

  function handleHoldEnd() {
    if (!holding) return;

    setHolding(false);
    onHoldEnd();
  }

  return (
    <div className="bg-cream rounded-2xl p-4 flex flex-col h-[550px]">

      {/* HEADER */}

      <div className="border-b border-gray-200 pb-3 mb-4">

        <h2 className="font-extrabold text-lg text-ink">
          MindMirror
        </h2>

        <p className="text-xs text-gray-500">
          Your companion
        </p>

      </div>

      {/* MESSAGES */}

      <div className="flex-1 overflow-y-auto space-y-4">

        {messages.map((message, index) => (

          <div
            key={index}
            className={`flex ${
              message.from === "me"
                ? "justify-end"
                : "justify-start"
            }`}
          >

            <div className="max-w-[85%]">

              {message.from === "mindmirror" && (
                <div className="text-xs text-gray-500 mb-1">
                  🌿 MindMirror
                </div>
              )}

              <div
                className={`p-3 rounded-2xl text-sm ${
                  message.from === "me"
                    ? "bg-indigo text-white rounded-br-sm"
                    : "bg-white text-ink rounded-bl-sm shadow-sm"
                }`}
              >
                {message.text}
              </div>

              {message.via === "necklace" && (
                <div className="text-xs text-gray-500 mt-1">
                  🎙 from necklace
                </div>
              )}

            </div>

          </div>

        ))}

        <div ref={messagesEndRef} />

      </div>

      {/* INPUT AREA */}

      <div className="border-t border-gray-200 pt-3 mt-3">

        <div className="flex gap-2">

          <input
            type="text"
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend();
              }
            }}
            placeholder="Share your thoughts..."
            className="flex-1 min-w-0 p-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-indigo"
          />

          <button
            onClick={handleSend}
            className="bg-indigo text-white px-4 rounded-xl font-bold"
          >
            Send
          </button>

        </div>

        {/* HOLD TO TALK */}

        <div className="flex justify-center mt-4">

          <button
            type="button"
            onPointerDown={handleHoldStart}
            onPointerUp={handleHoldEnd}
            onPointerLeave={handleHoldEnd}
            onPointerCancel={handleHoldEnd}
            className={`w-16 h-16 rounded-full text-2xl text-white transition ${
              holding
                ? "bg-coral scale-110 animate-pulse"
                : "bg-indigo"
            }`}
            aria-label="Hold to talk"
          >
            🎙
          </button>

        </div>

        <p className="text-center text-xs text-gray-500 mt-2">
          {holding
            ? "Listening..."
            : "Hold to talk"}
        </p>

      </div>

    </div>
  );
}
