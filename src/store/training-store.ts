import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DrillVideo,
  PersonalRecord,
  Pillar,
  PillarXp,
  PreferredFoot,
  ScoreEntry,
  SessionLog,
  TrainingMode,
} from "@/lib/training/types";
import { todayKey, uid } from "@/lib/utils";

const EMPTY_XP: PillarXp = {
  ball: 0,
  shooting: 0,
  passing: 0,
  speed: 0,
  agility: 0,
  strength: 0,
};

export type TrainingState = {
  hydrated: boolean;
  playerName: string;
  preferredFoot: PreferredFoot;
  mode: TrainingMode;
  onboardingDone: boolean;
  soundOn: boolean;
  sessionLogs: SessionLog[];
  pillarXp: PillarXp;
  records: PersonalRecord[];
  lastSessionDate: string | null;
  streak: number;
  videoLinks: DrillVideo[];
  setHydrated: (v: boolean) => void;
  setPlayerName: (name: string) => void;
  setPreferredFoot: (foot: PreferredFoot) => void;
  setMode: (mode: TrainingMode) => void;
  setOnboardingDone: (v: boolean) => void;
  setSoundOn: (v: boolean) => void;
  completeSession: (log: Omit<SessionLog, "id"> & { id?: string }) => SessionLog;
  applyRemote: (payload: {
    playerName?: string;
    preferredFoot?: PreferredFoot;
    mode?: TrainingMode;
    onboardingDone?: boolean;
    sessionLogs?: SessionLog[];
    pillarXp?: PillarXp;
    records?: PersonalRecord[];
    lastSessionDate?: string | null;
    streak?: number;
    videoLinks?: DrillVideo[];
  }) => void;
  addVideo: (video: Omit<DrillVideo, "id" | "addedOn"> & { id?: string; addedOn?: string }) => DrillVideo;
  removeVideo: (id: string) => void;
  setVideoDrills: (id: string, drillIds: string[]) => void;
  setVideoLabel: (id: string, label: string) => void;
  resetLocal: () => void;
};

function nextStreak(prev: number, lastDate: string | null, completedOn: string) {
  if (lastDate === completedOn) return Math.max(prev, 1);
  if (!lastDate) return 1;
  const last = new Date(`${lastDate}T12:00:00`);
  const cur = new Date(`${completedOn}T12:00:00`);
  const diff = Math.round((cur.getTime() - last.getTime()) / 86400000);
  if (diff === 1) return prev + 1;
  if (diff === 0) return Math.max(prev, 1);
  return 1;
}

function xpFromLog(log: SessionLog): PillarXp {
  const add = { ...EMPTY_XP };
  const per = Math.max(8, Math.round(18 + log.quality * 4));
  for (const key of log.exerciseKeys) {
    if (key.includes("shot")) add.shooting += per;
    else if (key.includes("pass")) add.passing += per;
    else if (key.includes("speed")) add.speed += per;
    else if (key.includes("agi")) add.agility += per;
    else if (key.includes("str") || key.includes("cool") || key.includes("act-"))
      add.strength += Math.round(per * 0.7);
    else add.ball += per;
  }
  return add;
}

function mergeXp(a: PillarXp, b: PillarXp): PillarXp {
  return {
    ball: a.ball + b.ball,
    shooting: a.shooting + b.shooting,
    passing: a.passing + b.passing,
    speed: a.speed + b.speed,
    agility: a.agility + b.agility,
    strength: a.strength + b.strength,
  };
}

function maybeRecord(
  records: PersonalRecord[],
  metric: string,
  label: string,
  value: number,
  unit: string,
  recordedOn: string,
  better: "max" | "min",
): PersonalRecord[] {
  const existing = records.find((r) => r.metric === metric);
  if (existing) {
    const wins = better === "max" ? value > existing.value : value < existing.value;
    if (!wins) return records;
    return records.map((r) =>
      r.metric === metric ? { metric, label, value, unit, recordedOn } : r,
    );
  }
  return [...records, { metric, label, value, unit, recordedOn }];
}

function recordsFromScores(
  records: PersonalRecord[],
  scores: Record<string, ScoreEntry>,
  on: string,
) {
  let next = records;
  for (const [key, score] of Object.entries(scores)) {
    if (score.kind === "makes" && score.makes != null && score.attempts) {
      const pct = Math.round((score.makes / score.attempts) * 100);
      next = maybeRecord(next, `${key}-acc`, "Accuracy mark", pct, "%", on, "max");
      if (key.includes("shot")) {
        next = maybeRecord(next, "best-shooting", "Best shooting score", score.makes, "makes", on, "max");
      }
    }
    if (score.kind === "time" && score.timeSec && score.timeSec > 0) {
      const metric = key.includes("speed-10")
        ? "best-10m"
        : key.includes("5105")
          ? "best-5105"
          : `${key}-time`;
      const label = key.includes("speed-10")
        ? "Best 10m"
        : key.includes("5105")
          ? "Best 5-10-5"
          : "Best timed run";
      next = maybeRecord(next, metric, label, score.timeSec, "s", on, "min");
    }
    if (score.kind === "reps" && score.reps) {
      next = maybeRecord(next, `${key}-reps`, "Rep mark", score.reps, "reps", on, "max");
    }
  }
  return next;
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      playerName: "",
      preferredFoot: "right",
      mode: "solo",
      onboardingDone: false,
      soundOn: true,
      sessionLogs: [],
      pillarXp: { ...EMPTY_XP },
      records: [],
      lastSessionDate: null,
      streak: 0,
      videoLinks: [],
      setHydrated: (v) => set({ hydrated: v }),
      setPlayerName: (playerName) => set({ playerName }),
      setPreferredFoot: (preferredFoot) => set({ preferredFoot }),
      setMode: (mode) => set({ mode }),
      setOnboardingDone: (onboardingDone) => set({ onboardingDone }),
      setSoundOn: (soundOn) => set({ soundOn }),
      completeSession: (incoming) => {
        const completedOn = incoming.completedOn || todayKey();
        const log: SessionLog = {
          ...incoming,
          id: incoming.id ?? uid(),
          completedOn,
        };
        const state = get();
        if (state.sessionLogs.some((s) => s.id === log.id)) return log;
        const streak = nextStreak(state.streak, state.lastSessionDate, completedOn);
        const pillarXp = mergeXp(state.pillarXp, xpFromLog(log));
        const records = recordsFromScores(state.records, log.scores, completedOn);
        set({
          sessionLogs: [log, ...state.sessionLogs].slice(0, 200),
          streak,
          lastSessionDate: completedOn,
          pillarXp,
          records,
        });
        return log;
      },
      applyRemote: (payload) => {
        const state = get();
        const localIds = new Set(state.sessionLogs.map((s) => s.id));
        const remoteLogs = payload.sessionLogs ?? [];
        const mergedLogs = [
          ...state.sessionLogs,
          ...remoteLogs.filter((s) => !localIds.has(s.id)),
        ].sort((a, b) => (a.completedOn < b.completedOn ? 1 : -1));
        const remoteXp = payload.pillarXp;
        const pillarXp = remoteXp
          ? {
              ball: Math.max(state.pillarXp.ball, remoteXp.ball),
              shooting: Math.max(state.pillarXp.shooting, remoteXp.shooting),
              passing: Math.max(state.pillarXp.passing, remoteXp.passing),
              speed: Math.max(state.pillarXp.speed, remoteXp.speed),
              agility: Math.max(state.pillarXp.agility, remoteXp.agility),
              strength: Math.max(state.pillarXp.strength, remoteXp.strength),
            }
          : state.pillarXp;
        const recMap = new Map(state.records.map((r) => [r.metric, r]));
        for (const rec of payload.records ?? []) {
          const cur = recMap.get(rec.metric);
          if (!cur) recMap.set(rec.metric, rec);
          else {
            const better =
              rec.unit === "s" ? rec.value < cur.value : rec.value > cur.value;
            if (better) recMap.set(rec.metric, rec);
          }
        }
        set({
          playerName: payload.playerName || state.playerName,
          preferredFoot: payload.preferredFoot ?? state.preferredFoot,
          mode: payload.mode ?? state.mode,
          onboardingDone: payload.onboardingDone ?? state.onboardingDone,
          sessionLogs: mergedLogs.slice(0, 200),
          pillarXp,
          records: [...recMap.values()],
          lastSessionDate: payload.lastSessionDate ?? state.lastSessionDate,
          streak: Math.max(state.streak, payload.streak ?? 0),
          videoLinks: mergeVideos(state.videoLinks, payload.videoLinks ?? []),
        });
      },
      addVideo: (incoming) => {
        const video: DrillVideo = {
          ...incoming,
          id: incoming.id ?? uid(),
          addedOn: incoming.addedOn ?? todayKey(),
          drillIds: [...new Set(incoming.drillIds)],
        };
        const existing = get().videoLinks;
        if (existing.some((v) => v.statusId === video.statusId)) {
          const updated = existing.map((v) =>
            v.statusId === video.statusId
              ? {
                  ...v,
                  label: video.label || v.label,
                  handle: video.handle ?? v.handle,
                  url: video.url || v.url,
                  drillIds: [...new Set([...v.drillIds, ...video.drillIds])],
                }
              : v,
          );
          set({ videoLinks: updated });
          return updated.find((v) => v.statusId === video.statusId) ?? video;
        }
        set({ videoLinks: [video, ...existing] });
        return video;
      },
      removeVideo: (id) =>
        set({ videoLinks: get().videoLinks.filter((v) => v.id !== id) }),
      setVideoDrills: (id, drillIds) =>
        set({
          videoLinks: get().videoLinks.map((v) =>
            v.id === id ? { ...v, drillIds: [...new Set(drillIds)] } : v,
          ),
        }),
      setVideoLabel: (id, label) =>
        set({
          videoLinks: get().videoLinks.map((v) =>
            v.id === id ? { ...v, label } : v,
          ),
        }),
      resetLocal: () =>
        set({
          sessionLogs: [],
          pillarXp: { ...EMPTY_XP },
          records: [],
          lastSessionDate: null,
          streak: 0,
          videoLinks: [],
        }),
    }),
    {
      name: "activate-training-v1",
      skipHydration: true,
      partialize: (s) => ({
        playerName: s.playerName,
        preferredFoot: s.preferredFoot,
        mode: s.mode,
        onboardingDone: s.onboardingDone,
        soundOn: s.soundOn,
        sessionLogs: s.sessionLogs,
        pillarXp: s.pillarXp,
        records: s.records,
        lastSessionDate: s.lastSessionDate,
        streak: s.streak,
        videoLinks: s.videoLinks,
      }),
    },
  ),
);

export function useHydrateTraining() {
  const setHydrated = useTrainingStore((s) => s.setHydrated);
  useEffect(() => {
    const persistApi = useTrainingStore.persist;
    if (!persistApi.hasHydrated()) {
      void Promise.resolve(persistApi.rehydrate()).then(() => setHydrated(true));
    } else {
      setHydrated(true);
    }
  }, [setHydrated]);
}

export { EMPTY_XP };

function mergeVideos(local: DrillVideo[], remote: DrillVideo[]) {
  const map = new Map<string, DrillVideo>();
  for (const v of remote) map.set(v.statusId, v);
  for (const v of local) {
    const cur = map.get(v.statusId);
    if (!cur) {
      map.set(v.statusId, v);
      continue;
    }
    map.set(v.statusId, {
      ...cur,
      ...v,
      label: v.label || cur.label,
      drillIds: [...new Set([...cur.drillIds, ...v.drillIds])],
    });
  }
  return [...map.values()];
}
