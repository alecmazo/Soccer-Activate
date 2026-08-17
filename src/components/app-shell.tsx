import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  CalendarDays,
  CircleDot,
  Clapperboard,
  Home,
  UserRound,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { persistLocker, LockerChip, useLockerSync } from "@/components/locker-sync";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { loadProgress, saveProgress } from "@/lib/server/training";
import { cn } from "@/lib/utils";
import {
  useHydrateTraining,
  useTrainingStore,
} from "@/store/training-store";

const NAV = [
  { to: "/", label: "Today", icon: Home },
  { to: "/program", label: "Program", icon: CalendarDays },
  { to: "/tracker", label: "Tracker", icon: Activity },
  { to: "/drills", label: "Drills", icon: CircleDot },
  { to: "/videos", label: "Videos", icon: Clapperboard },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  useHydrateTraining();
  const lockerOn = useLockerSync();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useCurrentUserState();
  const hydrated = useTrainingStore((s) => s.hydrated);
  const applyRemote = useTrainingStore((s) => s.applyRemote);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (isPending || !user || synced) return;
    let cancelled = false;
    loadProgress()
      .then((remote) => {
        if (cancelled) return;
        applyRemote(remote);
        setSynced(true);
      })
      .catch(() => {
        if (!cancelled) setSynced(true);
      });
    return () => {
      cancelled = true;
    };
  }, [applyRemote, isPending, synced, user]);

  return (
    <div className="pitch-grid min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-bg/85 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-sm bg-accent text-accent-fg">
              <CircleDot className="size-3.5" />
            </span>
            <span className="font-display text-lg uppercase tracking-[0.16em] text-fg">
              Activate
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm transition-colors duration-150",
                    active ? "bg-raised text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {import.meta.env.VITE_SPA === "1" ? (
            <LockerChip connected={lockerOn} />
          ) : (
            <AuthChip pending={isPending} />
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 md:pb-12">
        {hydrated ? children : <ShellSkeleton />}
      </main>

      <nav className="safe-pad fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] tracking-wide",
                  active ? "text-fg" : "text-subtle",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function AuthChip({ pending }: { pending: boolean }) {
  if (pending) {
    return <div className="size-8 animate-pulse rounded-full bg-raised" />;
  }
  return (
    <>
      <SignedIn>
        <Link
          to="/login"
          className="flex size-9 items-center justify-center rounded-full bg-raised text-muted"
          aria-label="Account"
        >
          <UserRound className="size-4" />
        </Link>
      </SignedIn>
      <SignedOut>
        <Link
          to="/login"
          className="rounded-md px-3 py-2 text-sm text-muted hover:text-fg"
        >
          Save path
        </Link>
      </SignedOut>
    </>
  );
}

export function persistIfSignedIn() {
  const state = useTrainingStore.getState();
  saveProgress({
    data: {
      profile: {
        playerName: state.playerName,
        preferredFoot: state.preferredFoot,
        mode: state.mode,
        onboardingDone: state.onboardingDone,
        streak: state.streak,
        lastSessionDate: state.lastSessionDate,
        pillarXp: state.pillarXp,
        records: state.records,
        videoLinks: state.videoLinks,
      },
    },
  }).catch(() => {
    /* signed out — local store is enough */
  });
  persistLocker();
}

function ShellSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-40 animate-pulse rounded-md bg-raised" />
      <div className="h-16 w-full max-w-md animate-pulse rounded-md bg-raised" />
      <div className="h-40 w-full animate-pulse rounded-2xl bg-surface" />
    </div>
  );
}
