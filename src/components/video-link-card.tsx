import { ExternalLink, Trash2 } from "lucide-react";
import { useState } from "react";
import { persistIfSignedIn } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { DRILLS } from "@/lib/training/drills";
import type { DrillVideo } from "@/lib/training/types";
import { drillName, parseXStatusUrl, watchUrl } from "@/lib/training/videos";
import { cn } from "@/lib/utils";
import { useTrainingStore } from "@/store/training-store";

export function VideoAddForm({
  defaultDrillId,
  onAdded,
}: {
  defaultDrillId?: string;
  onAdded?: () => void;
}) {
  const addVideo = useTrainingStore((s) => s.addVideo);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = parseXStatusUrl(url);
        if (!parsed) {
          setError("Paste an X post URL from your bookmarks — x.com/…/status/…");
          return;
        }
        addVideo({
          statusId: parsed.statusId,
          url: parsed.url,
          handle: parsed.handle,
          label: label.trim(),
          drillIds: defaultDrillId ? [defaultDrillId] : [],
        });
        persistIfSignedIn();
        setUrl("");
        setLabel("");
        setError("");
        onAdded?.();
      }}
    >
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-subtle">
          X bookmark URL
        </span>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://x.com/…/status/…"
          className="mt-2 h-12 w-full rounded-md bg-raised px-3 text-sm text-fg placeholder:text-subtle"
          inputMode="url"
          autoComplete="off"
        />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-subtle">
          Label (optional)
        </span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Weak-foot finishing demo"
          className="mt-2 h-12 w-full rounded-md bg-raised px-3 text-sm text-fg placeholder:text-subtle"
        />
      </label>
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      <Button type="submit" className="w-full" size="lg">
        Link video
      </Button>
    </form>
  );
}

export function VideoRow({
  video,
  compact,
}: {
  video: DrillVideo;
  compact?: boolean;
}) {
  const removeVideo = useTrainingStore((s) => s.removeVideo);
  const setVideoDrills = useTrainingStore((s) => s.setVideoDrills);
  const [open, setOpen] = useState(false);
  const href = watchUrl(video);

  return (
    <div className="rounded-xl bg-raised p-3">
      <div className="flex items-start gap-3">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1"
        >
          <p className="truncate text-sm text-fg">
            {video.label || (video.handle ? `@${video.handle}` : "X video")}
          </p>
          <p className="mt-1 truncate text-xs text-subtle">
            {video.handle ? `@${video.handle}` : "x.com"} · {video.statusId}
          </p>
        </a>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="press inline-flex h-11 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg"
        >
          Watch
          <ExternalLink className="size-3.5" />
        </a>
      </div>
      {!compact ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="h-9 rounded-md px-3 text-xs text-muted hover:text-fg"
          >
            {video.drillIds.length
              ? `${video.drillIds.length} drill${video.drillIds.length === 1 ? "" : "s"}`
              : "Assign to drills"}
          </button>
          <button
            type="button"
            onClick={() => {
              removeVideo(video.id);
              persistIfSignedIn();
            }}
            className="ml-auto inline-flex size-9 items-center justify-center rounded-md text-subtle hover:text-bad"
            aria-label="Remove video"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ) : null}
      {open && !compact ? (
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
          {DRILLS.map((d) => {
            const on = video.drillIds.includes(d.id);
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => {
                    const next = on
                      ? video.drillIds.filter((id) => id !== d.id)
                      : [...video.drillIds, d.id];
                    setVideoDrills(video.id, next);
                    persistIfSignedIn();
                  }}
                  className={cn(
                    "flex h-10 w-full items-center rounded-md px-3 text-left text-sm",
                    on ? "bg-accent text-accent-fg" : "text-muted hover:bg-surface",
                  )}
                >
                  {d.name}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {!compact && video.drillIds.length > 0 && !open ? (
        <p className="mt-1 text-xs text-subtle">
          {video.drillIds.map(drillName).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
