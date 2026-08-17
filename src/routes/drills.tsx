import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { DRILLS, PILLAR_LABEL } from "@/lib/training/drills";
import type { Pillar } from "@/lib/training/types";
import { videosForDrill } from "@/lib/training/videos";
import { cn } from "@/lib/utils";
import { useTrainingStore } from "@/store/training-store";

export const Route = createFileRoute("/drills")({ component: DrillsPage });

const FILTERS: (Pillar | "all")[] = [
  "all",
  "ball",
  "shooting",
  "passing",
  "speed",
  "agility",
  "strength",
];

function DrillsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const videoLinks = useTrainingStore((s) => s.videoLinks);
  const list = useMemo(
    () => (filter === "all" ? DRILLS : DRILLS.filter((d) => d.pillar === filter)),
    [filter],
  );

  return (
    <AppShell>
      <section>
        <p className="font-display text-xs uppercase tracking-[0.22em] text-muted">
          Library
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-5xl uppercase leading-none tracking-tight">
            Drills
          </h1>
          <Link
            to="/videos"
            className="inline-flex h-11 items-center rounded-md bg-surface px-4 text-sm text-fg shadow-[var(--shadow-border)]"
          >
            X locker
          </Link>
        </div>
        <p className="mt-4 max-w-xl text-muted">
          The same blocks that build the 12-week path. Link bookmarked X videos
          for instruction, then run the session with a timer.
        </p>
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "h-10 shrink-0 rounded-full px-4 text-sm",
                filter === f ? "bg-accent text-accent-fg" : "bg-surface text-muted",
              )}
            >
              {f === "all" ? "All" : PILLAR_LABEL[f]}
            </button>
          ))}
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {list.map((d) => {
            const clips = videosForDrill(videoLinks, d.id);
            return (
              <li key={d.id}>
                <Link
                  to="/drills/$drillId"
                  params={{ drillId: d.id }}
                  className="block rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] transition-shadow duration-150 hover:shadow-[var(--shadow-border-hover)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge>{PILLAR_LABEL[d.pillar]}</Badge>
                    {clips.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <Play className="size-3" />
                        {clips.length}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-3 font-display text-2xl uppercase leading-none">
                    {d.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted">{d.focus}</p>
                  <p className="mt-4 text-xs uppercase tracking-wide text-subtle">
                    {d.timer.sets} sets · {d.space}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </AppShell>
  );
}
