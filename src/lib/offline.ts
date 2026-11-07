/** Only when no AI can be reached at all (no hub, no internet). Code picks the step; nothing is diagnosed.
 *  It says honestly that the AI is offline, and never gives the same line twice in a row. */
let last = "";
let turn = 0;

export function offlineReply(t: string): string {
  const s = t.toLowerCase();
  const pool: string[] = [];
  if (/sleep|slept|tired|awake|night|exhaust/.test(s)) pool.push("Short nights add up. Could tonight be 30 minutes earlier, with the phone in another corner of the room?");
  if (/deadline|exam|assignment|record|study|pressure|marks/.test(s)) pool.push("That's a lot at once. Pick just the one task due first, and give it 25 focused minutes. That's enough for now.");
  if (/alone|lonely|nobody|friend|isolat/.test(s)) pool.push("Feeling alone is heavy. Is there one person you could message today, even just a hello?");
  if (/class|motivat|bother|pointless|lazy/.test(s)) pool.push("It's okay to feel flat. What's one small thing that would make today a little easier?");
  pool.push(
    "I can't reach my AI brain right now, so I can't answer that properly. Check the internet, or add a free Groq key in Settings, and ask me again.",
    "My AI is offline at the moment, so I only have simple replies. Once the internet or the hub is back, I can talk about anything you like.",
    "I heard you, but I'm offline right now. While we wait, one slow breath helps: in for four, out for six.",
  );
  const options = pool.filter((p) => p !== last);
  const r = options[turn++ % options.length];
  last = r;
  return r;
}
