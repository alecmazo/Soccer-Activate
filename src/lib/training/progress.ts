import {
  getProgramSession,
  PROGRAM_WEEKS,
  sessionIdFor,
  SESSIONS_PER_WEEK,
} from "./program";
import type { SessionLog } from "./types";

export function completedIds(logs: SessionLog[]) {
  return new Set(logs.map((l) => l.sessionId));
}

export function nextProgramSession(logs: SessionLog[]) {
  const done = completedIds(logs);
  for (let week = 1; week <= PROGRAM_WEEKS; week += 1) {
    for (const slot of [1, 2, 3, 4] as const) {
      const id = sessionIdFor(week, slot);
      if (!done.has(id)) return getProgramSession(week, slot);
    }
  }
  return getProgramSession(PROGRAM_WEEKS, 4);
}

export function weekCompletion(logs: SessionLog[], week: number) {
  const done = completedIds(logs);
  let n = 0;
  for (const slot of [1, 2, 3, 4] as const) {
    if (done.has(sessionIdFor(week, slot))) n += 1;
  }
  return n;
}

export function programCompletion(logs: SessionLog[]) {
  const done = completedIds(logs);
  let n = 0;
  for (let week = 1; week <= PROGRAM_WEEKS; week += 1) {
    for (const slot of [1, 2, 3, 4] as const) {
      if (done.has(sessionIdFor(week, slot))) n += 1;
    }
  }
  return { done: n, total: PROGRAM_WEEKS * SESSIONS_PER_WEEK };
}

export function currentWeekFromLogs(logs: SessionLog[]) {
  return nextProgramSession(logs).week || 1;
}
