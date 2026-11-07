// The browser's own AI brain, for when the laptop hub isn't running (GitHub Pages, a phone).
//
// Order: your own key (Settings → AI brain: a free Groq key or an OpenRouter key, kept on this
// device) → a free, keyless public model → kind offline replies. Each conversation keeps its
// history, so it remembers what you said and can talk about anything, like ChatGPT.

import { getPrefs } from "./prefs";

export type Persona = "reenu" | "roman";
export interface BrainOpts { mode?: "companion" | "therapist"; persona?: Persona; session?: string; context?: string }

const PERSONAS: Record<Persona, string> = {
  reenu: "You are Reenu: warm, curious and gentle, with the listening skills of an experienced therapist.",
  roman: "You are Roman: calm and steady, with a little dry, kind humour, like a trusted friend who also listens well.",
};

/** The same voice everywhere: a real conversational assistant first, a kind listener when it matters. */
export function systemPrompt(opts: BrainOpts = {}) {
  const who = opts.mode === "therapist" ? PERSONAS[opts.persona ?? "reenu"] : "You are MindMirror, a friendly, warm voice assistant.";
  return `${who}
You talk like ChatGPT in voice mode: you understand whatever the person says and answer it properly.
Talk about anything and everything they bring up: questions, facts, studies, coding, science, films, cricket, jokes, stories, advice, plans or just chatting.
Never just repeat their words back. Answer the actual question or continue the conversation with something new and useful.
Remember everything said earlier in this conversation and build on it.
If they share how they feel, listen like a good counsellor: name the feeling gently, validate it, and offer one small helpful idea or one open question.
You are an AI, not a doctor or licensed therapist: never diagnose or name a disorder. If they seem unsafe, gently point to Tele MANAS on 14416, or 112 in danger.
Your words are spoken aloud, so use natural spoken sentences: no markdown, no bullet lists, no emojis, no code blocks.
Keep it to about 2 to 4 sentences unless they ask for more detail, a story or an explanation.${opts.context ? `\nWhat the app knows about their week (mention only if it fits): ${opts.context}` : ""}`;
}

type Msg = { role: "system" | "user" | "assistant"; content: string };

// Short memory per conversation.
const memory = new Map<string, Msg[]>();
function history(session = "") {
  return memory.get(session) ?? [];
}
export function remember(session: string | undefined, user: string, assistant: string) {
  if (!session) return;
  const h = [...history(session), { role: "user" as const, content: user }, { role: "assistant" as const, content: assistant }];
  memory.set(session, h.slice(-20));
  if (memory.size > 30) memory.delete(memory.keys().next().value as string);
}

/** Spoken text should not carry markdown. */
export function forSpeech(s: string) {
  return s
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_#`>]+/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+\n/g, "\n")
    .trim();
}

async function openAiStyle(url: string, key: string | null, model: string, messages: Msg[], extra: Record<string, string> = {}, body: Record<string, unknown> = {}) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}), ...extra },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 500, ...body }),
    signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) throw new Error(`${model} ${r.status}`);
  const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  const text = j.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`${model} empty`);
  return text;
}

/** Which brain answers when there's no hub. */
export function brainName(): string {
  const k = getPrefs().aiKey.trim();
  if (k.startsWith("gsk_")) return "Groq (your key)";
  if (k.startsWith("sk-or-")) return "OpenRouter (your key)";
  return "free public model";
}

function tries(messages: Msg[]): (() => Promise<string>)[] {
  const key = getPrefs().aiKey.trim();
  const out: (() => Promise<string>)[] = [];
  if (key.startsWith("gsk_")) {
    out.push(() => openAiStyle("https://api.groq.com/openai/v1/chat/completions", key, "llama-3.3-70b-versatile", messages));
    out.push(() => openAiStyle("https://api.groq.com/openai/v1/chat/completions", key, "llama-3.1-8b-instant", messages));
  } else if (key) {
    out.push(() => openAiStyle("https://openrouter.ai/api/v1/chat/completions", key, "openai/gpt-4o-mini", messages,
      { "HTTP-Referer": "https://pankqx.github.io/MindMirror/", "X-Title": "MindMirror" }));
  }
  // Free and keyless (Pollinations, OpenAI-compatible). Good enough for a demo; your own key is faster.
  out.push(() => openAiStyle("https://text.pollinations.ai/openai", null, "openai", messages, {}, { referrer: "mindmirror", private: true }));
  return out;
}

/** Ask an AI from the browser. Throws if no brain can be reached (the caller then answers offline). */
export async function think(text: string, opts: BrainOpts = {}): Promise<string> {
  const messages: Msg[] = [{ role: "system", content: systemPrompt(opts) }, ...history(opts.session), { role: "user", content: text }];
  let last: unknown = new Error("no AI reachable");
  for (const t of tries(messages)) {
    try {
      const reply = forSpeech(await t()).slice(0, 1200);
      remember(opts.session, text, reply);
      return reply;
    } catch (e) {
      last = e;
    }
  }
  throw last;
}
