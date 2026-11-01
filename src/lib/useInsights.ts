import { useLiveQuery } from "dexie-react-hooks";
import { db, localDate } from "./db";
import { computeInsights, type Insights } from "./signals";

/** Live insights from the browser database; re-computes whenever data changes. */
export function useInsights(): Insights | undefined {
  return useLiveQuery(async () => {
    const [checkins, voice, tasks] = await Promise.all([db.checkins.toArray(), db.voice.toArray(), db.tasks.toArray()]);
    return computeInsights(checkins, voice, tasks, localDate());
  }, []);
}
