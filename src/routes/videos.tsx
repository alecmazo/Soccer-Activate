import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { VideoAddForm, VideoRow } from "@/components/video-link-card";
import { useTrainingStore } from "@/store/training-store";

export const Route = createFileRoute("/videos")({ component: VideosPage });

function VideosPage() {
  const videos = useTrainingStore((s) => s.videoLinks);

  return (
    <AppShell>
      <section className="mx-auto max-w-2xl">
        <p className="font-display text-xs uppercase tracking-[0.22em] text-muted">
          Instruction
        </p>
        <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-tight">
          X locker
        </h1>
        <p className="mt-4 text-muted">
          Bookmark drill videos on X, copy the post link, and park it here.
          Assign each clip to a drill — then tap Watch from the library or
          mid-session.
        </p>
        <ol className="mt-5 space-y-2 text-sm text-subtle">
          <li>1. On X, open Bookmarks and copy the post URL.</li>
          <li>2. Paste it below. Add a short label if you want.</li>
          <li>3. Assign it to the matching drill.</li>
        </ol>

        <div className="mt-8 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <VideoAddForm />
        </div>

        <div className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-xl uppercase">Linked clips</h2>
            <Link to="/drills" className="text-sm text-muted hover:text-fg">
              Drill library
            </Link>
          </div>
          {videos.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Nothing linked yet. Start with one finishing or first-touch clip.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {videos.map((v) => (
                <li key={v.id}>
                  <VideoRow video={v} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </AppShell>
  );
}
