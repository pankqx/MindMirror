/** If the hub is off, still answer kindly. Code picks the step; nothing is diagnosed. */
export function offlineReply(t: string): string {
  const s = t.toLowerCase();
  if (/sleep|slept|tired|awake|night|exhaust/.test(s)) return "Short nights add up. Could tonight be 30 minutes earlier, with the phone in another corner of the room?";
  if (/deadline|exam|assignment|record|study|pressure|marks/.test(s)) return "That's a lot at once. Pick just the one task due first, and give it 25 focused minutes. That's enough for now.";
  if (/alone|lonely|nobody|friend|isolat/.test(s)) return "Feeling alone is heavy. Is there one person you could message today, even just a hello?";
  if (/class|motivat|bother|pointless|lazy/.test(s)) return "It's okay to feel flat. What's one small thing that would make today a little easier?";
  return "Thank you for telling me. What's one small thing that would help you feel a bit lighter right now?";
}
