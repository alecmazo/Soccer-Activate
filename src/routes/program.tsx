import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  getAllProgramSessions,
  phaseLabel,
  PROGRAM_WEEKS,
  WEEK_TITLES,
} from "@/lib/training/program";
import { completedIds, programCompletion, weekCompletion } from "@/lib/training/progress";
import { cn } from "@/lib/utils";
import { useTrainingStore } from "@/store/training-store";

export const Route = createFileRoute("/program")({ component: ProgramPage });

function ProgramPage() {
  const logs = useTrainingStore((s) => s.sessionLogs);
  const done = useMemo(() => completedIds(logs), [logs]);
  const all = useMemo(() => getAllProgramSessions(), []);
  const prog = useMemo(() => programCompletion(logs), [logs]);

  return (
    <AppShell>
      <section>
        <p className="font-display text-xs uppercase tracking-[0.22em] text-muted">
          12-week path
        </p>
        <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-tight">
          The program
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          Four sessions a week. Technical Lab, Engine Room, Final Third, Combined.
          Volume and speed of play climb as the weeks go.
        </p>
        <div className="mt-6 max-w-md">
          <div className="mb-2 flex justify-between text-sm text-muted">
            <span>Path complete</span>
            <span className="tabular text-fg">
              {prog.done}/{prog.total}
            </span>
          </div>
          <Progress value={(prog.done / prog.total) * 100} />
        </div>

        <div className="mt-10 space-y-10">
          {Array.from({ length: PROGRAM_WEEKS }, (_, i) => i + 1).map((week) => {
            const sessions = all.filter((s) => s.week === week);
            const complete = weekCompletion(logs, week);
            return (
              <div key={week}>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="font-display text-xs uppercase tracking-[0.2em] text-subtle">
                      Week {week} · {phaseLabel(sessions[0]?.phase ?? "foundation")}
                    </p>
                    <h2 className="font-display text-2xl uppercase leading-none">
                      {WEEK_TITLES[week - 1]}
                    </h2>
                  </div>
                  <Badge variant={complete === 4 ? "good" : "default"}>
                    {complete}/4
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {sessions.map((s) => {
                    const on = done.has(s.id);
                    return (
                      <Link
                        key={s.id}
                        to="/session/$sessionId"
                        params={{ sessionId: s.id }}
                        className={cn(
                          "rounded-2xl p-4 shadow-[var(--shadow-border)] transition-shadow duration-150 hover:shadow-[var(--shadow-border-hover)]",
                          on ? "bg-raised" : "bg-surface",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-display text-lg uppercase leading-none">
                              {s.title}
                            </p>
                            <p className="mt-2 text-sm text-muted">{s.intent}</p>
                          </div>
                          {on ? (
                            <span className="grid size-6 place-items-center rounded-sm bg-good text-bg">
                              <Check className="size-3.5" />
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-4 text-xs uppercase tracking-wide text-subtle">
                          {s.durationMin} min · {s.exercises.length} blocks
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
