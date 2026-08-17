import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { SkillRadar } from "@/components/skill-radar";
import { Badge } from "@/components/ui/badge";
import { PILLAR_LABEL } from "@/lib/training/drills";
import { getSessionById } from "@/lib/training/program";
import { programCompletion } from "@/lib/training/progress";
import type { Pillar } from "@/lib/training/types";
import { useTrainingStore } from "@/store/training-store";

export const Route = createFileRoute("/tracker")({ component: TrackerPage });

const PILLARS: Pillar[] = [
  "ball",
  "shooting",
  "passing",
  "speed",
  "agility",
  "strength",
];

function TrackerPage() {
  const logs = useTrainingStore((s) => s.sessionLogs);
  const xp = useTrainingStore((s) => s.pillarXp);
  const records = useTrainingStore((s) => s.records);
  const streak = useTrainingStore((s) => s.streak);
  const playerName = useTrainingStore((s) => s.playerName);
  const prog = useMemo(() => programCompletion(logs), [logs]);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of [...logs].reverse()) {
      map.set(log.completedOn, (map.get(log.completedOn) ?? 0) + 1);
    }
    return [...map.entries()].slice(-14).map(([day, count]) => ({
      day: day.slice(5),
      sessions: count,
    }));
  }, [logs]);

  const maxXp = Math.max(1, ...PILLARS.map((p) => xp[p]));

  return (
    <AppShell>
      <section>
        <p className="font-display text-xs uppercase tracking-[0.22em] text-muted">
          Development
        </p>
        <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-tight">
          {playerName ? `${playerName}'s tracker` : "Tracker"}
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          Six pillars. Scores you actually logged. A streak you have to earn on
          the grass.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <HeroStat label="Streak" value={`${streak}d`} />
          <HeroStat label="Sessions" value={`${prog.done}`} />
          <HeroStat label="Path" value={`${Math.round((prog.done / prog.total) * 100)}%`} />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-xl uppercase">Skill map</h2>
            <SkillRadar xp={xp} />
          </article>
          <article className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-xl uppercase">Recent volume</h2>
            <div className="radar-box mt-2">
              {ready ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={byDay.length ? byDay : [{ day: "—", sessions: 0 }]}>
                    <XAxis dataKey="day" tick={{ fill: "var(--color-subtle)", fontSize: 11 }} />
                    <YAxis
                      allowDecimals={false}
                      width={24}
                      tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-raised)",
                        border: "1px solid var(--color-line)",
                        color: "var(--color-fg)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      stroke="var(--color-accent)"
                      fill="var(--color-accent)"
                      fillOpacity={0.16}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </article>
        </div>

        <div className="mt-8">
          <h2 className="font-display text-xl uppercase">Pillars</h2>
          <div className="mt-4 space-y-4">
            {PILLARS.map((p) => (
              <div key={p}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{PILLAR_LABEL[p]}</span>
                  <span className="tabular text-muted">{xp[p]}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-raised">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(xp[p] / maxXp) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl uppercase">Marks</h2>
          {records.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Log times and makes during sessions. Records show up here.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {records.map((r) => (
                <li
                  key={r.metric}
                  className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]"
                >
                  <p className="text-xs uppercase tracking-wide text-subtle">{r.label}</p>
                  <p className="mt-2 font-display text-3xl tabular leading-none">
                    {r.unit === "s" ? r.value.toFixed(2) : r.value}
                    <span className="ml-1 text-base text-muted">{r.unit}</span>
                  </p>
                  <p className="mt-2 text-xs text-subtle">{r.recordedOn}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl uppercase">Session log</h2>
          {logs.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing logged yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {logs.slice(0, 16).map((log) => {
                const session = getSessionById(log.sessionId);
                return (
                <li
                  key={log.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
                >
                  <div>
                    <p className="text-sm text-fg">{session?.title ?? log.sessionId}</p>
                    <p className="text-xs text-subtle">
                      {log.completedOn} · {Math.round(log.durationSec / 60)} min · {log.mode}
                      {session?.subtitle ? ` · ${session.subtitle}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline">Q{log.quality}</Badge>
                </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="text-xs uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-2 font-display text-4xl tabular leading-none">{value}</p>
    </div>
  );
}
