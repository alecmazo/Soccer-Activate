import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { LockerSyncCard } from "@/components/locker-sync";
import { VideoAddForm, VideoRow } from "@/components/video-link-card";
import { X_BOOKMARKS_URL } from "@/lib/training/videos";
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
          Bookmarks on X stay private, so you paste the post links here. Assign
          each clip to the drills it teaches, then tap Watch from the library
          or mid-session — the video plays in-app. Turn on a locker so the
          same clips open on your phone.
        </p>
        <ol className="mt-5 space-y-2 text-sm text-subtle">
          <li>1. Open your X bookmarks and copy one or more post URLs.</li>
          <li>2. Paste them below (or use Paste bookmarks).</li>
          <li>3. Assign each clip to the matching drill.</li>
          <li>4. Tap Watch when you need the demo.</li>
          <li>5. Tap Use on other devices and open the link on your phone.</li>
        </ol>
        <a
          href={X_BOOKMARKS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-raised px-4 text-sm text-fg"
        >
          <Bookmark className="size-4" />
          Open my X bookmarks
        </a>

        <div className="mt-8">
          <LockerSyncCard />
        </div>

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
              Nothing linked yet. Start with one finishing or first-touch clip
              from your bookmarks.
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
