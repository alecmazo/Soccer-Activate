import { Bookmark, ExternalLink, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { persistIfSignedIn } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { DRILLS, PILLAR_LABEL } from "@/lib/training/drills";
import type { DrillVideo, Pillar } from "@/lib/training/types";
import {
  drillName,
  embedUrl,
  extractXStatusUrls,
  watchUrl,
  X_BOOKMARKS_URL,
} from "@/lib/training/videos";
import { cn } from "@/lib/utils";
import { useTrainingStore } from "@/store/training-store";

const PILLARS = Object.keys(PILLAR_LABEL) as Pillar[];

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
  const [picked, setPicked] = useState<string[]>(
    defaultDrillId ? [defaultDrillId] : [],
  );

  const parsed = useMemo(() => extractXStatusUrls(url), [url]);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const clips = extractXStatusUrls(url);
        if (clips.length === 0) {
          setError("Paste one or more X post URLs from your bookmarks.");
          return;
        }
        const drillIds = defaultDrillId
          ? [...new Set([defaultDrillId, ...picked])]
          : picked;
        for (const clip of clips) {
          addVideo({
            statusId: clip.statusId,
            url: clip.url,
            handle: clip.handle,
            label: clips.length === 1 ? label.trim() : label.trim(),
            drillIds,
          });
        }
        persistIfSignedIn();
        const assigned =
          drillIds.length === 0
            ? "Unassigned — pick drills on the clip below."
            : `Assigned to ${drillIds.length} drill${drillIds.length === 1 ? "" : "s"}.`;
        toast.success(
          clips.length === 1
            ? `Linked. ${assigned}`
            : `Linked ${clips.length} clips. ${assigned}`,
        );
        setUrl("");
        setLabel("");
        setError("");
        onAdded?.();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-subtle">
          X bookmark URLs
        </span>
        <a
          href={X_BOOKMARKS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-xs text-muted hover:text-fg"
        >
          <Bookmark className="size-3.5" />
          Open bookmarks
        </a>
      </div>
      <textarea
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={"https://x.com/…/status/…\nPaste several links — one per line."}
        rows={3}
        className="w-full rounded-md bg-raised px-3 py-3 text-sm text-fg placeholder:text-subtle"
        autoComplete="off"
      />
      {parsed.length > 0 ? (
        <p className="text-xs text-subtle">
          {parsed.length} clip{parsed.length === 1 ? "" : "s"} ready to link
        </p>
      ) : null}
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
      <div>
        <p className="text-xs uppercase tracking-wide text-subtle">
          Assign to drills
        </p>
        <p className="mt-1 text-xs text-subtle">
          Tap the drills this clip teaches. Watch shows up on those cards and
          mid-session.
        </p>
        <DrillPicker value={picked} onChange={setPicked} />
      </div>
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      <Button type="submit" className="w-full" size="lg">
        {parsed.length > 1 ? `Link ${parsed.length} videos` : "Link video"}
      </Button>
    </form>
  );
}

function DrillPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [pillar, setPillar] = useState<Pillar | "all">("all");
  const list = pillar === "all" ? DRILLS : DRILLS.filter((d) => d.pillar === pillar);

  return (
    <div className="mt-3">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <PillChip
          label="All"
          on={pillar === "all"}
          onClick={() => setPillar("all")}
        />
        {PILLARS.map((p) => (
          <PillChip
            key={p}
            label={PILLAR_LABEL[p]}
            on={pillar === p}
            onClick={() => setPillar(p)}
          />
        ))}
      </div>
      <ul className="mt-2 grid max-h-48 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
        {list.map((d) => {
          const on = value.includes(d.id);
          return (
            <li key={d.id}>
              <button
                type="button"
                onClick={() =>
                  onChange(
                    on ? value.filter((id) => id !== d.id) : [...value, d.id],
                  )
                }
                className={cn(
                  "flex h-10 w-full items-center rounded-md px-3 text-left text-sm",
                  on ? "bg-accent text-accent-fg" : "bg-raised text-muted hover:text-fg",
                )}
              >
                {d.name}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PillChip({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 rounded-full px-3 text-xs",
        on ? "bg-accent text-accent-fg" : "bg-raised text-muted",
      )}
    >
      {label}
    </button>
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
  const [preview, setPreview] = useState(false);
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
            onClick={() => setPreview((v) => !v)}
            className="h-9 rounded-md px-3 text-xs text-muted hover:text-fg"
          >
            {preview ? "Hide preview" : "Preview"}
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
      {preview && !compact ? (
        <iframe
          title={video.label || "X video preview"}
          src={embedUrl(video.statusId)}
          className="mt-3 h-80 w-full rounded-md bg-bg"
          loading="lazy"
        />
      ) : null}
      {open && !compact ? (
        <div className="mt-2">
          <DrillPicker
            value={video.drillIds}
            onChange={(next) => {
              setVideoDrills(video.id, next);
              persistIfSignedIn();
            }}
          />
        </div>
      ) : null}
      {!compact && video.drillIds.length > 0 && !open ? (
        <p className="mt-1 text-xs text-subtle">
          {video.drillIds.map(drillName).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
