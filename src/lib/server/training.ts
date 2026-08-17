import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type {
  DrillVideo,
  PersonalRecord,
  PillarXp,
  PreferredFoot,
  SessionLog,
  TrainingMode,
} from "@/lib/training/types";

const scoreEntrySchema = z.object({
  kind: z.enum(["none", "makes", "time", "reps", "quality"]),
  makes: z.number().optional(),
  attempts: z.number().optional(),
  timeSec: z.number().optional(),
  reps: z.number().optional(),
  quality: z.number().optional(),
});

const sessionLogSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  week: z.number(),
  completedOn: z.string(),
  durationSec: z.number(),
  quality: z.number(),
  mode: z.enum(["solo", "partner", "trainer"]),
  exerciseKeys: z.array(z.string()),
  scores: z.record(z.string(), scoreEntrySchema),
});

const profileSchema = z.object({
  playerName: z.string(),
  preferredFoot: z.enum(["right", "left"]),
  mode: z.enum(["solo", "partner", "trainer"]),
  onboardingDone: z.boolean(),
  streak: z.number(),
  lastSessionDate: z.string().nullable(),
  pillarXp: z.object({
    ball: z.number(),
    shooting: z.number(),
    passing: z.number(),
    speed: z.number(),
    agility: z.number(),
    strength: z.number(),
  }),
  records: z.array(
    z.object({
      metric: z.string(),
      label: z.string(),
      value: z.number(),
      unit: z.string(),
      recordedOn: z.string(),
    }),
  ),
  videoLinks: z
    .array(
      z.object({
        id: z.string(),
        statusId: z.string(),
        url: z.string(),
        handle: z.string().nullable(),
        label: z.string(),
        drillIds: z.array(z.string()),
        addedOn: z.string(),
      }),
    )
    .optional(),
});

export type RemoteProgress = {
  playerName: string;
  preferredFoot: PreferredFoot;
  mode: TrainingMode;
  onboardingDone: boolean;
  streak: number;
  lastSessionDate: string | null;
  pillarXp: PillarXp;
  sessionLogs: SessionLog[];
  records: PersonalRecord[];
  videoLinks: DrillVideo[];
};

export const loadProgress = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<RemoteProgress> => {
    const sql = await getSql();
    const profiles = await sql<{
      player_name: string;
      preferred_foot: string;
      training_mode: string;
      onboarding_done: boolean;
      streak: number;
      last_session_date: string | null;
      pillar_ball: number;
      pillar_shooting: number;
      pillar_passing: number;
      pillar_speed: number;
      pillar_agility: number;
      pillar_strength: number;
      video_links: string | null;
    }>`
      select player_name, preferred_foot, training_mode, onboarding_done, streak,
             last_session_date, pillar_ball, pillar_shooting, pillar_passing,
             pillar_speed, pillar_agility, pillar_strength, video_links
      from player_profiles
      where user_id = ${context.userId}
    `;
    const logs = await sql<{
      id: string;
      session_id: string;
      week: number;
      completed_on: string;
      duration_sec: number;
      quality: number;
      mode: string;
      exercise_keys: string;
      scores: string;
    }>`
      select id, session_id, week, completed_on, duration_sec, quality, mode,
             exercise_keys, scores
      from session_logs
      where user_id = ${context.userId}
      order by completed_on desc
      limit 200
    `;
    const recs = await sql<{
      metric: string;
      label: string;
      value: number;
      unit: string;
      recorded_on: string;
    }>`
      select metric, label, value, unit, recorded_on
      from personal_records
      where user_id = ${context.userId}
    `;
    const p = profiles[0];
    return {
      playerName: p?.player_name ?? "",
      preferredFoot: (p?.preferred_foot as PreferredFoot) ?? "right",
      mode: (p?.training_mode as TrainingMode) ?? "solo",
      onboardingDone: Boolean(p?.onboarding_done),
      streak: p?.streak ?? 0,
      lastSessionDate: p?.last_session_date ?? null,
      pillarXp: {
        ball: p?.pillar_ball ?? 0,
        shooting: p?.pillar_shooting ?? 0,
        passing: p?.pillar_passing ?? 0,
        speed: p?.pillar_speed ?? 0,
        agility: p?.pillar_agility ?? 0,
        strength: p?.pillar_strength ?? 0,
      },
      sessionLogs: logs.map((row) => ({
        id: row.id,
        sessionId: row.session_id,
        week: Number(row.week),
        completedOn: row.completed_on,
        durationSec: Number(row.duration_sec),
        quality: Number(row.quality),
        mode: row.mode as TrainingMode,
        exerciseKeys: safeJson(row.exercise_keys, [] as string[]),
        scores: safeJson(row.scores, {}),
      })),
      records: recs.map((r) => ({
        metric: r.metric,
        label: r.label,
        value: Number(r.value),
        unit: r.unit,
        recordedOn: r.recorded_on,
      })),
      videoLinks: safeJson(p?.video_links ?? "[]", [] as DrillVideo[]),
    };
  });

export const saveProgress = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        profile: profileSchema,
        log: sessionLogSchema.optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const { profile, log } = data;
    await sql`
      insert into player_profiles (
        user_id, player_name, preferred_foot, training_mode, onboarding_done,
        streak, last_session_date, pillar_ball, pillar_shooting, pillar_passing,
        pillar_speed, pillar_agility, pillar_strength, video_links, updated_at
      ) values (
        ${context.userId}, ${profile.playerName}, ${profile.preferredFoot},
        ${profile.mode}, ${profile.onboardingDone}, ${profile.streak},
        ${profile.lastSessionDate}, ${profile.pillarXp.ball}, ${profile.pillarXp.shooting},
        ${profile.pillarXp.passing}, ${profile.pillarXp.speed}, ${profile.pillarXp.agility},
        ${profile.pillarXp.strength}, ${JSON.stringify(profile.videoLinks ?? [])}, now()
      )
      on conflict (user_id) do update set
        player_name = excluded.player_name,
        preferred_foot = excluded.preferred_foot,
        training_mode = excluded.training_mode,
        onboarding_done = excluded.onboarding_done,
        streak = excluded.streak,
        last_session_date = excluded.last_session_date,
        pillar_ball = excluded.pillar_ball,
        pillar_shooting = excluded.pillar_shooting,
        pillar_passing = excluded.pillar_passing,
        pillar_speed = excluded.pillar_speed,
        pillar_agility = excluded.pillar_agility,
        pillar_strength = excluded.pillar_strength,
        video_links = excluded.video_links,
        updated_at = now()
    `;
    if (log) {
      await sql`
        insert into session_logs (
          id, user_id, session_id, week, completed_on, duration_sec, quality,
          mode, exercise_keys, scores
        ) values (
          ${log.id}, ${context.userId}, ${log.sessionId}, ${log.week},
          ${log.completedOn}, ${log.durationSec}, ${log.quality}, ${log.mode},
          ${JSON.stringify(log.exerciseKeys)}, ${JSON.stringify(log.scores)}
        )
        on conflict (id) do nothing
      `;
    }
    for (const rec of profile.records) {
      await sql`
        insert into personal_records (
          user_id, metric, label, value, unit, recorded_on
        ) values (
          ${context.userId}, ${rec.metric}, ${rec.label}, ${rec.value},
          ${rec.unit}, ${rec.recordedOn}
        )
        on conflict (user_id, metric) do update set
          label = excluded.label,
          value = excluded.value,
          unit = excluded.unit,
          recorded_on = excluded.recorded_on
      `;
    }
    return { ok: true as const };
  });

function safeJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
