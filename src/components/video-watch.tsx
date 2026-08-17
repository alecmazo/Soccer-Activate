import { ExternalLink, Play, X } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { DrillVideo } from "@/lib/training/types";
import { embedUrl, watchUrl } from "@/lib/training/videos";
import { cn } from "@/lib/utils";

export function VideoWatchButton({
  video,
  children,
  className,
  onOpen,
}: {
  video: Pick<DrillVideo, "url" | "statusId" | "handle" | "label">;
  children?: ReactNode;
  className?: string;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const href = watchUrl(video);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onOpen?.();
          setOpen(true);
        }}
        className={className}
      >
        {children ?? (
          <>
            Watch
            <Play className="size-3.5" />
          </>
        )}
      </button>
      {open
        ? createPortal(
            <VideoWatchOverlay
              video={video}
              href={href}
              titleId={titleId}
              onClose={() => setOpen(false)}
            />,
            document.body,
          )
        : null}
    </>
  );
}

function VideoWatchOverlay({
  video,
  href,
  titleId,
  onClose,
}: {
  video: Pick<DrillVideo, "statusId" | "handle" | "label">;
  href: string;
  titleId: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const title = video.label || (video.handle ? `@${video.handle}` : "X instruction");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-subtle">
              Drill instruction
            </p>
            <h2 id={titleId} className="mt-1 truncate font-display text-xl uppercase">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-fg"
            aria-label="Close video"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="px-4 pb-3">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={watchButtonClass()}
          >
            Play on X
            <ExternalLink className="size-3.5" />
          </a>
          <p className="mt-2 text-xs text-subtle">
            X plays the full video. Preview below if the embed loads.
          </p>
        </div>
        <iframe
          title={title}
          src={embedUrl(video.statusId)}
          className="h-[min(56dvh,420px)] w-full bg-bg"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          loading="eager"
        />
        <p className="truncate px-4 py-3 text-xs text-subtle">
          {video.handle ? `@${video.handle}` : "Bookmarked on X"} · {video.statusId}
        </p>
      </div>
    </div>
  );
}

export function watchButtonClass(accent = true) {
  return cn(
    "press inline-flex h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium",
    accent ? "bg-accent text-accent-fg" : "bg-raised text-fg",
  );
}
