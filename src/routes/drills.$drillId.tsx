import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { VideoAddForm, VideoRow } from "@/components/video-link-card";
import { DRILL_MAP, PILLAR_LABEL } from "@/lib/training/drills";
import { videosForDrill } from "@/lib/training/videos";
import { formatPace } from "@/lib/utils";
import { useTrainingStore } from "@/store/training-store";

export const Route = createFileRoute("/drills/$drillId")({
  component: DrillDetail,
});

function DrillDetail() {
  const { drillId } = Route.useParams();
  const drill = DRILL_MAP[drillId];
  const mode = useTrainingStore((s) => s.mode);
  const videos = useTrainingStore((s) => videosForDrill(s.videoLinks, drillId));
  if (!drill) {
    return (
      <AppShell>
        <p className="text-muted">Drill not found.</p>
      </AppShell>
    );
  }
  const copy = drill.modes[mode];
  return (
    <AppShell>
      <Link
        to="/drills"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
      >
        <ChevronLeft className="size-4" />
        Library
      </Link>
      <Badge>{PILLAR_LABEL[drill.pillar]}</Badge>
      <h1 className="mt-3 font-display text-5xl uppercase leading-none tracking-tight">
        {drill.name}
      </h1>
      <p className="mt-4 max-w-xl text-muted">{drill.why}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Badge variant="outline">
          {drill.timer.sets} × {formatPace(drill.timer.workSec, drill.timer.restSec)}
        </Badge>
        <Badge variant="outline">{drill.space}</Badge>
        {drill.equipment.map((e) => (
          <Badge key={e} variant="outline">
            {e}
          </Badge>
        ))}
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-xs uppercase tracking-[0.18em] text-subtle">Setup</p>
          <p className="mt-2 text-sm text-fg">{drill.setup}</p>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-subtle">
            {mode} variant
          </p>
          <p className="mt-2 text-sm text-fg">{copy.setup}</p>
          <p className="mt-2 text-sm text-muted">{copy.cue}</p>
        </article>
        <article className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-xs uppercase tracking-[0.18em] text-subtle">Cues</p>
          <ul className="mt-3 space-y-2">
            {drill.cues.map((c) => (
              <li key={c} className="text-sm text-fg">
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs uppercase tracking-wide text-subtle">
            Target · {drill.targetNote}
          </p>
        </article>
      </div>

      <article className="mt-4 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-subtle">
              X instruction
            </p>
            <h2 className="mt-1 font-display text-2xl uppercase leading-none">
              Linked videos
            </h2>
          </div>
          <Link to="/videos" className="text-sm text-muted hover:text-fg">
            Open locker
          </Link>
        </div>
        {videos.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No clip on this drill yet. Paste a bookmarked X post below.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {videos.map((v) => (
              <li key={v.id}>
                <VideoRow video={v} compact />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5">
          <VideoAddForm defaultDrillId={drill.id} />
        </div>
      </article>
    </AppShell>
  );
}
